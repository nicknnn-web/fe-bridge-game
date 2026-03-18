const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'auyologic.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Promisify database methods
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize tables
const init = async () => {
  // Articles table
  await run(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      keywords TEXT,
      style TEXT DEFAULT 'professional',
      word_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      model_used TEXT DEFAULT 'deepseek/deepseek-chat',
      prompt TEXT,
      extra_requirements TEXT,
      tags TEXT,
      export_count INTEGER DEFAULT 0,
      last_exported_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Knowledge Base tables (v2 - 支持前端完整功能)
  await run(`
    CREATE TABLE IF NOT EXISTS kb_documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      title TEXT,
      file_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      content TEXT,
      chunk_count INTEGER DEFAULT 0,
      category TEXT DEFAULT 'enterprise',
      health_score INTEGER DEFAULT 80,
      citation_count INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      processing_status TEXT DEFAULT 'processing',
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id TEXT PRIMARY KEY,
      doc_id TEXT REFERENCES kb_documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding TEXT DEFAULT NULL,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc_id ON kb_chunks(doc_id)`);

  // GEO Detection History table
  await run(`
    CREATE TABLE IF NOT EXISTS geo_detections (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      brand TEXT,
      depth TEXT DEFAULT 'standard',
      overall_score INTEGER,
      technical_score INTEGER,
      parseability_score INTEGER,
      search_score INTEGER,
      quality_score INTEGER,
      details TEXT,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Brand Detection History table
  await run(`
    CREATE TABLE IF NOT EXISTS brand_detections (
      id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      industry TEXT,
      overall_score INTEGER,
      deepseek_score INTEGER,
      doubao_score INTEGER,
      kimi_score INTEGER,
      qwen_score INTEGER,
      ernie_score INTEGER,
      yuanbao_score INTEGER,
      mentions_data TEXT,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Keyword Expansion History table
  await run(`
    CREATE TABLE IF NOT EXISTS keyword_expansions (
      id TEXT PRIMARY KEY,
      main_keyword TEXT NOT NULL,
      brand TEXT,
      provider TEXT,
      expanded_keywords TEXT,
      related_questions TEXT,
      long_tail_keywords TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      company TEXT,
      role TEXT DEFAULT 'user',
      trial_end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Questions table
  await run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      category_id TEXT,
      heat_score INTEGER DEFAULT 0,
      generated_content_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Question Categories table
  await run(`
    CREATE TABLE IF NOT EXISTS question_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Brands table
  await run(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo_url TEXT,
      tags TEXT,
      slogan TEXT,
      industry TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 为已存在的 brands 表添加 status 字段（如果不存在）
  try {
    await run(`ALTER TABLE brands ADD COLUMN status TEXT DEFAULT 'active'`);
    console.log('[DB] 已添加 status 字段到 brands 表');
  } catch (err) {
    // 字段已存在，忽略错误
    if (!err.message.includes('duplicate column')) {
      console.log('[DB] brands 表 status 字段检查:', err.message);
    }
  }

  // Platforms table
  await run(`
    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  // Platform Accounts table
  await run(`
    CREATE TABLE IF NOT EXISTS platform_accounts (
      id TEXT PRIMARY KEY,
      platform_id TEXT,
      account_name TEXT NOT NULL,
      account_id TEXT,
      followers INTEGER DEFAULT 0,
      binding_status TEXT DEFAULT 'pending',
      bound_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Publish Records table
  await run(`
    CREATE TABLE IF NOT EXISTS publish_records (
      id TEXT PRIMARY KEY,
      article_id TEXT,
      platform_id TEXT,
      account_id TEXT,
      status TEXT DEFAULT 'pending',
      published_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Health Scores table
  await run(`
    CREATE TABLE IF NOT EXISTS health_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      overall_score INTEGER,
      content_quality_score INTEGER,
      link_health_score INTEGER,
      mobile_score INTEGER,
      speed_score INTEGER,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analytics table
  await run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      date DATE,
      page_views INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      ai_citations INTEGER DEFAULT 0,
      platform VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default platforms
  const defaultPlatforms = [
    { id: 'baijiahao', name: '百家号', icon: '📝', description: '百度内容平台' },
    { id: 'zhihu', name: '知乎', icon: '💬', description: '问答社区' },
    { id: 'sohu', name: '搜狐号', icon: '📰', description: '搜狐媒体平台' },
    { id: 'toutiao', name: '头条号', icon: '📢', description: '字节跳动内容平台' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕', description: '生活方式分享平台' },
    { id: 'bilibili', name: 'B站', icon: '📺', description: '视频社区' },
    { id: 'wechat', name: '微信公众号', icon: '💼', description: '微信内容平台' },
    { id: 'douyin', name: '抖音', icon: '🎵', description: '短视频平台' }
  ];

  for (const platform of defaultPlatforms) {
    await run(`INSERT OR IGNORE INTO platforms (id, name, icon, description) VALUES (?, ?, ?, ?)`,
      [platform.id, platform.name, platform.icon, platform.description]);
  }

  console.log('✅ All SQLite tables created successfully');
};

module.exports = { db, run, get, all, init };
