const { run, get, all } = require('../database/sqlite');
const { v4: uuidv4 } = require('uuid');

class QuestionService {
  // Create new question
  async create(questionData) {
    const id = uuidv4();
    const { content, category_id, heat_score, status } = questionData;

    await run(`
      INSERT INTO questions (id, content, category_id, heat_score, status)
      VALUES (?, ?, ?, ?, ?)
    `, [id, content, category_id || null, heat_score || 0, status || 'active']);

    return this.getById(id);
  }

  // Get question by ID
  async getById(id) {
    return await get('SELECT * FROM questions WHERE id = ?', [id]);
  }

  // Get all questions
  async getAll() {
    return await all(`
      SELECT q.*, c.name as category_name, c.color as category_color
      FROM questions q
      LEFT JOIN question_categories c ON q.category_id = c.id
      ORDER BY q.heat_score DESC, q.created_at DESC
    `);
  }

  // Get questions by category
  async getByCategory(categoryId) {
    return await all(`
      SELECT * FROM questions 
      WHERE category_id = ?
      ORDER BY heat_score DESC, created_at DESC
    `, [categoryId]);
  }

  // Update question
  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await run(`UPDATE questions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return this.getById(id);
  }

  // Delete question
  async delete(id) {
    const result = await run('DELETE FROM questions WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // Increment heat score
  async incrementHeat(id) {
    await run('UPDATE questions SET heat_score = heat_score + 1 WHERE id = ?', [id]);
    return this.getById(id);
  }

  // Increment generated content count
  async incrementGeneratedCount(id) {
    await run('UPDATE questions SET generated_content_count = generated_content_count + 1 WHERE id = ?', [id]);
    return this.getById(id);
  }

  // Search questions
  async search(keyword) {
    return await all(`
      SELECT q.*, c.name as category_name
      FROM questions q
      LEFT JOIN question_categories c ON q.category_id = c.id
      WHERE q.content LIKE ?
      ORDER BY q.heat_score DESC
    `, [`%${keyword}%`]);
  }

  // Category methods
  async createCategory(categoryData) {
    const id = uuidv4();
    const { name, color, parent_id } = categoryData;
    await run(`INSERT INTO question_categories (id, name, color, parent_id) VALUES (?, ?, ?, ?)`,
      [id, name, color || '#0EA5E9', parent_id || null]);
    return this.getCategoryById(id);
  }

  async getCategoryById(id) {
    return await get('SELECT * FROM question_categories WHERE id = ?', [id]);
  }

  async getAllCategories() {
    return await all('SELECT * FROM question_categories ORDER BY name');
  }

  async deleteCategory(id) {
    const result = await run('DELETE FROM question_categories WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new QuestionService();
