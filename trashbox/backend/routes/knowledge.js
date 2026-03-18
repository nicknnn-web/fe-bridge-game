/**
 * 知识库路由模块
 * 处理文档上传、查询、管理
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const knowledgeBaseService = require('../services/knowledgeBaseService');
const fileParser = require('../utils/fileParser');

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + path.extname(decodedName));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'text/x-markdown'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。请上传 PDF、Word 或文本文件。'));
    }
  }
});

// 解码 multer 字段
function decodeMulterFields(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        const val = req.body[key];
        try {
          const bytes = Buffer.from(val, 'binary');
          const decoded = bytes.toString('utf8');
          if (decoded !== val && !decoded.includes('\uFFFD')) {
            req.body[key] = decoded;
          }
        } catch (e) {}
      }
    }
  }
  next();
}

// 获取文档列表
router.get('/files', asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category,
    health: req.query.health,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    page: req.query.page,
    pageSize: req.query.pageSize
  };
  
  const [files, total] = await Promise.all([
    knowledgeBaseService.getAllDocuments(filters),
    knowledgeBaseService.getDocumentsCount(filters)
  ]);
  
  res.json({
    success: true,
    data: files,
    pagination: {
      total,
      page: parseInt(filters.page) || 1,
      pageSize: parseInt(filters.pageSize) || 12,
      totalPages: Math.ceil(total / (parseInt(filters.pageSize) || 12))
    }
  });
}));

// 获取知识库统计
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await knowledgeBaseService.getStats();
  res.json({ success: true, data: stats });
}));

// 上传文件
router.post('/upload', upload.single('file'), decodeMulterFields, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('没有上传文件', 400, 'MISSING_FILE');
  }

  req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const parsed = await fileParser.parse(req.file.path, req.file.mimetype);

  const options = {
    category: req.body.category || 'enterprise',
    title: req.body.title || req.file.originalname,
    tags: req.body.tags ? JSON.parse(req.body.tags) : []
  };

  const result = await knowledgeBaseService.saveDocument(req.file, parsed.text, options);

  res.json({
    success: true,
    message: '文件上传并处理成功',
    data: result
  });
}));

// 查询知识库
router.post('/query', asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    throw new AppError('查询内容不能为空', 400, 'EMPTY_QUERY');
  }
  const result = await knowledgeBaseService.query(query);
  res.json({ success: true, data: result });
}));

// 删除文档
router.delete('/files/:id', asyncHandler(async (req, res) => {
  await knowledgeBaseService.deleteDocument(req.params.id);
  res.json({ success: true, message: '文件已删除' });
}));

// 下载文档
router.get('/files/:id/download', asyncHandler(async (req, res) => {
  const doc = await knowledgeBaseService.getDocumentById(req.params.id);
  if (!doc) {
    throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND');
  }
  if (!fs.existsSync(doc.file_path)) {
    throw new AppError('文件已删除或不存在', 404, 'FILE_NOT_FOUND');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  fs.createReadStream(doc.file_path).pipe(res);
}));

module.exports = router;