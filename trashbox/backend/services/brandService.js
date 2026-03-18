const { run, get, all } = require('../database/sqlite');
const { v4: uuidv4 } = require('uuid');

class BrandService {
  // Create new brand
  async create(brandData) {
    const id = uuidv4();
    const { name, description, logo_url, tags, slogan, industry } = brandData;

    await run(`
      INSERT INTO brands (id, name, description, logo_url, tags, slogan, industry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, description || '', logo_url || '', tags || '', slogan || '', industry || '']);

    return this.getById(id);
  }

  // Get brand by ID
  async getById(id) {
    return await get('SELECT * FROM brands WHERE id = ?', [id]);
  }

  // Get all brands
  async getAll() {
    return await all('SELECT * FROM brands ORDER BY created_at DESC');
  }

  // Update brand
  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await run(`UPDATE brands SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return this.getById(id);
  }

  // Delete brand
  async delete(id) {
    const result = await run('DELETE FROM brands WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // Search brands
  async search(keyword) {
    return await all(`
      SELECT * FROM brands 
      WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
      ORDER BY created_at DESC
    `, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
  }
}

module.exports = new BrandService();
