/**
 * AI 引用状态路由模块
 * 处理文章在AI平台的引用检测
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const aiCitationService = require('../services/aiCitationService');

// 数据库选择
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const ArticleDB = useSQLite 
  ? require('../database/articleDB-sqlite') 
  : require('../database/articleDB');

// 获取AI引用配置
router.get('/config', asyncHandler(async (req, res) => {
  const config = aiCitationService.getConfig();
  res.json({ success: true, data: config });
}));

// 检测单篇文章的AI引用状态
router.post('/detect', asyncHandler(async (req, res) => {
  const { articleId, articleUrl, articleTitle } = req.body;
  if (!articleId) {
    throw new AppError('缺少文章ID', 400, 'MISSING_ARTICLE_ID');
  }
  const result = await aiCitationService.detectArticleStatus(
    articleId,
    articleUrl || `https://example.com/article/${articleId}`,
    articleTitle || '未知文章'
  );
  res.json({ success: true, data: result });
}));

// 批量检测多篇文章的AI引用状态
router.post('/batch-detect', asyncHandler(async (req, res) => {
  const { articles } = req.body;
  if (!articles || !Array.isArray(articles)) {
    throw new AppError('缺少文章列表', 400, 'MISSING_ARTICLES');
  }
  const results = await aiCitationService.batchDetectStatus(articles);
  res.json({ success: true, data: results });
}));

// 刷新所有文章的AI引用状态
router.post('/refresh-all', asyncHandler(async (req, res) => {
  const articleDB = new ArticleDB();
  const articles = await articleDB.getAll ? await articleDB.getAll() : [];
  const publishedArticles = articles
    .filter(a => a.status === 'published' || a.status === 'completed')
    .map(a => ({ id: a.id, title: a.title, url: a.url }));
  
  const results = await aiCitationService.refreshAllStatuses(publishedArticles);
  res.json({ success: true, data: results });
}));

// 获取缓存的AI引用状态
router.get('/status/:articleId', asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const status = aiCitationService.getCachedStatus(articleId);
  if (status) {
    res.json({ success: true, data: status });
  } else {
    res.json({
      success: true,
      data: {
        articleId,
        status: 'checking',
        icon: '⏳',
        label: '检测中',
        description: '正在获取AI引用状态',
        updatedAt: new Date().toISOString()
      }
    });
  }
}));

module.exports = router;