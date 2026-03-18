/**
 * 文章管理路由模块
 * 处理文章生成、CRUD、批量操作和导出
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const { getAllProviders } = require('../config/aiProviders');
const articleService = require('../services/articleService');
const batchArticleService = require('../services/batchArticleService');
const exportService = require('../services/exportService');

// 数据库选择
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const ArticleDB = useSQLite 
  ? require('../database/articleDB-sqlite') 
  : require('../database/articleDB');

// AI 提供商列表
router.get('/providers', (req, res) => {
  res.json({ success: true, data: getAllProviders() });
});

// 获取所有文章
router.get('/', asyncHandler(async (req, res) => {
  const db = new ArticleDB();
  const articles = await db.getAll();
  res.json({ success: true, data: articles });
}));

// 获取单篇文章
router.get('/:id', asyncHandler(async (req, res) => {
  const db = new ArticleDB();
  const article = await db.getById(req.params.id);
  if (!article) {
    throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
  }
  res.json({ success: true, data: article });
}));

// 生成文章
router.post('/generate', asyncHandler(async (req, res) => {
  const { title, style, extraRequirements, model } = req.body;
  if (!title) {
    throw new AppError('标题不能为空', 400, 'MISSING_TITLE');
  }
  const article = await articleService.generateArticle({ 
    title, 
    style, 
    extraRequirements, 
    model 
  });
  res.json({ success: true, data: article });
}));

// 批量生成文章
router.post('/batch', asyncHandler(async (req, res) => {
  const { titles, name, style, extraRequirements, model } = req.body;
  if (!titles || !Array.isArray(titles)) {
    throw new AppError('titles 参数必须是数组', 400, 'INVALID_TITLES');
  }
  const result = await batchArticleService.createBatchTask(
    titles, 
    { name, style, extraRequirements, model }
  );
  res.json({ success: true, data: result });
}));

// 获取批量任务状态
router.get('/batch/:taskId', asyncHandler(async (req, res) => {
  const status = await batchArticleService.getTaskStatus(req.params.taskId);
  if (!status) {
    throw new AppError('任务不存在', 404, 'TASK_NOT_FOUND');
  }
  res.json({ success: true, data: status });
}));

// 更新文章
router.put('/:id', asyncHandler(async (req, res) => {
  const db = new ArticleDB();
  const article = await db.update(req.params.id, req.body);
  if (!article) {
    throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
  }
  res.json({ success: true, data: article });
}));

// 删除文章
router.delete('/:id', asyncHandler(async (req, res) => {
  const db = new ArticleDB();
  const deleted = await db.delete(req.params.id);
  if (!deleted) {
    throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
  }
  res.json({ success: true, message: '文章已删除' });
}));

// 导出文章
router.get('/:id/export', asyncHandler(async (req, res) => {
  const { format = 'markdown', template = 'simple' } = req.query;
  const db = new ArticleDB();
  const article = await db.getById(req.params.id);
  
  if (!article) {
    throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
  }

  await db.recordExport(req.params.id);

  if (format === 'markdown') {
    const result = exportService.exportToMarkdown(article, { template });
    const encodedFilename = encodeURIComponent(result.filename);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.send(result.content);
  } else if (format === 'html') {
    const html = exportService.exportToHTML(article, { template });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    throw new AppError('不支持的导出格式', 400, 'UNSUPPORTED_FORMAT');
  }
}));

module.exports = router;