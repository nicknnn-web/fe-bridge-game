# GEO优化检测UI模块实现计划

## 需求概述
在 [`geo-tools.html`](auyologic-final/frontend/geo-tools.html) 页面添加新的GEO优化检测UI模块，包含两个主要部分：
1. **检测参数设置卡片**（顶部）
2. **检测历史卡片**（底部）

## 技术实现方案

### 1. 样式映射（Tailwind → 自定义CSS）

由于项目使用自定义CSS（base.css），需要将Tailwind样式映射到现有样式系统：

| Tailwind类 | 自定义CSS实现 |
|------------|---------------|
| `bg-slate-800/50` | `background: var(--bg-card)` + `opacity: 0.5` |
| `border border-slate-700` | `border: 1px solid var(--border)` |
| `rounded-xl` | `border-radius: 12px` |
| `p-6` | `padding: 1.5rem` |
| `text-xl font-bold text-white` | `font-size: 1.25rem; font-weight: 600; color: var(--text)` |
| `grid grid-cols-2 gap-6` | `display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem` |
| `bg-slate-900` | `background: var(--bg-input)` |
| `text-slate-400` | `color: var(--text-secondary)` |
| `text-slate-200` | `color: var(--text)` |
| `from-blue-500 to-cyan-400` | `var(--gp)` 或 `linear-gradient(135deg, #0EA5E9, #06B6D4)` |
| `bg-blue-500/20 text-blue-300` | `background: rgba(14,165,233,0.2); color: var(--primary-light)` |

### 2. 新增CSS样式

需要在 [`base.css`](auyologic-final/frontend/css/base.css) 中添加以下样式：

```css
/* GEO检测模块专用样式 */
.geo-detection-card {
    background: var(--bg-card);
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
}

.geo-section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1.5rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--primary);
}

.geo-form-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.geo-question-tag {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: rgba(14, 165, 233, 0.2);
    color: var(--primary-light);
    border-radius: 100px;
    font-size: 0.75rem;
}

.geo-btn-primary {
    width: 100%;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #0EA5E9, #06B6D4);
    color: #fff;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.geo-btn-primary:hover {
    opacity: 0.9;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.25);
}

.geo-btn-outline {
    padding: 0.4rem 0.8rem;
    background: transparent;
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
}

.geo-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
}
```

### 3. HTML结构

在 `geo-tools.html` 的 `<main class="content">` 中替换或添加新内容：

```html
<!-- 检测参数设置卡片 -->
<div class="geo-detection-card" style="margin-bottom: 1.5rem">
    <div class="geo-section-header">
        <span>🎯</span>
        <span>设置检测参数</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem">
        <!-- 左侧：品牌和行业 -->
        <div>
            <label class="geo-form-label">品牌名称 *</label>
            <input type="text" class="input" placeholder="例如：奥呦科技">
            
            <label class="geo-form-label" style="margin-top: 1rem">行业类别</label>
            <select class="input">
                <option>选择行业</option>
            </select>
        </div>
        
        <!-- 右侧：问题选择 -->
        <div>
            <label class="geo-form-label">选择检测问题（可多选）</label>
            <div style="background: var(--bg-input); border-radius: 8px; padding: 0.75rem; max-height: 150px; overflow-y: auto">
                <!-- 问题列表项 -->
            </div>
        </div>
    </div>
    <button class="geo-btn-primary" style="margin-top: 1.5rem">
        🚀 开始检测
    </button>
</div>

<!-- 检测历史卡片 -->
<div class="geo-detection-card">
    <div class="geo-section-header" style="justify-content: space-between">
        <div style="display: flex; align-items: center; gap: 0.5rem">
            <span>📋</span>
            <span>检测历史</span>
        </div>
        <button class="geo-btn-outline">🔄 刷新</button>
    </div>
    <!-- 表格或空状态 -->
</div>
```

### 4. JavaScript交互

添加必要的交互功能：
- 表单验证（品牌名称必填）
- 复选框状态切换
- 刷新按钮处理
- 开始检测按钮处理（模拟检测过程）

## 实施步骤

1. **添加CSS样式** - 在 `base.css` 中添加GEO模块专用样式
2. **修改HTML** - 在 `geo-tools.html` 中添加新的UI模块
3. **添加JavaScript** - 添加表单验证和交互逻辑

## 预计文件修改

| 文件 | 修改内容 |
|------|----------|
| `auyologic-final/frontend/css/base.css` | 添加GEO模块样式 |
| `auyologic-final/frontend/geo-tools.html` | 添加UI模块HTML结构 |
| `auyologic-final/frontend/js/page-specific.js` | 添加交互逻辑（可选） |
