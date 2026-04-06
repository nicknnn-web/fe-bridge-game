# 游戏背景设定 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `fe_bridge_v3.html` 添加完整背景故事（Lore）：开始 Overlay 显示故事背景、左侧面板显示任务目标、结局 Overlay 显示对应结局文字

**Architecture:** 单文件 HTML 游戏，只需修改三处文字/HTML：Overlay 初始内容、左侧作战目标区块、结局 `showEnd()` 调用参数

**Tech Stack:** 纯 HTML/CSS/JS，无需测试框架

---

## 文件映射

| 任务 | 文件 | 改动位置 |
|------|------|---------|
| 任务1 | `fe_bridge_v3.html` | 502-506 行：Overlay 初始 HTML |
| 任务2 | `fe_bridge_v3.html` | 480-481 行：左侧作战目标内容 |
| 任务3 | `fe_bridge_v3.html` | 859-860 行：结局文字参数 |

---

## Task 1: 更新开始 Overlay 背景故事

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/fe_bridge_v3.html:502-506`

当前内容：
```html
<div class="overlay" id="overlay">
  <div class="overlay-title">断桥之战</div>
  <div class="overlay-sub">Fire Emblem · Tactical Demo</div>
  <button class="overlay-btn" id="startBtn">开战</button>
```

- [ ] **Step 1: 替换 Overlay 初始 HTML**

将 `<div class="overlay-sub">Fire Emblem · Tactical Demo</div>` 替换为包含背景故事的 sub 区块：

```html
<div class="overlay" id="overlay">
  <div class="overlay-title">火焰纹章：断桥之战</div>
  <div class="overlay-sub" style="max-width:380px;text-align:center;line-height:1.7;font-size:13px;color:rgba(200,185,160,0.85)">
    边境矿区争端再起。红狼帝国觊觎蓝狮领地内的珍贵矿藏，率军越境而来。<br>蓝狮王家精锐在矿区前哨布防迎敌——断桥之后，再无退路。
  </div>
  <button class="overlay-btn" id="startBtn">开战</button>
</div>
```

- [ ] **Step 2: 提交**

```bash
git add "Projects/fe-bridge-game/fe_bridge_v3.html"
git commit -m "feat(lore): 添加开始界面背景故事"
```

---

## Task 2: 更新左侧面板任务目标

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/fe_bridge_v3.html:480-481`

当前内容：
```html
<div class="info-card-title">作战目标</div>
<div class="objective-text">全歼敌军</div>
```

- [ ] **Step 1: 替换任务目标文字**

```html
<div class="info-card-title">任务目标</div>
<div class="objective-text" style="font-size:12px;line-height:1.8">
  红狼帝国入侵蓝狮边境，觊觎矿藏资源<br>
  蓝方据点：蓝城（DEF+4）<br>
  红方据点：红城（DEF+4）<br>
  胜利条件：消灭所有敌军<br>
  失败条件：我方全灭
</div>
```

- [ ] **Step 2: 提交**

```bash
git add "Projects/fe-bridge-game/fe_bridge_v3.html"
git commit -m "feat(lore): 更新左侧面板任务目标"
```

---

## Task 3: 更新结局文字

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/fe_bridge_v3.html:859-860`

当前内容：
```javascript
if(e.length===0){this.phase='win'; this.showEnd('🏆 胜利','所有敌军已被击溃');}
else if(p.length===0){this.phase='lose'; this.showEnd('💀 败北','我方全灭');}
```

- [ ] **Step 1: 更新结局文字**

```javascript
if(e.length===0){this.phase='win'; this.showEnd('🏆 胜利','边境矿脉得以保全');}
else if(p.length===0){this.phase='lose'; this.showEnd('💀 败北','矿区落入红狼之手');}
```

- [ ] **Step 2: 提交**

```bash
git add "Projects/fe-bridge-game/fe_bridge_v3.html"
git commit -m "feat(lore): 更新结局胜利/败北文字"
```

---

## 验证

三处修改完成后，直接用浏览器打开 `fe_bridge_v3.html` 验证：
1. 开始 Overlay 是否显示完整背景故事
2. 左侧面板"任务目标"是否显示两国争端 + 胜负条件
3. 击败所有敌人后结局显示"边境矿脉得以保全"
