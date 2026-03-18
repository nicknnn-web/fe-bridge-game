# 静态数据页面分析报告

## 📊 使用静态/Mock 数据的页面

| 页面 | 静态数据类型 | 严重程度 | 修改优先级 |
|------|-------------|----------|-----------|
| [`dashboard.html`](auyologic-final/frontend/dashboard.html) | 核心指标 + 图表 | 🔴 高 | P0 |
| [`geo-detection.html`](auyologic-final/frontend/geo-detection.html) | 检测结果分数 | 🟡 中 | P1 |
| [`geo-tools.html`](auyologic-final/frontend/geo-tools.html) | 工具分数 | 🟡 中 | P1 |
| [`brand-visibility.html`](auyologic-final/frontend/brand-visibility.html) | 品牌可见度趋势 | 🟢 低 | P2 |
| [`competitor-analysis.html`](auyologic-final/frontend/competitor-analysis.html) | 竞品对比数据 | 🟢 低 | P2 |
| [`platform-analysis.html`](auyologic-final/frontend/platform-analysis.html) | 平台分析数据 | 🟢 低 | P2 |
| [`citation-rank.html`](auyologic-final/frontend/citation-rank.html) | 引用排名数据 | 🟢 低 | P2 |
| [`topic-analysis.html`](auyologic-final/frontend/topic-analysis.html) | 话题趋势数据 | 🟢 低 | P2 |

---

## 🔴 高优先级修改建议

### 1. Dashboard 页面 (dashboard.html)

**当前问题：**
```javascript
// 随机生成数据
document.getElementById('metricExposure').textContent = (75 + Math.random() * 20).toFixed(1) + '%';
document.getElementById('metricMentions').textContent = (1000 + Math.floor(Math.random() * 500)).toLocaleString();

// 硬编码图表数据
const config = createPieChartConfig({
    data: [
        { value: 35, name: '知识库文章' },  // 静态
        { value: 25, name: '品牌官网' },
        ...
    ]
});
```

**修改方案：**
```javascript
// 添加在 DOMContentLoaded 中
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            document.getElementById('metricArticles').textContent = data.totalArticles;
            document.getElementById('metricBrands').textContent = data.totalBrands;
            document.getElementById('metricPlatforms').textContent = data.boundPlatforms;
            document.getElementById('metricQuestions').textContent = data.totalQuestions;
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 修改 refreshDashboard 函数
function refreshDashboard() {
    showToast('🔄 正在刷新数据...');
    loadDashboardData();  // 调用 API 加载真实数据
    
    // 刷新图表
    exposureChart.resize();
    citationChart.resize();
    platformChart.resize();
}
```

---

## 🟡 中优先级修改建议

### 2. GEO 检测页面 (geo-detection.html & geo-tools.html)

**当前问题：**
```javascript
// 随机生成分数
'<td><span class="geo-score-badge">' + Math.floor(Math.random() * 30 + 60) + '</span></td>'
```

**修改方案：**
```javascript
// 调用真实的 GEO 检测 API
async function performGeoDetection(url, brand, depth) {
    const response = await fetch(`${API_BASE_URL}/geo/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brand, depth })
    });
    const result = await response.json();
    return result.data.overallScore;  // 使用真实分数
}
```

---

## 🟢 低优先级（图表趋势数据）

### 3. 品牌可见度、竞品分析等页面

**这些页面的趋势图表使用随机数据是合理的**，因为：
- 趋势数据需要时间积累
- 内测阶段没有历史数据
- 图表主要展示样式，数据不是关键

**可选修改方案：**
```javascript
// 如果需要，可以从 API 获取历史趋势
async function loadTrendData() {
    const response = await fetch(`${API_BASE_URL}/dashboard/reports`);
    const result = await response.json();
    
    if (result.success) {
        const trendData = result.data.geo.recentTrend;
        // 用真实趋势数据渲染图表
        updateChart(trendData);
    }
}
```

---

## 🎯 修改建议总结

### 必须修改（内测前）
1. ✅ **Dashboard 核心指标** - 对接 `/api/dashboard/stats`
2. ✅ **文章列表** - 对接 `/api/articles`（如果已经动态化则跳过）
3. ✅ **品牌列表** - 对接 `/api/brands`

### 建议修改（可选）
4. 🔄 **GEO 检测分数** - 对接 `/api/geo/detect`
5. 🔄 **知识库文件** - 对接 `/api/kb/files`

### 可以保留静态（内测阶段）
6. ⏸️ 趋势图表数据
7. ⏸️ 分析报告的示例数据
8. ⏸️ 排名对比的模拟数据

---

## 💡 快速修复代码模板

```javascript
// 在 dashboard.html 中添加
async function loadRealData() {
    try {
        const [statsRes, reportsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/dashboard/stats`),
            fetch(`${API_BASE_URL}/dashboard/reports`)
        ]);
        
        const stats = await statsRes.json();
        const reports = await reportsRes.json();
        
        if (stats.success) {
            updateMetrics(stats.data);
        }
        
        if (reports.success) {
            updateCharts(reports.data);
        }
    } catch (err) {
        console.error('数据加载失败:', err);
    }
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', loadRealData);
```

---

## 📋 下一步行动

1. **立即**：修改 dashboard.html 对接 API
2. **本周**：修改 GEO 检测页面
3. **后续**：根据需求决定是否修改图表趋势数据

需要我帮你修改 dashboard.html 吗？