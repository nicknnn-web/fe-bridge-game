const { run, get, all } = require('./sqlite');
const { v4: uuidv4 } = require('uuid');

class ArticleDB {
  async create(article) {
    const id = uuidv4();
    await run(`
      INSERT INTO articles (id, title, content, summary, keywords, style, word_count, status, model_used, prompt, extra_requirements, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      article.title,
      article.content,
      article.summary || '',
      article.keywords || '',
      article.style || 'professional',
      article.word_count || 0,
      article.status || 'completed',
      article.model_used || 'deepseek/deepseek-chat',
      article.prompt || '',
      article.extra_requirements || '',
      article.tags || ''
    ]);
    return this.getById(id);
  }

  async getById(id) {
    return await get('SELECT * FROM articles WHERE id = ?', [id]);
  }

  async getAll() {
    return await all('SELECT * FROM articles ORDER BY created_at DESC');
  }

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await run(`UPDATE articles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return this.getById(id);
  }

  async delete(id) {
    const result = await run('DELETE FROM articles WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async recordExport(id) {
    await run(`
      UPDATE articles
      SET export_count = export_count + 1, last_exported_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }
}

module.exports = ArticleDB;
