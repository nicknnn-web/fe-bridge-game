# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auyologic GEO Platform - AI驱动的GEO(Generative Engine Optimization)智能营销后台，帮助企业提升在AI搜索引擎中的品牌曝光和引用率。

**项目结构**:
- `auyologic-final/` - 前端目录，纯HTML/CSS/JS实现
- `trashbox/backend/` - Node.js/Express后端API

## Development Commands

### Backend Development (trashbox/backend/)

```bash
cd trashbox/backend

# 安装依赖
npm install

# 启动开发服务器
npm start

# 服务器默认运行在 http://localhost:3001
```

### Environment Variables

后端需要 `.env` 文件，关键配置:

```env
# Database: SQLite用于本地开发，PostgreSQL用于生产
USE_SQLITE=true
DATABASE_URL=postgresql://...

# AI API Keys
DEEPSEEK_API_KEY=sk-...
SILICONFLOW_API_KEY=sk-...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development
```

## Architecture

### Backend Architecture (Express.js)

**分层结构**:
```
routes/        # API路由层 - 处理HTTP请求/响应
services/      # 业务逻辑层 - 核心业务实现
database/      # 数据访问层 - SQLite/PostgreSQL抽象
middleware/    # 中间件 - 认证、错误处理
config/        # 配置 - AI提供商配置
```

**关键模式**:

1. **数据库切换**: 通过环境变量 `USE_SQLITE` 自动切换 SQLite/PostgreSQL:
   ```js
   const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
   const ArticleDB = useSQLite ? require('./database/articleDB-sqlite') : require('./database/articleDB');
   ```

2. **错误处理**: 统一使用 `AppError` 类和 `asyncHandler` 包装器:
   ```js
   const { asyncHandler, AppError } = require('../middleware/errorHandler');
   router.get('/', asyncHandler(async (req, res) => { ... }));
   ```

3. **认证**: JWT Bearer Token，使用 `authenticate` 中间件保护路由。

4. **AI Provider配置**: `config/aiProviders.js` 集中管理Deepseek/SiliconFlow配置，支持 `provider/model` 格式选择模型。

### API路由结构

- `/api/articles` - 文章生成、CRUD、批量操作、导出
- `/api/auth` - 用户认证
- `/api/brands` - 品牌管理
- `/api/geo` - GEO检测
- `/api/kb` - 知识库文档管理
- `/api/questions` - 问题库
- `/api/platforms` - 平台账号管理
- `/api/ai-citation` - AI引用分析
- `/api/keywords` - 关键词扩展
- `/api/dashboard` - 仪表盘数据
- `/api/files` - 文件上传
- `/api/system/init` - 数据库初始化

### Frontend Architecture

纯静态HTML/CSS/JS实现，无构建步骤:
- `index.html` - 营销首页
- `dashboard.html` - 后台仪表盘
- `articles.html` - 文章管理
- `knowledge.html` - 知识库
- `*.html` - 其他功能页面

**部署**: Vercel部署，`vercel.json` 配置路由重写。

## Key Implementation Details

1. **文章生成流程**: `services/articleService.js` 调用 Deepseek/SiliconFlow API，解析生成的内容（自动提取摘要、关键词），存入SQLite。

2. **批量生成**: `services/batchArticleService.js` 使用异步队列处理多篇文章生成。

3. **知识库文档**: 支持PDF/DOCX上传，解析后分块存储，用于RAG。

4. **数据库初始化**: 访问 `/api/system/init` 或服务器启动时自动执行 `database/sqlite.js` 中的 `init()`。

5. **静态文件**: 后端提供 `../frontend` 目录作为静态文件服务，同时支持 `/uploads` 和 `/generated` 目录。
