# fe-bridge-game 版本更新日志

> 记录每个改进轮次的主要变更，每次改进后追加一条记录。

---

## [v0.4.0] - 2026-04-08

### 改进 #8：AI行动日志增强
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-ai-log-requirements.md`
- **改动说明**：敌方回合显示分隔符，AI瞄准/移动增加战术说明日志
- **Commit**：`b290b16`

### 改进 #7：速度按钮视觉增强
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-speed-control-requirements.md`
- **改动说明**：速度按钮三档文字+激活金色边框，切换颜色区分
- **Commit**：`f1e712a`

### 改进 #6：地形悬停预览
- **类型**：交互体验
- **需求文档**：`improvements/logs/2026-04-08-terrain-preview-requirements.md`
- **改动说明**：鼠标悬停格子显示地形信息+金色脉冲边框，80ms节流
- **Commit**：`dada4bd`

### 改进 #5：胜利/失败界面美化
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-end-screen-requirements.md`
- **改动说明**：胜利/失败界面显示生还数/击杀数，完美胜利特殊文案
- **Commit**：`3dec736`

### 改进 #4：单位详情面板增强
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-unit-panel-enhance-requirements.md`
- **改动说明**：属性增加图标，防御显示4(+2)格式，状态标签加●前缀
- **Commit**：`3ddab5c`

## [v0.3.0] - 2026-04-08

### 改进 #3：战斗日志超过20条自动折叠
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-combat-log-requirements.md`
- **改动说明**：Log 对象新增 `_render()/toggle()`，超20条显示"查看更多历史"，点击展开/收起
- **验证**：截图确认折叠按钮显示
- **Commit**：`3acd91e`

### 改进 #2：可攻击目标橙色闪烁边框
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-atktarget-flash-requirements.md`
- **改动说明**：Renderer.unit() 增加 isAtkTarget 参数，攻击目标显示橙色脉冲边框
- **验证**：截图确认敌方单位橙色边框闪烁
- **Commit**：`3505b93`

## [v0.2.0] - 2026-04-08

### 改进 #1：移动/攻击范围高亮颜色区分
- **类型**：UI/UX
- **需求文档**：`improvements/logs/2026-04-08-range-highlight-requirements.md`
- **改动说明**：移动范围高亮由红色改为蓝色（`rgba(59,130,246,.15)`），攻击范围保持红色
- **验证**：截图确认蓝色移动范围清晰可辨
- **Commit**：`8688de8`

---

## [v0.1.0] - 2026-04-08

### 初始版本
- **类型**：功能完整
- **说明**：v3 完整战棋游戏，含回合制、AI、移动/攻击、武器克制、暴击反击、地形系统、v4 GBA 精灵图
- **Commit**：`6fec70c`

---
