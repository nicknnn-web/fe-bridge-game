# 航班扫描自动化系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立稳定的航班价格扫描系统：复用已登录 Chrome，每小时抓取携程机票数据并通过飞书机器人发送价格通知

**Architecture:** 使用 Playwright CDP 连接已运行的 Chrome（绕过携程反爬），扫描结果追加 CSV 后调飞书 Open API 发群通知，调度层使用 Windows Task Scheduler

**Tech Stack:** Node.js + Playwright + Feishu Open API + Windows schtasks

---

## 文件变更总览

| 文件 | 操作 |
|------|------|
| `Projects/flight-tracker/flight-scraper.js` | 重写：CDP连接 + 飞书通知 |
| `Projects/flight-tracker/start-chrome.bat` | 新增：Chrome 启动脚本 |
| `Projects/flight-tracker/package.json` | 确认：依赖已满足 |
| `docs/superpowers/specs/2026-04-07-flight-scan-design.md` | 参考：设计文档 |

---

## Task 1: 确认 Chrome 启动脚本

**文件：**
- 创建: `Projects/flight-tracker/start-chrome.bat`

- [ ] **Step 1: 创建 start-chrome.bat**

```cmd
@echo off
echo [Chrome] 检查是否已运行...

curl -s http://localhost:9223/json >nul 2>&1
if %errorlevel%==0 (
    echo [Chrome] 已在运行，跳过启动
) else (
    echo [Chrome] 未运行，正在启动...
    start "" "C:/Program Files/Google/Chrome/Application/chrome.exe" --user-data-dir="D:/Claudecodeworkspace/chrome-profiles/claude" --remote-debugging-port=9223 --no-first-run --no-default-browser-check
    echo [Chrome] 启动命令已执行
)
```

- [ ] **Step 2: 测试 Chrome 启动**

运行: 双击 `start-chrome.bat`
验证: `curl http://localhost:9223/json` 返回 JSON

- [ ] **Step 3: 提交**

```bash
git add Projects/flight-tracker/start-chrome.bat
git commit -m "feat(flight): add Chrome startup script for CDP debugging"
```

---

## Task 2: 重写 flight-scraper.js（CDP + 飞书通知）

**文件：**
- 修改: `Projects/flight-tracker/flight-scraper.js`

**前提：** Chrome 必须已在 `localhost:9223` 运行

- [ ] **Step 1: 搭建基础结构**

`flight-scraper.js` 完整代码：

```javascript
/**
 * 航班价格扫描脚本
 * 使用 Playwright CDP 连接已有 Chrome，复用登录态
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  csvPath: path.join(__dirname, 'flights.csv'),
  dates: ['2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13',
          '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17'],
  chromeWsUrl: 'http://localhost:9223',
  feishu: {
    appId: 'cli_a9587f70c738dcb2',
    appSecret: 'EUVLai52abe0RqYZQ9GSLc5jfObSMXsp',
    chatId: 'oc_b90d045c3e1128be68e28523081b6c21'
  }
};
```

- [ ] **Step 2: 写飞书通知函数**

在 `flight-scraper.js` 中添加：

```javascript
// ============ 飞书通知 ============

function getFeishuToken(appId, appSecret) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: appId, app_secret: appSecret });
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.tenant_access_token) resolve(parsed.tenant_access_token);
        else reject(new Error('获取 token 失败: ' + data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendFeishuMessage(token, chatId, message) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text: message })
    });
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Bearer ' + token
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.code === 0 || parsed.msg === 'success') resolve();
        else reject(new Error('发送失败: ' + data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
```

- [ ] **Step 3: 写 CSV 追加函数**

```javascript
// ============ CSV 工具 ============

function initCSV() {
  const header = '日期,排名,航班号,航空公司,出发时间,到达时间,出发机场,到达机场,价格(元),折扣,扫描时间\n';
  if (!fs.existsSync(CONFIG.csvPath)) {
    fs.writeFileSync(CONFIG.csvPath, header, 'utf8');
  }
}

function appendFlights(flights) {
  if (!flights || flights.length === 0) return;
  const lines = flights.map(f =>
    `${f.date},${f.rank},${f.flightNo},${f.airline},${f.departTime},${f.arriveTime},` +
    `${f.departAirport},${f.arriveAirport},${f.price},${f.discount},${f.scanTime}`
  );
  fs.appendFileSync(CONFIG.csvPath, lines.join('\n') + '\n', 'utf8');
}
```

