# 改进需求：单位死亡渐隐动画

> 日期：2026-04-08
> 改进点：单位死亡时播放渐隐消失动画
> 状态：待实施

---

## 目标

单位 HP 归零时，不立即消失，而是播放一个渐隐缩小动画（0.5秒内 alpha 归零 + scale 缩小），再从棋盘移除。

## 现状分析

当前 `Renderer.unit()` 开头直接 `if(u.dead) return;`，死亡单位瞬间消失，无过渡动画。

## 改动范围

### 1. Unit 对象新增死亡动画属性
```javascript
this.dying=false;  // 死亡动画进行中
this.dyingAlpha=1; // 渐隐透明度（1→0）
```

### 2. `checkEnd()` 触发死亡时不清除，而是设置 dying=true
实际上死亡单位依然通过 HP<=0 触发，不需要改 checkEnd。

### 3. `game.afterAI()` / `game.attack()` 中 HP 归零时设置 dying=true
找到 `df.hp<=0&&!df.dead` 和 `at.hp<=0&&!at.dead` 处，改为：
```javascript
df.dead=true; df.dying=true;
```

### 4. `Renderer.unit()` 处理死亡动画
```javascript
if(u.dead){
  if(u.dying){
    u.dyingAlpha -= 0.04 * speed;
    if(u.dyingAlpha <= 0){ u.dying = false; return; }
    // 绘制渐隐单位...
  }
  return;
}
```

### 5. 渐隐绘制逻辑
- scale 缩小到 0.5
- alpha = dyingAlpha
- 绘制时 `ctx.globalAlpha = u.dyingAlpha`
- 恢复 `ctx.globalAlpha = 1`

## 验收标准

1. 单位死亡时播放 0.5 秒渐隐缩小动画
2. 渐隐期间单位仍然可见（幽灵状态）
3. 渐隐结束后不再渲染
4. 不影响其他单位动画

## 改动文件

- `fe_bridge_v3.html` — `Unit` 类 + `Renderer.unit()` + 死亡触发处
