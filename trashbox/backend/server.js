require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 导入路由和中间件
const routes = require('./routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库初始化
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const initDB = useSQLite 
  ? require('./database/sqlite').init 
  : require('./database/init').init;

// ========== 静态文件服务 ==========
// 前端文件在 auyologic-final/frontend 目录
const frontendPath = path.resolve(__dirname, '..', '..', 'auyologic-final', 'frontend');
console.log('[Static] Frontend path:', frontendPath);
app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// ========== 中间件 ==========
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// 确保 UTF-8 编码
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json({ charset: 'utf-8' }));

// ========== 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AuyoLogic API',
    version: '1.0.0'
  });
});

// ========== API 路由 ==========
app.use('/api', routes);

// ========== 错误处理 ==========
// 404 处理
app.use(notFoundHandler);
// 全局错误处理
app.use(globalErrorHandler);

// ========== 启动服务器 ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Database mode: ${useSQLite ? 'SQLite' : 'PostgreSQL'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 自动初始化数据库
  initDB().catch(err => {
    console.error('Database initialization failed:', err);
  });
});

module.exports = app;
