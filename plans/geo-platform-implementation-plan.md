# Auyologic GEO智能营销后台 - 功能实现方案

## 一、系统现状分析

### 1.1 现有页面结构（16个）
| 页面 | 功能描述 | 现状 |
|------|----------|------|
| index.html | 首页 | 静态展示 |
| dashboard.html | 数据概览 | 部分动态 |
| ai-report.html | AI体检报告 | 静态Mock |
| monitor.html | 诊断监控 | 静态Mock |
| report.html | 效果报表 | 静态Mock |
| knowledge.html | 企业知识库 | 静态Mock |
| brand.html | 企业品牌库 | 静态Mock |
| platform.html | 企业媒体矩阵 | 静态Mock |
| questions.html | 问题库管理 | 静态Mock |
| keywords.html | 关键词裂变 | 静态Mock |
| articles.html | 创作内容 | 部分动态 |
| publish.html | 发布管理 | 部分动态 |
| geo-tools.html | GEO优化检测 | 静态Mock |
| brand-visibility.html | 品牌可见度 | 静态Mock |

### 1.2 现有数据库表
- `articles` - 文章表 ✓ 完整
- `kb_documents` - 知识库文档 ✓ 完整
- `kb_chunks` - 知识库分块 ✓ 完整
- `geo_detections` - GEO检测历史 ✓ 有表
- `brand_detections` - 品牌检测历史 ✓ 有表
- `keyword_expansions` - 关键词扩展 ✓ 有表

### 1.3 需要新增的数据库表
| 表名 | 用途 |
|------|------|
| users | 用户管理 |
| questions | 问题库 |
| question_categories | 问题分类 |
| brands | 品牌库 |
| platforms | 媒体平台 |
| platform_accounts | 平台账号 |
| publish_records | 发布记录 |
| dashboard_stats | 仪表盘统计 |
| health_scores | 体检分数 |

---

## 二、功能模块详细设计

### 2.1 用户认证模块

#### 数据库设计
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  trial_end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### API接口
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/profile | 更新个人信息 |

---

### 2.2 AI体检报告模块

#### 数据库设计
```sql
CREATE TABLE health_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  overall_score INTEGER,
  content_quality_score INTEGER,
  link_health_score INTEGER,
  mobile_score INTEGER,
  speed_score INTEGER,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 功能
- 实时计算健康分数
- 历史分数趋势图
- 优化建议生成
- 对比行业平均

---

### 2.3 诊断监控模块

#### 功能
- 服务状态实时检测
- 响应时间监控
- 告警记录
- 性能趋势图

---

### 2.4 效果报表模块

#### 数据库设计
```sql
CREATE TABLE analytics (
  id TEXT PRIMARY KEY,
  date DATE,
  page_views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ai_citations INTEGER DEFAULT 0,
  platform VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### API接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/reports/dashboard | 仪表盘数据 |
| GET | /api/reports/trends | 趋势数据 |
| GET | /api/reports/platforms | 平台统计 |

---

### 2.5 企业知识库模块

#### 现有表结构（已存在）
- kb_documents
- kb_chunks

#### 新增功能
- 文件上传（PDF/DOCX/TXT）
- 文档智能解析
- 知识分类管理
- 搜索功能

---

### 2.6 企业品牌库模块

#### 数据库设计
```sql
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  tags TEXT,
  slogan TEXT,
  industry TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### API接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/brands | 获取品牌列表 |
| POST | /api/brands | 创建品牌 |
| PUT | /api/brands/:id | 更新品牌 |
| DELETE | /api/brands/:id | 删除品牌 |

---

### 2.7 企业媒体矩阵模块

#### 数据库设计
```sql
CREATE TABLE platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE platform_accounts (
  id TEXT PRIMARY KEY,
  platform_id TEXT REFERENCES platforms(id),
  account_name TEXT NOT NULL,
  account_id TEXT,
  followers INTEGER DEFAULT 0,
  binding_status TEXT DEFAULT 'pending',
  bound_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.8 问题库管理模块

#### 数据库设计
```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  category_id TEXT,
  heat_score INTEGER DEFAULT 0,
  generated_content_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  parent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.9 关键词裂变模块

#### 现有表（keyword_expansions）
- 需实现真正的AI扩展逻辑

#### 功能
- 基于问题库生成关键词
- 语义扩展
- 相关问题生成
- 长尾关键词挖掘

---

### 2.10 创作内容模块

#### 现有API（articles）
- 已有完整CRUD

#### 需增强
- 文章状态管理
- 审核流程
- 版本控制

---

### 2.11 发布管理模块

#### 数据库设计
```sql
CREATE TABLE publish_records (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id),
  platform_id TEXT,
  account_id TEXT,
  status TEXT DEFAULT 'pending',
  published_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.12 GEO优化检测模块

#### 现有Mock API
- 需实现真实检测逻辑
- URL抓取分析
- SEO评分计算

---

### 2.13 品牌可见度模块

#### 现有Mock API
- 需实现多平台监测
- AI搜索引用检测
- 竞品对比分析

---

## 三、实施计划

### 阶段一：核心基础设施
1. 实现用户认证系统
2. 完善数据库表结构
3. 建立API基础框架

### 阶段二：内容管理模块
4. 企业知识库功能
5. 问题库管理功能
6. 品牌库管理功能

### 阶段三：运营模块
7. 媒体矩阵管理
8. 发布管理功能
9. 效果报表

### 阶段四：高级功能
10. GEO检测增强
11. 品牌可见度增强
12. AI体检报告增强

---

## 四、技术架构

### 前端技术
- 纯HTML/CSS/JavaScript
- Chart.js 图表
- Fetch API 通信

### 后端技术
- Express.js
- SQLite（本地方便）
- AI服务集成

### 数据流
```
用户操作 → 前端JS → Fetch API → Express路由 → Service层 → SQLite数据库
                                    ↓
                              AI服务（如需要）
```
