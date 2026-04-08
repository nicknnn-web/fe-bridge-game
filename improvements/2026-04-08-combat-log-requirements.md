# 改进需求：战斗日志优化

> 日期：2026-04-08
> 改进点：战斗日志折叠旧条目
> 状态：待实施

---

## 目标

当战斗日志条目超过 20 条时，自动折叠旧条目，只显示最新 20 条，并提供"显示更多"按钮展开全部。

## 现状分析

`Log.add()` 当前逻辑（line 682-692）：
- 最多保留 100 条（超过则 `shift()` 移除最旧的）
- 无折叠机制，所有条目都直接显示

`Log.clear()` 在新游戏开始时清空。

## 改动范围

### 1. Log 对象 — 增加折叠状态
```javascript
// 新增属性
_logFolded: false,  // 是否折叠
_logDisplayLimit: 20,  // 折叠时显示条数
```

### 2. Log.add() — 超过限制时自动折叠
```javascript
add(html){
  this.entries.push(html);
  // 超过 100 条移除最旧的（不变）
  if(this.entries.length>100) this.entries.shift();
  // 超过 20 条自动折叠
  if(this.entries.length>20) this._logFolded=true;
  this._render();
}
```

### 3. 新增 `_render()` 方法 — 按折叠状态渲染
- 折叠时：只显示最新 20 条 + "🔽 查看更多历史（N条）"按钮
- 展开时：显示全部 + "🔼 收起"按钮

### 4. CSS — 折叠行样式
```css
.log-fold-btn{
  font-size:11px; color:var(--gold); cursor:pointer;
  padding:6px 0; text-align:center;
  background:var(--bg-dark); border:1px solid var(--border-panel);
  margin-top:4px;
}
.log-fold-btn:hover{color:var(--gold-dim);}
.log-entry:first-child{border-top:1px solid rgba(255,255,255,0.05)}
```

### 5. 折叠/展开后回滚到顶部
每次展开/折叠，scroll 回到顶部（最新条目）。

## 验收标准

1. 日志超过 20 条后，旧条目自动隐藏，显示"查看更多历史"按钮
2. 点击按钮展开全部，点击"收起"回到折叠状态
3. scroll 行为正确（最新条目始终在底部可见）
4. 不影响战斗进行中的日志追加

## 改动文件

- `fe_bridge_v3.html` — `Log` 对象 + CSS
