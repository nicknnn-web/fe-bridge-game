# 航班扫描自动化系统设计方案

## 背景

当前航班扫描任务使用 Claude Code `CronCreate` 会话级调度，存在根本缺陷：
- `CronCreate` 依赖 REPL 空闲状态才能触发，会话关闭即失效
- 即使会话存活，prompt 链路太长（Claude Code 理解 → 决定工具 → 执行），成功率不稳定
- 携程有反爬机制，未登录状态下抓取成功率低

## 目标

建立一套稳定、可靠的航班价格扫描系统：
- 复用用户已登录的 Chrome 会话（绕过携程反爬）
- 定时抓取，不依赖 Claude Code 会话
- 扫描完成后自动发送飞书群通知

---

## 系统架构

```
┌─────────────────────────────────────────────┐
│  Chrome 长期运行（24/7）                     │
│  启动命令：                                   │
│  chrome.exe --user-data-dir=.../claude       │
│    --remote-debugging-port=9223              │
│    --no-first-run                            │
└──────────────────┬──────────────────────────┘
                   │ CDP WebSocket (ws://localhost:9223)
                   ↓
┌─────────────────────────────────────────────┐
│  Windows Task Scheduler (schtasks)          │
│  触发频率：每小时                             │
│  执行：node flight-scraper.js               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│  flight-scraper.js                          │
│  1. 通过 CDP 连接已有 Chrome                  │
│  2. 访问携程航班页面（已登录态）              │
│  3. 提取 MU5144 等航班价格（8天）            │
│  4. 追加到 flights.csv                     │
│  5. 分析价格数据                             │
│  6. 调飞书 API 发群通知                     │
│  7. 退出（不断 Chrome）                     │
└─────────────────────────────────────────────┘
```

---

## 组件设计

### 1. Chrome 启动脚本

**文件**：`Projects/flight-tracker/start-chrome.bat`

```cmd
@echo off
start "" "C:/Program Files/Google/Chrome/Application/chrome.exe" ^
  --user-data-dir="D:/Claudecodeworkspace/chrome-profiles/claude" ^
  --remote-debugging-port=9223 ^
  --no-first-run ^
  --no-default-browser-check
```

**使用场景**：
- 手动启动一次，或系统开机时自启动
- Chrome 启动后无需再管，24/7 运行

**检查是否已运行**：
```cmd
curl http://localhost:9223/json >nul 2>&1 && echo "already running" || start-chrome.bat
```

---

### 2. flight-scraper.js

**文件**：`Projects/flight-tracker/flight-scraper.js`

#### 核心改动

**A. 用 Playwright CDP 连接已有 Chrome**

```javascript
const { chromium } = require('playwright');

// 不 launch 新 Chrome，连接已有的
const browser = await chromium.connectOverCDP('ws://localhost:9223');
// 注意：需要 URL 以 ws:// 开头，不是 http://
```

**B. 复用已有 Browser Context（保留登录态）**

```javascript
// 获取已存在的 context
const existingBrowser = browser.contexts()[0];
const page = await existingBrowser.newPage();
```

**C. 导航到携程（使用已登录 cookie）**

携程移动版 URL：
```
https://m.ctrip.com/html5/flight/taro/first?dcode=TSN&acode=SHA&ddate={DATE}
```

**D. 提取航班数据**

扫描日期范围：`['2026-04-10', '2026-04-11', ..., '2026-04-17']`

目标航班：东方航空 **MU5144**（21:40-23:35，虹桥T2）

提取逻辑：使用 `page.evaluate()` 执行 JS，解析 DOM 中的价格元素

**E. 追加到 CSV**

文件：`D:/Claudecodeworkspace/Projects/flight-tracker/flights.csv`

字段：`日期,排名,航班号,航空公司,出发时间,到达时间,出发机场,到达机场,价格(元),折扣,扫描时间`

**F. 飞书通知**

```javascript
const https = require('https');

function sendFeishuNotify(message) {
  const payload = JSON.stringify({
    receive_id: 'oc_b90d045c3e1128be68e28523081b6c21',
    msg_type: 'text',
    content: JSON.stringify({ text: message })
  });

  const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/bot/v2/hook/xxx', // 需替换为实际 webhook 或 app token
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.FEISHU_APP_TOKEN
    }
  };
  // ...发送逻辑
}
```

**飞书通知消息格式**：
```
[机票扫描] 2026-04-07 21:00
虹桥机场直飞最低价：
04-10(五) ¥550 | 04-11(六) ¥480 | 04-12(日) ¥519
04-13(一) ¥500 | 04-14(二) ¥490 | 04-15(三) ¥510
04-16(四) ¥525 | 04-17(五) ¥515

最低: ¥480 | 最高: ¥550
均为东航MU5144 21:40-23:35
```

**G. 错误处理**

- CDP 连接失败（Chrome 未运行）：打印错误，退出码 1
- 页面加载超时：重试 2 次，每次等 3 秒
- 抓不到数据：打印警告，继续处理其他日期
- 飞书通知失败：打印警告，不中断流程

---

### 3. 系统调度配置

**创建定时任务**（管理员 CMD）：

```cmd
schtasks /create ^
  /tn "FlightScan-Hourly" ^
  /tr "node D:\Claudecodeworkspace\Projects\flight-tracker\flight-scraper.js" ^
  /sc hourly ^
  /st 21:00 ^
  /f
```

**验证任务**：
```cmd
schtasks /query /tn "FlightScan-Hourly"
```

**删除任务**：
```cmd
schtasks /delete /tn "FlightScan-Hourly" /f
```

---

### 4. 手动测试脚本

**文件**：`Projects/flight-tracker/run-scraper.bat`

```cmd
@echo off
echo [航班扫描] 开始执行...
cd /d "%~dp0"
node flight-scraper.js
echo.
echo 执行完成，按任意键关闭...
pause
```

---

## 文件结构

```
Projects/flight-tracker/
  flight-scraper.js       # 主脚本：CDP抓取 + CSV + 飞书通知
  start-chrome.bat       # Chrome 启动脚本
  run-scraper.bat        # 手动测试脚本
  flights.csv            # 数据文件（自动创建）
  package.json           # playwright 依赖
```

---

## 数据流

```
用户手动启动 Chrome（一次性）
  → Chrome 以 --remote-debugging-port=9223 运行
  → 用户登录携程（一次性）
  → 配置 schtasks 定时任务
  → 每小时：schtasks 触发
    → node flight-scraper.js
      → Playwright CDP 连接 Chrome
      → 遍历 8 天日期，抓取价格
      → 追加到 flights.csv
      → 分析：最低价/最高价/各天价格
      → 调飞书 API 发通知
      → 退出
```

---

## 关键注意事项

1. **Chrome 必须先跑**：每次 scraper 执行前，Chrome 必须在 `localhost:9223` 上运行
2. **CDP URL 格式**：必须是 `ws://localhost:9223`（Playwright CDP 需要 WebSocket 前缀）
3. **飞书 Bot**：Bot 必须在目标群里，且有发消息权限
4. **登录态**：用户首次需要手动在 Chrome 里登录携程，之后 cookie 会被持久化
5. **CSV 追加**：每次扫描结果追加一行，不覆盖历史数据

---

## 验证清单

- [ ] Chrome 能以 `--remote-debugging-port=9223` 启动
- [ ] `curl http://localhost:9223/json` 返回浏览器信息
- [ ] Playwright CDP 连接成功
- [ ] 携程页面能加载（已登录态）
- [ ] 数据正确写入 flights.csv
- [ ] 飞书通知发送成功
- [ ] schtasks 定时任务创建成功
- [ ] 定时任务能按时触发并执行
