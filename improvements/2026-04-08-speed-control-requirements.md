# 改进需求：速度控制按钮视觉增强

> 日期：2026-04-08
> 改进点：速度控制按钮增加视觉状态反馈
> 状态：待实施

---

## 目标

速度控制按钮（1x / 0.25x / 0.1x）在切换时增加明显的激活状态视觉，让玩家清楚知道当前速度档位。

## 现状分析

`game.toggleSpeed()` (line 941-947) 当前只切换文字：
```javascript
this.speed=speeds[(i+1)%speeds.length];
document.getElementById('speedBtn').textContent=labels[(i+1)%speeds.length];
```
按钮激活状态无额外样式。

## 改动范围

### 1. speedBtn HTML 初始加 id
```html
<button class="header-btn" id="speedBtn" onclick="game.toggleSpeed()">1x ⚡</button>
```

### 2. `toggleSpeed()` 更新按钮样式类
```javascript
const labels=['1x ⚡','0.25x ⏩','0.1x ⏸'];
const classes=['', 'speed-mid', 'speed-slow'];
// 激活时加金色边框
```

### 3. CSS 激活状态
```css
#speedBtn.active{border-color:var(--gold);color:var(--gold);background:var(--bg-panel)}
#speedBtn.speed-mid{color:#60a5fa}
#speedBtn.speed-slow{color:#f87171}
```

## 验收标准

1. 速度按钮当前档位有金色边框激活状态
2. 切换时文字和颜色同步变化
3. 截图验证三档都正确

## 改动文件

- `fe_bridge_v3.html` — `toggleSpeed()` + CSS
