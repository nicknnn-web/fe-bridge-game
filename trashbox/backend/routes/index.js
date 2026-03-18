/**
 * 路由入口文件
 * 统一注册所有 API 路由模块
 */

const express = require('express');
const router = express.Router();

// 导入各个路由模块
const articles = require('./articles');
const auth = require('./auth');
const brands = require('./brands');
const geo = require('./geo');
const knowledge = require('./knowledge');
const questions = require('./questions');
const platforms = require('./platforms');
const aiCitation = require('./aiCitation');
const keywords = require('./keywords');
const dashboard = require('./dashboard');
const files = require('./files');

// 注册路由
router.use('/articles', articles);
router.use('/auth', auth);
router.use('/brands', brands);
router.use('/geo', geo);
router.use('/kb', knowledge);
router.use('/questions', questions);
router.use('/platforms', platforms);
router.use('/ai-citation', aiCitation);
router.use('/keywords', keywords);
router.use('/dashboard', dashboard);
router.use('/files', files);

// 系统相关路由
router.post('/system/init', async (req, res) => {
  try {
    const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
    const initDB = useSQLite 
      ? require('../database/sqlite').init
      : require('../database/init').init;
    await initDB();
    res.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;