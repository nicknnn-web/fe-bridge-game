# 地图重设计 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用新地图数据替换现有 MAP 数组，更新单位起点坐标，使地形布局符合"矿区环形防御"战略设计

**Architecture:** 单文件 HTML 游戏，只需替换 `const MAP` 数组和 `new Unit()` 起点参数

**Tech Stack:** 纯 HTML/CSS/JS

---

## 文件映射

| 任务 | 文件 | 改动位置 |
|------|------|---------|
| 任务1 | `fe_bridge_v3.html:575-588` | MAP 数组（完整替换） |
| 任务2 | `fe_bridge_v3.html:770-777` | new Unit() 起点坐标 |
| 任务3 | `SPEC.md` | 同步更新地图数据 |

---

## Task 1: 更新 MAP 数组

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/fe_bridge_v3.html:575-588`

**当前内容（第575-588行）：**
```javascript
const MAP = [
  [2,0,0,0,0,0,0,0,0,0,0,3],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0],
  [5,5,5,5,5,6,6,5,5,5,5,5],
  [0,0,0,0,0,0,0,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,0,0,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0,0,0,2],
];
```

**替换为：**
```javascript
const MAP = [
  [3,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,3,0],
  [0,0,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,0],
  [5,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,5,0],
  [0,0,0,0,0,0,0,0,0,0,0,5],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [2,2,0,0,0,0,0,0,0,0,0,0],
  [2,2,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
];
```

- [ ] **Step 1: 读取文件确认行号**

Run: `sed -n '575,588p' Projects/fe-bridge-game/fe_bridge_v3.html`

- [ ] **Step 2: 替换 MAP 数组**

使用 Edit 工具精确替换

- [ ] **Step 3: 提交**

```bash
git add "Projects/fe-bridge-game/fe_bridge_v3.html"
git commit -m "feat(map): 重设计地图为矿区环形防御布局"
```

---

## Task 2: 更新单位起点坐标

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/fe_bridge_v3.html:770-777`

**当前内容：**
```javascript
new Unit('p1','艾利乌德','领主','SWORD',28,10,5,5,5,'p',1,9),
new Unit('p2','海克托尔','重甲','AXE',  38,7,9,2,4,'p',2,9),
new Unit('p3','琳',     '骑士','LANCE',22,12,4,9,8,'p',1,10),
new Unit('p4','露西亚',  '弓手','BOW',  18,9,2,6,5,'p',2,10),
new Unit('e1','黑骑士', '领主','LANCE',28,10,5,5,5,'e',9,1),
new Unit('e2','巴里尔', '重甲','AXE',  38,7,9,2,4,'e',10,1),
new Unit('e3','佣兵',  '剑士','SWORD',22,12,4,9,8,'e',9,2),
new Unit('e4','狙击手', '弓手','BOW',  18,9,2,6,5,'e',10,2),
```

**替换为（按 spec）：**
```javascript
new Unit('p1','艾利乌德','领主','SWORD',28,10,5,5,5,'p',1,9),
new Unit('p2','海克托尔','重甲','AXE',  38,7,9,2,4,'p',0,9),
new Unit('p3','琳',     '骑士','LANCE',22,12,4,9,8,'p',1,10),
new Unit('p4','露西亚',  '弓手','BOW',  18,9,2,6,5,'p',0,10),
new Unit('e1','黑骑士', '领主','LANCE',28,10,5,5,5,'e',8,1),
new Unit('e2','巴里尔', '重甲','AXE',  38,7,9,2,4,'e',9,1),
new Unit('e3','佣兵',  '剑士','SWORD',22,12,4,9,8,'e',8,6),
new Unit('e4','狙击手', '弓手','BOW',  18,9,2,6,5,'e',9,6),
```

- [ ] **Step 1: 读取文件确认行号**

Run: `sed -n '770,778p' Projects/fe-bridge-game/fe_bridge_v3.html`

- [ ] **Step 2: 替换单位起点**

使用 Edit 工具精确替换

- [ ] **Step 3: 提交**

```bash
git add "Projects/fe-bridge-game/fe_bridge_v3.html"
git commit -m "feat(map): 更新单位起点坐标为环形布防布局"
```

---

## Task 3: 同步更新 SPEC.md

**文件:** `D:/Claudecodeworkspace/Projects/fe-bridge-game/SPEC.md`

需要更新两处：

**3.1 地图数据（MAP）表格**

约第117-131行，找到现有 MAP 表格，替换为新数据（格式对应 T = { PLAIN:0, FOREST:1, BLUE_CASTLE:2, RED_CASTLE:3, MOUNTAIN:4, RIVER:5, BRIDGE:6 }）

**3.2 起点位置说明**

约第126-131行，更新坐标值与代码一致：
- 蓝方（玩家）：(1,9), (0,9), (1,10), (0,10)
- 红方（AI）：(8,1), (9,1), (8,6), (9,6)

- [ ] **Step 1: 读取 SPEC.md 相关行**

Run: `grep -n "起点位置\|const MAP\|蓝方\|红方" Projects/fe-bridge-game/SPEC.md`

- [ ] **Step 2: 更新起点位置段落**

- [ ] **Step 3: 提交**

```bash
git add "Projects/fe-bridge-game/SPEC.md"
git commit -m "docs: 同步更新SPEC.md地图数据与起点坐标"
```

---

## 验证

完成后用浏览器打开 `fe_bridge_v3.html`，验证：
1. 蓝方4单位在左下角蓝城（亮蓝色方块）
2. 红方2单位在右上角（偏东）
3. 河流斜线清晰可见
4. 森林带在北侧和东侧
