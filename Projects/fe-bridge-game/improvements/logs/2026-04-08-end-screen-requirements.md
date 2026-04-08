# 改进需求：胜利/失败界面美化

> 日期：2026-04-08
> 改进点：胜利/失败界面加入单位生还统计
> 状态：待实施

---

## 目标

游戏结束时，在胜利/失败 overlay 中显示本局战斗统计（击杀数、生还单位），让结算更有成就感。

## 现状分析

`game.showEnd()` (line 935-939) 当前只显示标题和副标题：
```javascript
ov.innerHTML=`<div class="overlay-title">${t}</div><div class="overlay-sub">${s}</div><button class="overlay-btn" onclick="location.reload()">重来</button>`;
```

## 改动范围

### 1. `game.showEnd()` 增加统计面板
显示：
- 我方生还：`N / 4 单位生还`
- 敌方全灭：N 单位被消灭
- 胜利时显示"🏆 完美胜利"（4单位全生还）
- 失败时显示"💀 战役失败"

### 2. CSS 美化
- 统计数字用金色大字体
- overlay 背景加入渐变或边框装饰

## 验收标准

1. 胜利界面显示单位生还数和消灭数
2. 完美胜利（4生还）有特殊文案
3. 截图验证

## 改动文件

- `fe_bridge_v3.html` — `game.showEnd()`
