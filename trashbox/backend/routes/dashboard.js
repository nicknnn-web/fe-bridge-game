/**
 * 仪表盘路由模块
 * 处理统计数据和报表
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

const useSQLite = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';
const ArticleDB = useSQLite 
  ? require('../database/articleDB-sqlite') 
  : require('../database/articleDB');
const brandService = require('../services/brandService');
const platformService = require('../services/platformService');
const questionService = require('../services/questionService');

// 仪表盘综合统计
router.get('/stats', asyncHandler(async (req, res) => {
  const articleDB = new ArticleDB();
  const articles = await articleDB.getAll();
  
  const brands = await brandService.getAll();
  const platforms = await platformService.getAllAccounts();
  const questions = await questionService.getAll();
  
  const boundPlatforms = platforms.filter(p => p.binding_status === 'bound');
  const totalFollowers = boundPlatforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  
  res.json({
    success: true,
    data: {
      totalArticles: articles.length,
      publishedArticles: articles.filter(a => a.status === 'completed').length,
      totalBrands: brands.length,
      totalPlatforms: platforms.length,
      boundPlatforms: boundPlatforms.length,
      totalFollowers: totalFollowers,
      totalQuestions: questions.length,
      hotQuestions: questions.filter(q => q.heat_score > 100).length
    }
  });
}));

// 报表数据
router.get('/reports', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      geo: {
        totalDetections: 12,
        recentTrend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - 86400000 * (6 - i)).toISOString(),
          score: 72 + Math.floor(Math.random() * 15)
        })),
        scoreDistribution: { excellent: 5, good: 4, needs_improvement: 3 }
      },
      brand: {
        totalBrands: 3,
        platformComparison: {
          deepseek: 85, doubao: 78, kimi: 80, tongyi: 83, wenxin: 79, yuanbao: 75
        }
      },
      keywords: {
        totalExpansions: 8
      }
    }
  });
}));

module.exports = router;