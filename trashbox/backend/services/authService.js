const { run, get, all } = require('../database/sqlite');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class AuthService {
  // Register new user
  async register(userData) {
    const { email, password, name, company } = userData;
    
    // Check if email exists
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      throw new Error('邮箱已被注册');
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const trialEndDate = new Date();
    trialEndDate.setFullYear(trialEndDate.getFullYear() + 1);

    await run(`
      INSERT INTO users (id, email, password_hash, name, company, role, trial_end_date)
      VALUES (?, ?, ?, ?, ?, 'user', ?)
    `, [id, email, passwordHash, name || '', company || '', trialEndDate.toISOString().split('T')[0]]);

    return this.getById(id);
  }

  // Login
  async login(email, password) {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('邮箱或密码错误');
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by ID
  async getById(id) {
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by email
  async getByEmail(email) {
    return await get('SELECT * FROM users WHERE email = ?', [email]);
  }

  // Update profile
  async updateProfile(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.company !== undefined) {
      fields.push('company = ?');
      values.push(updates.company);
    }
    if (updates.password !== undefined) {
      fields.push('password_hash = ?');
      values.push(await bcrypt.hash(updates.password, 10));
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  // Get all users (admin only)
  async getAll() {
    const users = await all('SELECT id, email, name, company, role, trial_end_date, created_at FROM users ORDER BY created_at DESC');
    return users;
  }
}

module.exports = new AuthService();
