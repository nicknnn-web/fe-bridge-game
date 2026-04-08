# 改进需求：攻击目标边框闪烁效果

> 日期：2026-04-08
> 改进点：可攻击目标边框闪烁
> 状态：待实施

---

## 目标

当单位移动完毕后（可攻击目标出现时），敌方目标单位需要有持续的闪烁边框提示，让玩家明确知道"可以打这个"。

## 现状分析

当前 `atkRange()` 只绘制红色半透明格子，无边框闪烁：
```javascript
atkRange(units){
  units.forEach(u=>{
    c.fillStyle='rgba(239,68,68,.12)'; c.strokeStyle='rgba(239,68,68,.45)';
    c.fillRect(u.x*TS+3,u.y*TS+3,TS-6,TS-6); c.strokeRect(u.x*TS+3,u.y*TS+3,TS-6,TS-6);
  });
}
```

选中单位的闪烁效果已存在（`Renderer.unit()` line 1150），复用的是同一机制。

## 改动范围

### 1. 修改 `Renderer.unit()` 调用处
在 `game.loop()` 中，给所有在 `game.atkTargets` 里的单位传入 `isAtkTarget` 标记：
```javascript
// 改动前
this.units.forEach(u=>{ u.tick(); Renderer.unit(u,this.sel===u,t); });
// 改动后
this.units.forEach(u=>{ u.tick(); Renderer.unit(u,this.sel===u,t,this.atkTargets.includes(u)); });
```

### 2. 修改 `Renderer.unit()` 函数签名
```javascript
// 改动前
unit(u,sel,t)
// 改动后
unit(u,sel,t,isAtkTarget)
```

### 3. 在 `Renderer.unit()` 内添加攻击目标闪烁边框
在选中边框之后追加橙色脉冲边框：
```javascript
if(isAtkTarget){
  const p=0.5+Math.sin(t*5)*0.5;
  c.strokeStyle=`rgba(251,191,36,${p})`; c.lineWidth=2;
  c.beginPath(); c.arc(px,py,20,0,7); c.stroke();
}
```

## 验收标准

1. 选中单位后移动到某格，可攻击的敌方单位有**橙色脉冲边框**
2. 边框持续闪烁，频率约 2-3Hz
3. 与选中单位的金色边框不冲突
4. 截图验证

## 改动文件

- `fe_bridge_v3.html` — `Renderer.unit()` 函数 + `game.loop()` 调用处
