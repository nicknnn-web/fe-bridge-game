const { run, get, all } = require('../database/sqlite');
const { v4: uuidv4 } = require('uuid');

class PlatformService {
  // Get all platforms
  async getAll() {
    return await all('SELECT * FROM platforms WHERE status = ? ORDER BY name', ['active']);
  }

  // Get platform by ID
  async getPlatformById(id) {
    return await get('SELECT * FROM platforms WHERE id = ?', [id]);
  }

  // Create platform account
  async createAccount(accountData) {
    const id = uuidv4();
    const { platform_id, account_name, account_id, followers } = accountData;

    await run(`
      INSERT INTO platform_accounts (id, platform_id, account_name, account_id, followers, binding_status)
      VALUES (?, ?, ?, ?, ?, 'bound')
    `, [id, platform_id, account_name, account_id || '', followers || 0]);

    return this.getAccountById(id);
  }

  // Get account by ID
  async getAccountById(id) {
    return await get(`
      SELECT pa.*, p.name as platform_name, p.icon as platform_icon
      FROM platform_accounts pa
      LEFT JOIN platforms p ON pa.platform_id = p.id
      WHERE pa.id = ?
    `, [id]);
  }

  // Get all accounts
  async getAllAccounts() {
    return await all(`
      SELECT pa.*, p.name as platform_name, p.icon as platform_icon
      FROM platform_accounts pa
      LEFT JOIN platforms p ON pa.platform_id = p.id
      ORDER BY pa.created_at DESC
    `);
  }

  // Get accounts by platform
  async getAccountsByPlatform(platformId) {
    return await all(`
      SELECT pa.*, p.name as platform_name, p.icon as platform_icon
      FROM platform_accounts pa
      LEFT JOIN platforms p ON pa.platform_id = p.id
      WHERE pa.platform_id = ?
      ORDER BY pa.created_at DESC
    `, [platformId]);
  }

  // Update account
  async updateAccount(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await run(`UPDATE platform_accounts SET ${fields} WHERE id = ?`, [...values, id]);
    return this.getAccountById(id);
  }

  // Delete account
  async deleteAccount(id) {
    const result = await run('DELETE FROM platform_accounts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // Bind account (update binding status)
  async bindAccount(id) {
    await run(`UPDATE platform_accounts SET binding_status = 'bound', bound_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    return this.getAccountById(id);
  }

  // Unbind account
  async unbindAccount(id) {
    await run(`UPDATE platform_accounts SET binding_status = 'pending', bound_at = NULL WHERE id = ?`, [id]);
    return this.getAccountById(id);
  }

  // Get bound accounts count
  async getBoundAccountsCount() {
    const result = await get(`SELECT COUNT(*) as count FROM platform_accounts WHERE binding_status = 'bound'`);
    return result.count;
  }

  // Get total followers
  async getTotalFollowers() {
    const result = await get(`SELECT SUM(followers) as total FROM platform_accounts WHERE binding_status = 'bound'`);
    return result.total || 0;
  }
}

module.exports = new PlatformService();
