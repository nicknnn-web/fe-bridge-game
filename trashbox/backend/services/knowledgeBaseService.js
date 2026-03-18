// Use SQLite for local development, PostgreSQL for production
const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';

let db;
if (useSQLite) {
  db = require('../database/sqlite');
} else {
  const { pool } = require('../database/init');
  db = { pool };
}

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Text chunking - split text into chunks of ~500 tokens (approx 2000 chars)
function chunkText(text, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to end at a sentence boundary
    if (end < text.length) {
      const sentenceEnd = text.slice(end - 50, end + 50).search(/[。！？.!?]\s/);
      if (sentenceEnd !== -1) {
        end = end - 50 + sentenceEnd + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}

// Get embedding from API (使用 SiliconFlow 作为默认，DeepSeek embedding 不稳定)
async function getEmbedding(text, provider = 'siliconflow') {
  const apiKey = provider === 'siliconflow'
    ? process.env.SILICONFLOW_API_KEY
    : process.env.DEEPSEEK_API_KEY;

  const baseURL = provider === 'siliconflow'
    ? 'https://api.siliconflow.cn/v1/embeddings'
    : 'https://api.deepseek.com/v1/embeddings';

  const model = provider === 'siliconflow'
    ? 'BAAI/bge-large-zh-v1.5'
    : 'deepseek-embedding';

  try {
    const response = await axios.post(baseURL, {
      model,
      input: text.slice(0, 8000) // Limit text length
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embedding API error:', error.message);
    // Return null if API fails - will use fallback search
    return null;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class KnowledgeBaseService {
  // Save document and create chunks
  async saveDocument(fileInfo, content, options = {}) {
    const docId = uuidv4();
    const category = options.category || 'enterprise';
    const title = options.title || fileInfo.originalname;
    const tags = options.tags || [];

    // 使用 AI 分析文档质量
    const healthScore = await this.analyzeDocumentHealth(content);

    try {
      if (useSQLite) {
        // SQLite version
        await db.run(`
          INSERT INTO kb_documents (id, filename, original_name, title, file_path, file_size, mime_type, content, category, health_score, tags, processing_status, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)
        `, [
          docId,
          fileInfo.filename,
          fileInfo.originalname,
          title,
          fileInfo.path,
          fileInfo.size,
          fileInfo.mimetype,
          content,
          category,
          healthScore,
          JSON.stringify(tags),
          JSON.stringify({})
        ]);

        // Create chunks
        const chunks = chunkText(content);

        for (let i = 0; i < chunks.length; i++) {
          const chunkId = uuidv4();
          const embedding = await getEmbedding(chunks[i]);

          await db.run(`
            INSERT INTO kb_chunks (id, doc_id, content, chunk_index, embedding)
            VALUES (?, ?, ?, ?, ?)
          `, [chunkId, docId, chunks[i], i, embedding ? JSON.stringify(embedding) : null]);
        }

        // Update document status
        await db.run(`
          UPDATE kb_documents
          SET processing_status = 'completed', chunk_count = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [chunks.length, docId]);

        return {
          id: docId,
          title,
          filename: fileInfo.originalname,
          category,
          healthScore,
          tags,
          chunkCount: chunks.length,
          status: 'completed'
        };
      } else {
        // PostgreSQL version
        const client = await db.pool.connect();

        try {
          await client.query('BEGIN');

          await client.query(`
            INSERT INTO kb_documents (id, filename, original_name, title, file_path, file_size, mime_type, content, category, health_score, tags, processing_status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing', $12)
          `, [
            docId,
            fileInfo.filename,
            fileInfo.originalname,
            title,
            fileInfo.path,
            fileInfo.size,
            fileInfo.mimetype,
            content,
            category,
            healthScore,
            JSON.stringify(tags),
            JSON.stringify({})
          ]);

          const chunks = chunkText(content);

          for (let i = 0; i < chunks.length; i++) {
            const chunkId = uuidv4();
            const embedding = await getEmbedding(chunks[i]);

            await client.query(`
              INSERT INTO kb_chunks (id, doc_id, content, chunk_index, embedding)
              VALUES ($1, $2, $3, $4, $5)
            `, [chunkId, docId, chunks[i], i, embedding ? JSON.stringify(embedding) : null]);
          }

          await client.query(`
            UPDATE kb_documents
            SET processing_status = 'completed', chunk_count = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [chunks.length, docId]);

          await client.query('COMMIT');

          return {
            id: docId,
            title,
            filename: fileInfo.originalname,
            category,
            healthScore,
            tags,
            chunkCount: chunks.length,
            status: 'completed'
          };
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // AI 分析文档健康度
  async analyzeDocumentHealth(content) {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      const baseURL = 'https://api.deepseek.com/v1/chat/completions';

      const prompt = `请分析以下文档的AI引用健康度，从以下几个方面评估(0-100分)：
1. 内容结构化程度
2. 关键信息完整性
3. 专业术语准确性
4. 内容时效性

只需要返回一个0-100的整数分数。

文档内容预览：
${content.slice(0, 2000)}`;

      const response = await axios.post(baseURL, {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的文档质量评估助手。只返回数字分数。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const scoreText = response.data.choices[0].message.content;
      const score = parseInt(scoreText.match(/\d+/)?.[0] || '80');
      // 允许更广泛的分数范围 (20-100)，让评分更有区分度
      return Math.min(Math.max(score, 20), 100);
    } catch (error) {
      console.error('Health analysis error:', error.message);
      return 80; // 默认分数
    }
  }

  // Query knowledge base
  async query(queryText, topK = 5) {
    try {
      // Get query embedding
      const queryEmbedding = await getEmbedding(queryText);

      let rows;
      if (useSQLite) {
        rows = await db.all(`
          SELECT c.id, c.content, c.chunk_index, c.embedding, d.id as doc_id, d.original_name as filename
          FROM kb_chunks c
          JOIN kb_documents d ON c.doc_id = d.id
          WHERE d.status = 'completed'
          ORDER BY c.created_at DESC
          LIMIT 1000
        `);
      } else {
        const client = await db.pool.connect();
        try {
          const result = await client.query(`
            SELECT c.id, c.content, c.chunk_index, c.embedding, d.id as doc_id, d.original_name as filename
            FROM kb_chunks c
            JOIN kb_documents d ON c.doc_id = d.id
            WHERE d.status = 'completed'
            ORDER BY c.created_at DESC
            LIMIT 1000
          `);
          rows = result.rows;
        } finally {
          client.release();
        }
      }

      if (rows.length === 0) {
        return {
          answer: '知识库中暂无相关文档。请先上传文档。',
          sources: []
        };
      }

      // Calculate similarity scores
      const scoredChunks = rows.map(row => {
        const embedding = row.embedding ? JSON.parse(row.embedding) : null;
        const score = queryEmbedding && embedding
          ? cosineSimilarity(queryEmbedding, embedding)
          : // Fallback: simple keyword matching
            this.calculateKeywordScore(queryText, row.content);

        return {
          ...row,
          score
        };
      });

      // Sort by score and get top K
      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, topK);

      // Generate answer using DeepSeek
      const context = topChunks.map(c => c.content).join('\n\n---\n\n');
      const answer = await this.generateAnswer(queryText, context);

      return {
        answer,
        sources: topChunks.map(c => ({
          file: c.filename,
          relevance: Math.round(c.score * 100) / 100,
          snippet: c.content.slice(0, 200) + '...'
        }))
      };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  // Fallback keyword scoring
  calculateKeywordScore(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      if (word.length > 1) {
        const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += matches * 0.1;
      }
    }

    return Math.min(score, 1);
  }

  // Generate answer using DeepSeek API
  async generateAnswer(query, context) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = 'https://api.deepseek.com/v1/chat/completions';

    const prompt = `基于以下知识库内容，回答用户的问题。如果知识库中没有相关信息，请明确说明。

知识库内容：
${context}

用户问题：${query}

请给出简洁、准确的回答：
`;

    try {
      const response = await axios.post(baseURL, {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的知识库助手，基于提供的文档内容回答问题。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Answer generation error:', error.message);
      return '抱歉，生成回答时出现错误。请稍后重试。';
    }
  }

  // Get all documents (支持前端筛选和分页)
  async getAllDocuments(filters = {}) {
    let sql = `
      SELECT id, title, original_name as name, file_size as size, mime_type,
             category, health_score, citation_count, tags, chunk_count,
             processing_status, status, created_at
      FROM kb_documents
      WHERE status = 'active'
    `;
    const params = [];

    // 分类筛选
    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }

    // 健康度筛选
    if (filters.health) {
      if (filters.health === 'good') {
        sql += ` AND health_score >= 80`;
      } else if (filters.health === 'warning') {
        sql += ` AND health_score >= 60 AND health_score < 80`;
      } else if (filters.health === 'poor') {
        sql += ` AND health_score < 60`;
      }
    }

    // 搜索关键词
    if (filters.search) {
      sql += ` AND (title LIKE ? OR original_name LIKE ? OR tags LIKE ?)`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 排序
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const validSortFields = ['created_at', 'title', 'health_score', 'citation_count'];
    if (validSortFields.includes(sortField)) {
      sql += ` ORDER BY ${sortField} ${sortOrder}`;
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    // 分页
    const page = parseInt(filters.page) || 1;
    const pageSize = parseInt(filters.pageSize) || 12;
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    let rows;
    if (useSQLite) {
      rows = await db.all(sql, params);
    } else {
      const client = await db.pool.connect();
      try {
        const result = await client.query(sql.replace(/\?/g, (val, idx) => `$${idx + 1}`), params);
        rows = result.rows;
      } finally {
        client.release();
      }
    }

    return rows.map(row => ({
      id: row.id,
      title: row.title || row.name,
      name: row.name,
      size: this.formatFileSize(row.size),
      type: this.getFileType(row.mime_type, row.name),
      category: row.category,
      health: row.health_score,
      citations: row.citation_count,
      tags: JSON.parse(row.tags || '[]'),
      uploadTime: row.created_at,
      date: new Date(row.created_at).toLocaleDateString('zh-CN'),
      status: row.status
    }));
  }

  // 获取文档总数（用于分页）
  async getDocumentsCount(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM kb_documents WHERE status = 'active'`;
    const params = [];

    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }

    if (filters.health) {
      if (filters.health === 'good') {
        sql += ` AND health_score >= 80`;
      } else if (filters.health === 'warning') {
        sql += ` AND health_score >= 60 AND health_score < 80`;
      } else if (filters.health === 'poor') {
        sql += ` AND health_score < 60`;
      }
    }

    if (filters.search) {
      sql += ` AND (title LIKE ? OR original_name LIKE ? OR tags LIKE ?)`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    let result;
    if (useSQLite) {
      result = await db.get(sql, params);
    } else {
      const client = await db.pool.connect();
      try {
        const pgResult = await client.query(sql.replace(/\?/g, (val, idx) => `$${idx + 1}`), params);
        result = pgResult.rows[0];
      } finally {
        client.release();
      }
    }

    return result.count;
  }

  // 获取统计信息
  async getStats() {
    let sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN health_score >= 80 THEN 1 ELSE 0 END) as healthy,
        SUM(CASE WHEN health_score < 80 THEN 1 ELSE 0 END) as warning,
        SUM(citation_count) as total_citations
      FROM kb_documents
      WHERE status = 'active'
    `;

    let result;
    if (useSQLite) {
      result = await db.get(sql);
    } else {
      const client = await db.pool.connect();
      try {
        const pgResult = await client.query(sql);
        result = pgResult.rows[0];
      } finally {
        client.release();
      }
    }

    return {
      total: result.total || 0,
      healthy: result.healthy || 0,
      warning: result.warning || 0,
      citations: result.total_citations || 0
    };
  }

  // 辅助方法：获取文件类型
  getFileType(mimeType, filename) {
    if (mimeType?.includes('pdf')) return 'pdf';
    if (mimeType?.includes('word') || mimeType?.includes('document') || filename?.endsWith('.docx') || filename?.endsWith('.doc')) return 'doc';
    if (mimeType?.includes('text') || filename?.endsWith('.txt')) return 'txt';
    return 'default';
  }

  // Get document by ID (for download)
  async getDocumentById(docId) {
    if (useSQLite) {
      return await db.get('SELECT * FROM kb_documents WHERE id = ?', [docId]);
    } else {
      const client = await db.pool.connect();
      try {
        const result = await client.query('SELECT * FROM kb_documents WHERE id = $1', [docId]);
        return result.rows[0];
      } finally {
        client.release();
      }
    }
  }

  // Delete document (软删除)
  async deleteDocument(docId) {
    if (useSQLite) {
      await db.run("UPDATE kb_documents SET status = 'deleted' WHERE id = ?", [docId]);
    } else {
      const client = await db.pool.connect();
      try {
        await client.query("UPDATE kb_documents SET status = 'deleted' WHERE id = $1", [docId]);
      } finally {
        client.release();
      }
    }
    return true;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

module.exports = new KnowledgeBaseService();
