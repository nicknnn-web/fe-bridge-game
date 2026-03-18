# Dashboard 页面拆分计划

## 背景

当前 `dashboard.html` 是一个约 4400 行的单文件，包含多个功能模块的标签页。根据专业架构建议，需要拆分为多页面架构（MPA）以提升：
- Agent 开发友好度
- 代码可维护性
- 后端集成便利性
- 加载性能

## 当前功能模块（基于 dashboard.html 分析）

| 模块 | 对应Tab | 优先级 |
|------|---------|--------|
| AI体检报告 | tab-aiReport | 高 |
| 数据概览 | tab-overview | 高 |
| 诊断监控 | tab-diagmonitor | 高 |
| 企业知识库 | tab-knowledge | 高 |
| 企业品牌库 | tab-brand | 中 |
| 创作内容 | tab-articles | 高 |
| 问题库 | tab-questionBank | 中 |
| 关键词裂变 | tab-keyword | 中 |
| 发布管理 | tab-publish | 高 |
| 效果报表 | tab-report | 高 |
| GEO优化工具 | tab-geoTools | 高 |
| 企业媒体矩阵 | tab-platform | 中 |
| 企业品牌可见度 | tab-brandVisibility | 中 |

## 拆分方案：分层多页面架构

### 目录结构

```
auyologic-final/frontend/
├── index.html              # 首页/登录页
├── base.html               # 基础布局（包含左侧菜单、顶部导航）
├── dashboard.html           # 主仪表盘（数据概览）
├── publish.html            # 发布管理
├── knowledge.html          # 企业知识库
├── geo-tools.html          # GEO优化工具
├── report.html             # 效果报表
├── articles.html           # 创作内容
├── brand.html              # 企业品牌库
├── platform.html           # 企业媒体矩阵
├── ai-report.html          # AI体检报告
├── monitor.html            # 诊断监控
├── questions.html          # 问题库
├── keywords.html           # 关键词裂变
├── brand-visibility.html   # 企业品牌可见度
├── css/
│   ├── base.css            # 基础布局样式
│   └── components.css      # 通用组件样式
└── js/
    ├── common.js            # 共享函数（API封装）
    ├── router.js           # 页面路由
    └── charts.js           # 图表配置
```

### base.html 核心结构

```html
<!-- 基础布局 -->
<!DOCTYPE html>
<html>
<head>
    <!-- 公共CSS -->
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- 顶部导航 -->
    <nav class="top-nav">...</nav>
    
    <div class="main">
        <!-- 左侧菜单 -->
        <aside class="sidebar">
            <!-- 菜单项带 active 状态 -->
            <a href="dashboard.html" class="active">数据概览</a>
            <a href="publish.html">发布管理</a>
            ...
        </aside>
        
        <!-- 内容区 - 各页面继承时填充 -->
        <main class="content">
            {% block content %}{% endblock %}
        </main>
    </div>
    
    <!-- 公共JS -->
    <script src="js/common.js"></script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

## 实施步骤

### 阶段1：基础架构（优先）

1. **创建 base.html**
   - 提取顶部导航
   - 提取左侧菜单
   - 提取公共CSS变量和样式
   - 定义内容区块模板

2. **创建 common.js**
   - API 请求封装
   - 通用工具函数
   - Toast 通知函数

3. **创建 dashboard.html**（原 tab-overview）
   - 继承 base.html
   - 只包含数据概览内容

### 阶段2：核心功能拆分

4. **拆分发布管理 publish.html**
5. **拆分企业知识库 knowledge.html**
6. **拆分GEO优化工具 geo-tools.html**
7. **拆分效果报表 report.html**

### 阶段3：其他模块

8. **拆分创作内容 articles.html**
9. **拆分AI体检报告 ai-report.html**
10. **拆分诊断监控 monitor.html**
11. **拆分剩余模块**

### 阶段4：优化

12. **配置后端路由**（可选）
13. **添加页面权限控制**（可选）

## 关键决策点

1. **模板引擎选择**：
   - 方案A：使用纯HTML + 静态链接（简单，Agent友好）
   - 方案B：使用 Jinja2/EJS 模板（需要Node.js/Python后端）
   
   **建议**：初期使用纯HTML，保留扩展性

2. **菜单状态管理**：
   - 每个HTML文件设置对应的 `active` 类
   - 不需要复杂的前端路由

3. **API 层设计**：
   - 所有后端调用封装在 common.js
   - 后续对接数据库时只需修改 common.js

## 迁移风险控制

- 保留原 dashboard.html 作为备份
- 采用渐进式拆分，每次只拆一个小模块
- 拆分后立即在浏览器测试验证

## 预期收益

1. **单文件行数**：从 4400+ 行 → 每页 300-500 行
2. **加载性能**：按需加载，减少初始加载时间
3. **维护成本**：修改特定功能不影响其他模块
4. **后端集成**：清晰的路由对应关系
