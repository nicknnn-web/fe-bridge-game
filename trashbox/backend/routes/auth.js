/**
 * 用户认证路由模块
 * 处理用户注册、登录、资料管理
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const authService = require('../services/authService');

// 用户注册
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password) {
    throw new AppError('邮箱和密码不能为空', 400, 'MISSING_CREDENTIALS');
  }
  const user = await authService.register({ email, password, name, company });
  res.json({ success: true, data: user });
}));

// 用户登录
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('邮箱和密码不能为空', 400, 'MISSING_CREDENTIALS');
  }
  const user = await authService.login(email, password);
  res.json({ success: true, data: user });
}));

// 获取当前用户信息
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError('未登录', 401, 'UNAUTHORIZED');
  }
  const email = authHeader.replace('Bearer ', '');
  const user = await authService.getByEmail(email);
  if (!user) {
    throw new AppError('用户不存在', 401, 'USER_NOT_FOUND');
  }
  res.json({ success: true, data: user });
}));

// 更新用户资料
router.put('/profile', asyncHandler(async (req, res) => {
  const { userId, name, company, password } = req.body;
  if (!userId) {
    throw new AppError('用户ID不能为空', 400, 'MISSING_USER_ID');
  }
  const user = await authService.updateProfile(userId, { name, company, password });
  res.json({ success: true, data: user });
}));

module.exports = router;