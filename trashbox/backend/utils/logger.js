/**
 * 增强日志系统
 * 分级日志和业务日志记录
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 当前日志级别
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// 日志目录
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 写入日志文件
 */
function writeToFile(level, message) {
  const date = new Date();
  const filename = `${date.toISOString().split('T')[0]}.log`;
  const filepath = path.join(LOG_DIR, filename);
  
  const timestamp = date.toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  
  fs.appendFile(filepath, logLine, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}

/**
 * 格式化日志消息
 */
function formatMessage(args) {
  return args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join(' ');
}

/**
 * 日志对象
 */
const logger = {
  error(...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      const message = formatMessage(args);
      console.error('[ERROR]', message);
      writeToFile('ERROR', message);
    }
  },

  warn(...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      const message = formatMessage(args);
      console.warn('[WARN]', message);
      writeToFile('WARN', message);
    }
  },

  info(...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      const message = formatMessage(args);
      console.log('[INFO]', message);
      writeToFile('INFO', message);
    }
  },

  debug(...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      const message = formatMessage(args);
      console.log('[DEBUG]', message);
      writeToFile('DEBUG', message);
    }
  },

  // 业务日志
  business(action, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'business',
      action,
      data
    };
    
    const message = JSON.stringify(logEntry);
    console.log('[BUSINESS]', action, data);
    writeToFile('BUSINESS', message);
  },

  // 请求日志
  request(req, res, duration) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'request',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const message = JSON.stringify(logEntry);
    writeToFile('REQUEST', message);
  }
};

module.exports = logger;