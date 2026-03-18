/**
 * 关键词路由模块
 * 处理关键词扩展和历史记录
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 关键词扩展
router.post('/expand', asyncHandler(async (req, res) => {
  const { mainKeyword, brand } = req.body;
  
  res.json({
    success: true,
    data: {
      id: 'kw_' + Date.now(),
      mainKeyword: mainKeyword || 'AI营销',
      brand: brand || '',
      provider: 'deepseek',
      expandedKeywords: [
        `${mainKeyword}平台`, `${mainKeyword}服务`, `${mainKeyword}公司`,
        `最佳${mainKeyword}`, `${mainKeyword}排名`, `${mainKeyword}推荐`
      ],
      relatedQuestions: [
        `${mainKeyword}哪家好？`, `如何选择${mainKeyword}？`, `${mainKeyword}多少钱？`
      ],
      longTailKeywords: [
        `武汉${mainKeyword}`, `湖北${mainKeyword}`, `2025年${mainKeyword}趋势`
      ],
      createdAt: new Date().toISOString()
    }
  });
}));

// 获取扩展历史
router.get('/history', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }
  });
}));

module.exports = router;