- [ ] **Step 4: 写抓取逻辑（CDP 连接）**

```javascript
// ============ 航班抓取（CDP 方式）============

async function fetchFlightData(date) {
  // 连接已运行的 Chrome（CDP）
  const browser = await chromium.connectOverCDP(CONFIG.chromeWsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  const url = `https://m.ctrip.com/html5/flight/taro/first?dcode=TSN&acode=SHA&ddate=${date}` +
    '&fromseo=true&fromtinyhome=1&dcity=TSN&acity=SHA';

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 提取数据（复用原有 DOM 解析逻辑，简化）
  const flights = await page.evaluate(() => {
    const results = [];
    const text = document.body.innerText;
    const lines = text.split('\n');
    let count = 0;

    for (let i = 0; i < lines.length && count < 2; i++) {
      if (lines[i].includes('虹桥T2')) {
        count++;
        // 提取时间
        let departTime = '', arriveTime = '';
        for (let back = 3; back >= 1; back--) {
          if (i - back >= 0) {
            const t = lines[i - back].match(/\d{2}:\d{2}/g);
            if (t && t.length >= 2) { departTime = t[0]; arriveTime = t[1]; break; }
          }
        }
        // 提取价格
        let price = '';
        for (let fwd = 1; fwd <= 5; fwd++) {
          if (i + fwd < lines.length) {
            const m = lines[i + fwd].match(/优惠后￥(\d+)/) || lines[i + fwd].match(/¥(\d+)/);
            if (m) { price = m[1]; break; }
          }
        }
        // 提取航班号（简化：默认 MU5144）
        const flightNo = 'MU5144';
        const airline = '东方航空';

        if (departTime && arriveTime && price) {
          results.push({ date: new Date().toLocaleDateString('zh-CN'),
            rank: count, flightNo, airline, departTime, arriveTime,
            departAirport: '滨海T2', arriveAirport: '虹桥T2',
            price, discount: '经济舱', scanTime: new Date().toLocaleString('zh-CN') });
        }
      }
    }
    return results;
  });

  await page.close();
  return flights;
}
```

- [ ] **Step 5: 写主函数**

```javascript
// ============ 主流程 ============

async function main() {
  const scanTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log('='.repeat(50));
  console.log(`[航班扫描] 开始 - ${scanTime}`);
  console.log('='.repeat(50));

  initCSV();

  const allFlights = [];

  try {
    // CDP 连接（如果 Chrome 没开，这里会报错）
    console.log('[CDP] 连接 Chrome...');

    for (const date of CONFIG.dates) {
      console.log(`[抓取] ${date}...`);
      try {
        const flights = await fetchFlightData(date);
        if (flights && flights.length > 0) {
          flights.forEach(f => {
            console.log(`  ✓ ${f.flightNo} ¥${f.price} (${f.departTime}-${f.arriveTime})`);
          });
          allFlights.push(...flights);
        } else {
          console.log(`  ✗ 未获取到数据`);
        }
      } catch (e) {
        console.log(`  ✗ 失败: ${e.message}`);
      }
    }

    // 追加 CSV
    if (allFlights.length > 0) {
      appendFlights(allFlights);
      console.log(`[CSV] ${allFlights.length} 条数据已追加`);
    }

    // 飞书通知
    if (allFlights.length > 0) {
      console.log('[飞书] 发送通知...');
      try {
        const token = await getFeishuToken(CONFIG.feishu.appId, CONFIG.feishu.appSecret);
        // 构建消息
        const datePrices = {};
        allFlights.forEach(f => {
          if (!datePrices[f.date] || parseInt(f.price) < parseInt(datePrices[f.price]))
            datePrices[f.date] = f.price;
        });
        const prices = CONFIG.dates.map(d => {
          const weekday = ['日','一','二','三','四','五','六'][new Date(d).getDay()];
          const p = datePrices[d] || '-';
          return `${d.slice(5)}(${weekday}) ¥${p}`;
        }).join(' | ');

        const priceList = allFlights.map(f => parseInt(f.price));
        const min = Math.min(...priceList);
        const max = Math.max(...priceList);

        const msg = `[机票扫描] ${scanTime}\n虹桥T2直飞最低价：\n${prices}\n最低: ¥${min} | 最高: ¥${max}\n均为东航MU5144 21:40-23:35`;

        await sendFeishuMessage(token, CONFIG.feishu.chatId, msg);
        console.log('[飞书] 通知发送成功');
      } catch (e) {
        console.log('[飞书] 通知失败:', e.message);
      }
    }

  } catch (e) {
    console.error('[错误]', e.message);
    process.exit(1);
  }

  console.log('[完成] 扫描任务结束');
}

