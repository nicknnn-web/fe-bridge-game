/**
 * 品牌管理路由模块
 * 处理品牌 CRUD 和检测历史
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const brandService = require('../services/brandService');

// 数据库选择
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const { run, get, all } = useSQLite 
  ? require('../database/sqlite') 
  : require('../database/init');

// 获取所有品牌
router.get('/', asyncHandler(async (req, res) => {
  const brands = await brandService.getAll();
  res.json({ success: true, data: brands });
}));

// 搜索品牌
router.get('/search', asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    throw new AppError('关键词不能为空', 400, 'MISSING_KEYWORD');
  }
  const brands = await brandService.search(keyword);
  res.json({ success: true, data: brands });
}));

// 获取单个品牌
router.get('/:id', asyncHandler(async (req, res) => {
  const brand = await brandService.getById(req.params.id);
  if (!brand) {
    throw new AppError('品牌不存在', 404, 'BRAND_NOT_FOUND');
  }
  res.json({ success: true, data: brand });
}));

// 创建品牌
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, logo_url, tags, slogan, industry } = req.body;
  if (!name) {
    throw new AppError('品牌名称不能为空', 400, 'MISSING_BRAND_NAME');
  }
  const brand = await brandService.create({ 
    name, description, logo_url, tags, slogan, industry 
  });
  res.json({ success: true, data: brand });
}));

// 更新品牌
router.put('/:id', asyncHandler(async (req, res) => {
  const brand = await brandService.update(req.params.id, req.body);
  if (!brand) {
    throw new AppError('品牌不存在', 404, 'BRAND_NOT_FOUND');
  }
  res.json({ success: true, data: brand });
}));

// 删除品牌
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await brandService.delete(req.params.id);
  if (!deleted) {
    throw new AppError('品牌不存在', 404, 'BRAND_NOT_FOUND');
  }
  res.json({ success: true, message: '品牌已删除' });
}));

// ===== 品牌检测历史 =====

// 执行品牌检测
router.post('/detect', asyncHandler(async (req, res) => {
  const { brand, industry } = req.body;
  
  // 返回模拟数据（后续替换为真实检测逻辑）
  res.json({
    success: true,
    data: {
      id: 'brand_' + Date.now(),
      brandName: brand || '测试品牌',
      industry: industry || 'tech',
      overallScore: 82,
      scores: {
        deepseek: 85,
        doubao: 78,
        kimi: 80,
        tongyi: 83,
        wenxin: 79,
        yuanbao: 75
      },
      mentions: {
        totalMentions: 156,
        sentimentDistribution: { positive: 120, neutral: 28, negative: 8 }
      },
      recommendations: [
        { 
          priority: 'high', 
          title: '增加品牌内容输出', 
          description: '在知乎、百家号等平台发布更多专业内容', 
          impact: '可提升品牌提及率30%' 
        }
      ],
      createdAt: new Date().toISOString()
    }
  });
}));

// 获取检测历史列表
router.get('/history/list', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // 查询数据库获取真实历史数据
  try {
    const items = await all(
      'SELECT * FROM brand_detections ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, (page - 1) * limit]
    );
    const total = await get('SELECT COUNT(*) as count FROM brand_detections');
    
    const formattedItems = items.map(item => ({
      id: item.id,
      brandName: item.brand_name,
      industry: item.industry,
      overallScore: item.overall_score,
      createdAt: item.created_at
    }));
    
    res.json({
      success: true,
      data: {
        items: formattedItems.length > 0 ? formattedItems : [
          { id: 'brand_1', brandName: '奥呦科技', overallScore: 82, createdAt: new Date().toISOString() }
        ],
        pagination: { page, limit, total: total?.count || 1, totalPages: Math.ceil((total?.count || 1) / limit) }
      }
    });
  } catch (error) {
    // 如果表不存在，返回模拟数据
    res.json({
      success: true,
      data: {
        items: [
          { id: 'brand_1', brandName: '奥呦科技', overallScore: 82, createdAt: new Date().toISOString() }
        ],
        pagination: { page, limit, total: 1, totalPages: 1 }
      }
    });
  }
}));

// 获取检测详情
router.get('/detail/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await get('SELECT * FROM brand_detections WHERE id = ?', [id]);
  
  if (!item) {
    // 返回模拟数据
    res.json({
      success: true,
      data: {
        id: id,
        brandName: '测试品牌',
        industry: 'tech',
        overallScore: 82,
        scores: { deepseek: 85, doubao: 78, kimi: 80, qwen: 83, ernie: 79, yuanbao: 75 },
        mentions: { totalMentions: 156, sentimentDistribution: { positive: 120, neutral: 28, negative: 8 } },
        recommendations: [],
        createdAt: new Date().toISOString()
      }
    });
    return;
  }
  
  const mentions = JSON.parse(item.mentions_data || '{}');
  const recommendations = JSON.parse(item.recommendations || '[]');
  
  res.json({
    success: true,
    data: {
      id: item.id,
      brandName: item.brand_name,
      industry: item.industry,
      overallScore: item.overall_score,
      scores: {
        deepseek: item.deepseek_score,
        doubao: item.doubao_score,
        kimi: item.kimi_score,
        qwen: item.qwen_score,
        ernie: item.ernie_score,
        yuanbao: item.yuanbao_score
      },
      mentions,
      recommendations,
      createdAt: item.created_at
    }
  });
}));

// 删除检测记录
router.delete('/history/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await run('DELETE FROM brand_detections WHERE id = ?', [id]);
  
  if (!result || result.changes === 0) {
    throw new AppError('检测记录不存在', 404, 'RECORD_NOT_FOUND');
  }
  
  console.log(`[Brand] 删除检测记录: ${id}`);
  res.json({ success: true, message: '检测记录已删除' });
}));

module.exports = router;