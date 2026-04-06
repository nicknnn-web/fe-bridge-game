/**
 * 携程机票价格抓取脚本
 * - 通过 CDP 连接已运行的 Chrome（复用登录态）
 * - 遍历 8 天日期抓取携程航班数据
 * - 追加到 flights.csv
 * - 调飞书 Open API 发群通知
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  csvPath: path.join(__dirname, 'flights.csv'),
  dates: ['2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17'],

  // 飞书配置（凭证从环境变量读取，不写在代码里）
  feishu: {
    appId: process.env.FEISHU_APP_ID || 'cli_a9587f70c738dcb2',
    appSecret: process.env.FEISHU_APP_SECRET,
    chatId: process.env.FEISHU_CHAT_ID || 'oc_b90d045c3e1128be68e28523081b6c21',
  },

  // 航班目标
  flight: {
    departAirport: '滨海国际机场T2',
    arriveAirport: '虹桥国际机场T2',
  },
};

// ============ 飞书通知 ============
function feishuRequest(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getFeishuToken() {
  const res = await feishuRequest(
    'POST',
    'open.feishu.cn',
    '/open-apis/auth/v3/tenant_access_token/internal',
    {},
    { app_id: CONFIG.feishu.appId, app_secret: CONFIG.feishu.appSecret }
  );
  return res.tenant_access_token;
}

async function sendFeishuMessage(token, text) {
  return feishuRequest(
    'POST',
    'open.feishu.cn',
    '/open-apis/im/v1/messages?receive_id_type=chat_id',
    { Authorization: `Bearer ${token}` },
    { receive_id: CONFIG.feishu.chatId, msg_type: 'text', content: JSON.stringify({ text }) }
  );
}

function buildFeishuMessage(scanTime, flightResults) {
  // flightResults: [{ date, price, dayOfWeek }, ...]
  const lines = ['[机票扫描] ' + scanTime];
  lines.push('虹桥T2直飞最低价：');

  // 每4天一行
  for (let i = 0; i < flightResults.length; i += 4) {
    const chunk = flightResults.slice(i, i + 4);
    lines.push(chunk.map(f => {
      const dayStr = f.date.slice(5); // MM-DD
      return `${dayStr}(${f.dayOfWeek}) ¥${f.price}`;
    }).join(' | '));
  }

  const prices = flightResults.map(f => f.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  lines.push('');
  lines.push(`最低: ¥${min} | 最高: ¥${max}`);
  lines.push('均为东航MU5144 21:40-23:35');

  return lines.join('\n');
}

// ============ CSV ============
function initCSV() {
  const header = '日期,排名,航班号,航空公司,出发时间,到达时间,出发机场,到达机场,价格(元),折扣,扫描时间\n';
  if (!fs.existsSync(CONFIG.csvPath)) {
    fs.writeFileSync(CONFIG.csvPath, header, 'utf8');
  }
}

function appendToCSV(flights) {
  const lines = flights.map(f =>
    `${f.date},${f.rank},${f.flightNo},${f.airline},${f.departTime},${f.arriveTime},${f.departAirport},${f.arriveAirport},${f.price},${f.discount},${f.scanTime}`
  );
  fs.appendFileSync(CONFIG.csvPath, lines.join('\n') + '\n', 'utf8');
}

// ============ 航班抓取 ============
async function waitAndRetry(page, fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    if (result && result.length > 0) return result;
    await page.waitForTimeout(2000);
  }
  return null;
}

function getDayOfWeek(dateStr) {
  const map = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(dateStr + 'T00:00:00+08:00');
  return map[d.getDay()];
}

async function scrapeFlights(page, date) {
  const scanTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const url = `https://m.ctrip.com/html5/flight/taro/first?dcode=TSN&acode=SHA&ddate=${date}&fromseo=true&fromtinyhome=1&dcity=TSN&acity=SHA`;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  return waitAndRetry(page, async () => {
    return await page.evaluate((dateStr) => {
      const results = [];
      const text = document.body.innerText;

      if (!text.includes('虹桥')) return null;

      const lines = text.split('\n');
      let hongqiaoCount = 0;

      for (let i = 0; i < lines.length && hongqiaoCount < 2; i++) {
        if (lines[i].includes('虹桥T2')) {
          hongqiaoCount++;

          // 提取时间
          let departTime = '', arriveTime = '';
          for (let back = 3; back >= 1; back--) {
            if (i - back >= 0) {
              const lineBefore = lines[i - back];
              const times = lineBefore.match(/\d{2}:\d{2}/g);
              if (times && times.length >= 2) {
                departTime = times[0];
                arriveTime = times[1];
                break;
              }
            }
          }

          // 提取价格
          let price = '';
          for (let forward = 1; forward <= 3; forward++) {
            if (i + forward < lines.length) {
              const next = lines[i + forward];
              const discountMatch = next.match(/优惠后￥(\d+)/);
              if (discountMatch) {
                price = discountMatch[1];
                break;
              }
            }
          }
          if (!price) {
            for (let forward = 1; forward <= 3; forward++) {
              if (i + forward < lines.length) {
                const next = lines[i + forward];
                const match = next.match(/¥(\d+)/);
                if (match) {
                  price = match[1];
                  break;
                }
              }
            }
          }

          // 提取航班号
          let flightNo = 'MU5144', airline = '东方航空';
          for (let forward = 2; forward <= 8; forward++) {
            if (i + forward < lines.length) {
              const next = lines[i + forward];
              if (next.includes('东航') || next.includes('东方航空')) {
                airline = '东方航空';
                const m = next.match(/MU(\d{3,4})/);
                if (m) flightNo = 'MU' + m[1];
                break;
              } else if (next.includes('国航')) {
                airline = '中国国航';
                const m = next.match(/CA(\d{3,4})/);
                if (m) flightNo = 'CA' + m[1];
                break;
              } else if (next.includes('厦航')) {
                airline = '厦门航空';
                const m = next.match(/MF(\d{3,4})/);
                if (m) flightNo = 'MF' + m[1];
                break;
              } else if (next.includes('吉祥')) {
                airline = '吉祥航空';
                const m = next.match(/HO(\d{3,4})/);
                if (m) flightNo = 'HO' + m[1];
                break;
              } else if (next.includes('山航')) {
                airline = '山东航空';
                const m = next.match(/SC(\d{3,4})/);
                if (m) flightNo = 'SC' + m[1];
                break;
              } else if (next.includes('深航')) {
                airline = '深圳航空';
                const m = next.match(/ZH(\d{3,4})/);
                if (m) flightNo = 'ZH' + m[1];
                break;
              } else if (next.includes('上航')) {
                airline = '上海航空';
                const m = next.match(/FM(\d{3,4})/);
                if (m) flightNo = 'FM' + m[1];
                break;
              } else if (next.includes('华夏')) {
                airline = '华夏航空';
                const m = next.match(/G5\d{3}/);
                if (m) flightNo = m[0];
                break;
              } else if (next.includes('天津航') || next.includes('天津航空')) {
                airline = '天津航空';
                const m = next.match(/GS(\d{3,4})/);
                if (m) flightNo = 'GS' + m[1];
                break;
              }
            }
          }

          if (departTime && arriveTime && price) {
            results.push({
              date: dateStr,
              rank: hongqiaoCount,
              flightNo: flightNo,
              airline: airline,
              departTime: departTime,
              arriveTime: arriveTime,
              departAirport: CONFIG.flight.departAirport,
              arriveAirport: CONFIG.flight.arriveAirport,
              price: price,
              discount: '经济舱',
              scanTime: scanTime,
            });
          }
        }
      }
      return results;
    }, date);
  });
}

// ============ 主流程 ============
async function main() {
  const scanTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log('='.repeat(50));
  console.log(`机票抓取开始 - ${scanTime}`);
  console.log('='.repeat(50));

  initCSV();

  // ============ Step 1: 通过 CDP 连接已运行的 Chrome ============
  console.log('\n[1/4] 正在连接 Chrome (CDP localhost:9223)...');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9223', { timeout: 10000 });
  } catch (e) {
    console.error('[错误] Chrome 未运行，请先执行 start-chrome.bat');
    process.exit(1);
  }

  // 获取已有 context（复用登录态）
  let context;
  if (browser.contexts && browser.contexts().length > 0) {
    context = browser.contexts()[0];
  } else {
    // fallback: 创建新 context 但不 launch
    context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
  }

  const page = await context.newPage();
  console.log('  ✓ Chrome 连接成功');

  // ============ Step 2: 遍历日期抓取 ============
  console.log('\n[2/4] 开始抓取航班数据...');
  const allFlights = [];
  const flightResults = []; // [{ date, price, dayOfWeek }]

  for (const date of CONFIG.dates) {
    console.log(`\n抓取: ${date}`);

    try {
      const flights = await scrapeFlights(page, date);

      if (flights && flights.length > 0) {
        allFlights.push(...flights);
        // 取最低价航班（rank=1）用于通知
        const cheapest = flights.find(f => f.rank === 1) || flights[0];
        flightResults.push({
          date,
          price: cheapest.price,
          dayOfWeek: getDayOfWeek(date),
        });
        console.log(`  ✓ ${cheapest.flightNo} ¥${cheapest.price} (${cheapest.departTime}-${cheapest.arriveTime}) [${cheapest.airline}]`);
      } else {
        console.log(`  ✗ 未获取到数据`);
      }
    } catch (e) {
      console.log(`  ✗ 失败: ${e.message}`);
      // 继续处理其他日期
    }

    await page.waitForTimeout(1500);
  }

  // ============ Step 3: 保存 CSV ============
  console.log('\n[3/4] 保存数据到 CSV...');
  if (allFlights.length > 0) {
    appendToCSV(allFlights);
    console.log(`  ✓ 成功: ${allFlights.length} 条数据已保存`);
    console.log(`  路径: ${CONFIG.csvPath}`);
  } else {
    console.log('  ⚠ 未抓取到任何数据，跳过保存');
  }

  // ============ Step 4: 飞书通知 ============
  console.log('\n[4/4] 发送飞书通知...');
  if (flightResults.length > 0) {
    const message = buildFeishuMessage(scanTime, flightResults);
    console.log('  消息预览:');
    console.log('  ' + message.replace(/\n/g, '\n  '));

    try {
      const token = await getFeishuToken();
      await sendFeishuMessage(token, message);
      console.log('  ✓ 飞书通知已发送');
    } catch (e) {
      console.warn('  ⚠ 飞书通知失败:', e.message);
      // 不中断流程
    }
  } else {
    console.log('  ⚠ 无航班数据，跳过通知');
  }

  await browser.disconnect();
  console.log('\n' + '='.repeat(50));
  console.log('抓取完成');
  console.log('='.repeat(50));
}

main().catch(e => {
  console.error('执行失败:', e);
  process.exit(1);
});
