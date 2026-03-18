/**
 * 媒体平台路由模块
 * 处理平台管理和账号绑定
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const platformService = require('../services/platformService');

// 获取所有平台
router.get('/', asyncHandler(async (req, res) => {
  const platforms = await platformService.getAll();
  res.json({ success: true, data: platforms });
}));

// 获取平台统计
router.get('/stats', asyncHandler(async (req, res) => {
  const boundCount = await platformService.getBoundAccountsCount();
  const totalFollowers = await platformService.getTotalFollowers();
  res.json({
    success: true,
    data: {
      boundAccounts: boundCount,
      totalFollowers: totalFollowers
    }
  });
}));

// ===== 平台账号管理 =====

router.get('/accounts/list', asyncHandler(async (req, res) => {
  const accounts = await platformService.getAllAccounts();
  res.json({ success: true, data: accounts });
}));

router.post('/accounts', asyncHandler(async (req, res) => {
  const { platform_id, account_name, account_id, followers } = req.body;
  if (!platform_id || !account_name) {
    throw new AppError('平台ID和账号名称不能为空', 400, 'MISSING_REQUIRED_FIELDS');
  }
  const account = await platformService.createAccount({ 
    platform_id, account_name, account_id, followers 
  });
  res.json({ success: true, data: account });
}));

router.put('/accounts/:id', asyncHandler(async (req, res) => {
  const account = await platformService.updateAccount(req.params.id, req.body);
  if (!account) {
    throw new AppError('账号不存在', 404, 'ACCOUNT_NOT_FOUND');
  }
  res.json({ success: true, data: account });
}));

router.delete('/accounts/:id', asyncHandler(async (req, res) => {
  const deleted = await platformService.deleteAccount(req.params.id);
  if (!deleted) {
    throw new AppError('账号不存在', 404, 'ACCOUNT_NOT_FOUND');
  }
  res.json({ success: true, message: '账号已删除' });
}));

module.exports = router;