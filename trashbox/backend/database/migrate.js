/**
 * 数据库迁移系统
 * 管理数据库架构的版本控制
 */

const fs = require('fs');
const path = require('path');

// 数据库选择
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const db = useSQLite 
  ? require('./sqlite') 
  : require('./init');

const run = db.run || db.query;
const get = db.get || db.query;
const all = db.all || db.query;

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * 初始化迁移表
 */
async function initMigrationTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      batch INTEGER NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * 获取已执行的迁移
 */
async function getExecutedMigrations() {
  const rows = await all('SELECT name FROM migrations ORDER BY id ASC');
  return new Set(rows.map(r => r.name));
}

/**
 * 获取下一个批次号
 */
async function getNextBatch() {
  const row = await get('SELECT MAX(batch) as max_batch FROM migrations');
  return (row?.max_batch || 0) + 1;
}

/**
 * 获取所有迁移文件
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();
}

/**
 * 执行迁移
 */
async function migrate(direction = 'up') {
  await initMigrationTable();
  
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const batch = await getNextBatch();
  
  console.log(`[Migrate] 运行模式: ${direction}, 批次: ${batch}`);
  
  let migratedCount = 0;
  
  for (const file of files) {
    const name = path.basename(file, '.js');
    const isExecuted = executed.has(name);
    
    if (direction === 'up' && !isExecuted) {
      // 执行新迁移
      const migration = require(path.join(MIGRATIONS_DIR, file));
      if (migration.up) {
        console.log(`[Migrate] 执行: ${name}`);
        await migration.up(run, get, all);
        await run('INSERT INTO migrations (name, batch) VALUES (?, ?)', [name, batch]);
        migratedCount++;
      }
    } else if (direction === 'down' && isExecuted) {
      // 回滚迁移（仅回滚当前批次）
      const migration = require(path.join(MIGRATIONS_DIR, file));
      if (migration.down) {
        console.log(`[Migrate] 回滚: ${name}`);
        await migration.down(run, get, all);
        await run('DELETE FROM migrations WHERE name = ?', [name]);
        migratedCount++;
      }
    }
  }
  
  console.log(`[Migrate] 完成: ${migratedCount} 个迁移`);
  return migratedCount;
}

/**
 * 回滚上一个批次
 */
async function rollback() {
  await initMigrationTable();
  
  const currentBatch = await get('SELECT MAX(batch) as max_batch FROM migrations');
  if (!currentBatch?.max_batch) {
    console.log('[Migrate] 没有可回滚的迁移');
    return 0;
  }
  
  const batch = currentBatch.max_batch;
  const migrations = await all('SELECT name FROM migrations WHERE batch = ?', [batch]);
  
  console.log(`[Migrate] 回滚批次: ${batch}`);
  
  let rolledBackCount = 0;
  
  // 倒序回滚
  for (const { name } of migrations.reverse()) {
    const file = `${name}.js`;
    const migration = require(path.join(MIGRATIONS_DIR, file));
    if (migration.down) {
      console.log(`[Migrate] 回滚: ${name}`);
      await migration.down(run, get, all);
      await run('DELETE FROM migrations WHERE name = ?', [name]);
      rolledBackCount++;
    }
  }
  
  console.log(`[Migrate] 回滚完成: ${rolledBackCount} 个迁移`);
  return rolledBackCount;
}

/**
 * 查看迁移状态
 */
async function status() {
  await initMigrationTable();
  
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  
  console.log('\n[Migration Status]');
  console.log('==================');
  
  for (const file of files) {
    const name = path.basename(file, '.js');
    const status = executed.has(name) ? '✓ 已执行' : '○ 待执行';
    console.log(`${status} ${name}`);
  }
  
  console.log(`\n总计: ${files.length} 个迁移, ${executed.size} 个已执行`);
}

/**
 * 创建新迁移文件
 */
function createMigration(name) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const filename = `${timestamp}_${name}.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  const template = `/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 */

module.exports = {
  // 升级迁移
  async up(run, get, all) {
    // 在此编写升级 SQL
    // await run(\`CREATE TABLE ...\`);
  },

  // 回滚迁移
  async down(run, get, all) {
    // 在此编写回滚 SQL
    // await run(\`DROP TABLE ...\`);
  }
};
`;
  
  fs.writeFileSync(filepath, template);
  console.log(`[Migrate] 创建迁移文件: ${filename}`);
  return filepath;
}

// CLI 支持
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'up':
      migrate('up').then(() => process.exit(0)).catch(err => {
        console.error('[Migrate Error]', err);
        process.exit(1);
      });
      break;
    case 'down':
      rollback().then(() => process.exit(0)).catch(err => {
        console.error('[Migrate Error]', err);
        process.exit(1);
      });
      break;
    case 'status':
      status().then(() => process.exit(0)).catch(err => {
        console.error('[Migrate Error]', err);
        process.exit(1);
      });
      break;
    case 'create':
      if (!arg) {
        console.error('Usage: node migrate.js create <migration-name>');
        process.exit(1);
      }
      createMigration(arg);
      break;
    default:
      console.log(`
Database Migration Tool

Usage:
  node migrate.js up              执行所有待执行的迁移
  node migrate.js down            回滚上一个批次的迁移
  node migrate.js status          查看迁移状态
  node migrate.js create <name>   创建新的迁移文件
`);
  }
}

module.exports = {
  migrate,
  rollback,
  status,
  createMigration,
  initMigrationTable
};