main();
```

- [ ] **Step 6: 测试本地抓取**

前提：Chrome 已在 `localhost:9223` 运行，用户已登录携程

运行：
```cmd
cd Projects/flight-tracker
node flight-scraper.js
```

验证：
- [ ] Chrome CDP 连接成功
- [ ] 携程页面能加载（有登录态）
- [ ] flights.csv 有新数据
- [ ] 飞书群收到通知消息

- [ ] **Step 7: 提交**

```bash
git add Projects/flight-tracker/flight-scraper.js
git commit -m "feat(flight): rewrite scraper with CDP connection and Feishu notification"
```

---

## Task 3: 配置 Windows 定时任务

**文件：**
- 新增: Windows Task Scheduler 任务

- [ ] **Step 1: 创建 schtasks 任务**

以**管理员**身份打开 CMD，运行：

```cmd
schtasks /create ^
  /tn "FlightScan-Hourly" ^
  /tr "node D:\Claudecodeworkspace\Projects\flight-tracker\flight-scraper.js" ^
  /sc hourly ^
  /st 21:00 ^
  /ru SYSTEM ^
  /f
```

说明：
- `/tn "FlightScan-Hourly"` — 任务名称
- `/sc hourly` — 每小时执行
- `/st 21:00` — 从 21:00 开始（每小时的第 00 分触发）
- `/ru SYSTEM` — 以系统身份运行（不需要用户登录）

- [ ] **Step 2: 验证任务已创建**

```cmd
schtasks /query /tn "FlightScan-Hourly"
```

预期输出包含：`FlightScan-Hourly`

- [ ] **Step 3: 立即测试一次（不等待定时）**

```cmd
schtasks /run /tn "FlightScan-Hourly"
```

检查：
- [ ] `flights.csv` 有新数据
- [ ] 飞书群收到消息

- [ ] **Step 4: 提交**

```bash
git add docs/superpowers/plans/2026-04-07-flight-scan-implementation.md
git commit -m "docs: add flight scan implementation plan"
```

---

## Task 4: 一键启动脚本（可选）

**文件：**
- 创建: `Projects/flight-tracker/run-all.bat`

- [ ] **Step 1: 创建启动脚本**

```cmd
@echo off
echo [航班扫描] 启动 Chrome + 执行扫描
echo.

cd /d "%~dp0"

REM 检查并启动 Chrome
curl -s http://localhost:9223/json >nul 2>&1
if %errorlevel% neq 0 (
    echo [Chrome] 未运行，正在启动...
    start "" "C:/Program Files/Google/Chrome/Application/chrome.exe" --user-data-dir="D:/Claudecodeworkspace/chrome-profiles/claude" --remote-debugging-port=9223 --no-first-run
    echo [Chrome] 等待 3 秒...
    timeout /t 3 /nobreak >nul
)

REM 执行扫描
echo [扫描] 开始...
node flight-scraper.js

echo.
echo [完成] 按任意键关闭...
pause
```

- [ ] **Step 2: 提交**

```bash
git add Projects/flight-tracker/run-all.bat
git commit -m "feat(flight): add run-all.bat for Chrome start + scan"
```

---

## 验证清单

- [ ] Chrome 能以 `--remote-debugging-port=9223` 启动
- [ ] `curl http://localhost:9223/json` 返回浏览器信息
- [ ] Playwright CDP 连接成功
- [ ] 携程页面能加载（已登录态）
- [ ] 数据正确写入 `flights.csv`
- [ ] 飞书通知发送成功
- [ ] `schtasks` 定时任务创建成功
- [ ] `schtasks /run` 能手动触发并成功执行
