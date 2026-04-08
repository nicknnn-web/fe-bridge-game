# 改进需求：地形悬停预览

> 日期：2026-04-08
> 改进点：鼠标悬停格子显示地形预览
> 状态：待实施

---

## 目标

鼠标悬停任意格子时，在单位详情面板显示该格子的地形信息（名称、防御加成、移动消耗），无需点击即可预览。

## 现状分析

当前只有点击空地才显示地形（`UI.showTerrain()`），无悬停机制。

## 改动范围

### 1. canvas 新增 mousemove 事件监听
在 `game.bindEvents()` 或单独 `bindCanvas()` 中绑定 `mousemove`，节流 100ms 更新。

### 2. 悬停状态管理
```javascript
_hoveredTile: null,
```

### 3. mousemove 处理
- 计算悬停格子坐标 `(gx, gy)`
- 调用 `UI.showTerrain(gx, gy)` 显示地形
- 高亮悬停格子（半透明金色边框）

### 4. mouseleave 处理
- 格子失焦时清除悬停高亮
- 恢复单位详情面板原状态（如之前选中过单位则恢复选中单位信息）

### 5. 高亮渲染
在 `Renderer.map()` 或单独 `Renderer.hoverTile()` 中绘制悬停格子金色边框。

## 验收标准

1. 鼠标悬停任意格子，单位面板显示对应地形信息
2. 悬停格子有金色边框高亮
3. 鼠标离开后恢复正常状态
4. 不影响游戏正常操作

## 改动文件

- `fe_bridge_v3.html` — `bindEvents()` + `Renderer` + `UI` 联动
