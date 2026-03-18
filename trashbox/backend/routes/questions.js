/**
 * 问题库路由模块
 * 处理问题 CRUD 和分类管理
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const questionService = require('../services/questionService');

// 获取所有问题
router.get('/', asyncHandler(async (req, res) => {
  const questions = await questionService.getAll();
  res.json({ success: true, data: questions });
}));

// 搜索问题
router.get('/search', asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    throw new AppError('关键词不能为空', 400, 'MISSING_KEYWORD');
  }
  const questions = await questionService.search(keyword);
  res.json({ success: true, data: questions });
}));

// 获取单个问题
router.get('/:id', asyncHandler(async (req, res) => {
  const question = await questionService.getById(req.params.id);
  if (!question) {
    throw new AppError('问题不存在', 404, 'QUESTION_NOT_FOUND');
  }
  res.json({ success: true, data: question });
}));

// 创建问题
router.post('/', asyncHandler(async (req, res) => {
  const { content, category_id, heat_score, status } = req.body;
  if (!content) {
    throw new AppError('问题内容不能为空', 400, 'MISSING_CONTENT');
  }
  const question = await questionService.create({ content, category_id, heat_score, status });
  res.json({ success: true, data: question });
}));

// 更新问题
router.put('/:id', asyncHandler(async (req, res) => {
  const question = await questionService.update(req.params.id, req.body);
  if (!question) {
    throw new AppError('问题不存在', 404, 'QUESTION_NOT_FOUND');
  }
  res.json({ success: true, data: question });
}));

// 删除问题
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await questionService.delete(req.params.id);
  if (!deleted) {
    throw new AppError('问题不存在', 404, 'QUESTION_NOT_FOUND');
  }
  res.json({ success: true, message: '问题已删除' });
}));

// ===== 问题分类 =====

router.get('/categories/all', asyncHandler(async (req, res) => {
  const categories = await questionService.getAllCategories();
  res.json({ success: true, data: categories });
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const { name, color, parent_id } = req.body;
  if (!name) {
    throw new AppError('分类名称不能为空', 400, 'MISSING_NAME');
  }
  const category = await questionService.createCategory({ name, color, parent_id });
  res.json({ success: true, data: category });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const deleted = await questionService.deleteCategory(req.params.id);
  if (!deleted) {
    throw new AppError('分类不存在', 404, 'CATEGORY_NOT_FOUND');
  }
  res.json({ success: true, message: '分类已删除' });
}));

module.exports = router;