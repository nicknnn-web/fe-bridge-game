# Dashboard 功能检查报告

## 🔍 发现的问题

### 问题 1: API 端点不匹配

**旧端点（dashboard.html 中可能使用的）:**
- `/api/reports/dashboard` - 已被删除 ❌

**新端点（重构后）:**
- `/api/dashboard/stats` - 统计数据 ✅
- `/api/dashboard/reports` - 报表数据 ✅

**影响**: 如果 dashboard.html 调用了旧端点，会 404

---

### 问题 2: Dashboard 页面完全是静态的

**现状**: dashboard.html 中所有数据都是 mock 的：
- 曝光度、提及次数等指标是随机生成的
- 图表数据是硬编码的
- 没有从后端 API 获取真实数据

**代码片段**:
```javascript
// 随机生成数据
document.getElementById('metricExposure').textContent = (75 + Math.random() * 20).toFixed(1) + '%';

// 硬编码图表数据
const config = createPieChartConfig({
    data: [
        { value: 35, name: '知识库文章' },  // 静态数据
        { value: 25, name: '品牌官网' },
        ...
    ]
});
```

---

### 问题 3: 后端 API 依赖的服务可能不存在

**dashboard.js 调用**:
```javascript
const brands = await brandService.getAll();
const platforms = await platformService.getAllAccounts();
const questions = await questionService.getAll();
```

**潜在问题**:
- 如果数据库表 `brands`、`platform_accounts`、`questions` 不存在，会报错
- 需要检查这些表是否已创建

---

## ✅ 需要验证的测试

### 测试 1: API 端点
```bash
curl http://localhost:3001/api/dashboard/stats
curl http://localhost:3001/api/dashboard/reports
```

### 测试 2: 服务方法
检查以下方法是否能正常返回数据：
- `brandService.getAll()`
- `platformService.getAllAccounts()`
- `questionService.getAll()`

### 测试 3: 数据库表
```sql
-- 检查表是否存在
SELECT name FROM sqlite_master WHERE type='table';
```

---

## 🛠️ 修复建议

### 方案 A: 快速修复（保持静态）
如果 dashboard 只需要展示，暂时保持静态数据，不做 API 调用。

### 方案 B: 完整修复（添加动态数据）
1. 修改 dashboard.html 添加 API 调用
2. 确保后端服务和数据库表存在
3. 从后端获取真实数据渲染

---

## 📋 当前状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 页面加载 | ✅ | 静态页面能正常显示 |
| 图表显示 | ✅ | ECharts 图表正常 |
| 数据动态加载 | ❌ | 没有调用 API |
| API 端点 | ⚠️ | 新端点已创建，但未对接 |
| 数据库表 | ⚠️ | 可能缺少必要的表 |

---

## 🎯 建议

**内测阶段**：保持现状，dashboard 作为静态展示页面使用。

**如果要修复**：
1. 先运行测试脚本确认 API 是否正常
2. 检查数据库表是否存在
3. 再决定是否添加动态数据加载
