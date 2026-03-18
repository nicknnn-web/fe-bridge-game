/**
 * 文件管理路由模块
 * 处理上传文件和导出文件列表
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 获取上传文件列表
router.get('/uploads', asyncHandler(async (req, res) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    return res.json({ success: true, data: [] });
  }
  
  const files = fs.readdirSync(uploadsDir).filter(f => {
    return fs.statSync(path.join(uploadsDir, f)).isFile();
  });
  
  res.json({ success: true, data: files });
}));

// 获取导出文件列表
router.get('/exports', asyncHandler(async (req, res) => {
  const generatedDir = path.join(__dirname, '..', 'generated');
  if (!fs.existsSync(generatedDir)) {
    return res.json({ success: true, data: [] });
  }
  
  const files = fs.readdirSync(generatedDir).filter(f => {
    return fs.statSync(path.join(generatedDir, f)).isFile();
  });
  
  res.json({ success: true, data: files });
}));

module.exports = router;