/**
 * AI引用状态检测服务
 * 用于检测发布内容在各AI平台的索引和引用状态
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, '../../data/ai_citation_config.json');

// 内存缓存
let config = null;
let statusCache = new Map();
let cacheTimestamp = null;

// 加载配置
function loadConfig() {
    if (!config) {
        try {
            const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
            config = JSON.parse(configData);
        } catch (error) {
            console.error('加载AI引用配置失败:', error);
            config = getDefaultConfig();
        }
    }
    return config;
}

// 获取默认配置
function getDefaultConfig() {
    return {
        detectionSources: [
            { id: 'deepseek', name: 'DeepSeek', priority: 1, enabled: true },
            { id: 'doubao', name: '豆包', priority: 2, enabled: true },
            { id: 'kimi', name: 'Kimi', priority: 3, enabled: true },
            { id: 'qwen', name: '通义千问', priority: 4, enabled: true },
            { id: 'ernie', name: '文心一言', priority: 5, enabled: true },
            { id: 'hunyuan', name: '腾讯元宝', priority: 6, enabled: true }
        ],
        statusMapping: {
            cited: { status: 'cited', icon: '🟢', label: '已被引用', description: '检测到你的内容出现在AI回答中' },
            indexed: { status: 'indexed', icon: '🟡', label: '已被索引', description: '内容已被平台收录，但AI尚未引用' },
            not_indexed: { status: 'not_indexed', icon: '🔴', label: '未收录', description: '内容未被平台收录' },
            checking: { status: 'checking', icon: '⏳', label: '检测中', description: '正在获取AI引用状态' },
            unknown: { status: 'unknown', icon: '❓', label: '状态未知', description: '获取状态失败，请点击重试' }
        }
    };
}

// 模拟AI平台检测（实际项目中应调用真实API）
async function detectPlatformStatus(platformId, articleUrl, articleTitle) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // 模拟随机结果（实际项目中应根据API返回结果判断）
    const rand = Math.random();
    
    // 70%概率被索引，30%概率未被索引
    // 在被索引的内容中，40%概率被引用
    if (rand < 0.7) {
        const citedRand = Math.random();
        if (citedRand < 0.4) {
            return { indexed: true, cited: true, timestamp: new Date().toISOString() };
        } else {
            return { indexed: true, cited: false, timestamp: new Date().toISOString() };
        }
    } else {
        return { indexed: false, cited: false, timestamp: new Date().toISOString() };
    }
}

// 综合所有平台的检测结果，确定最终状态
function determineOverallStatus(platformResults) {
    const cfg = loadConfig();
    const statusMapping = cfg.statusMapping;

    // 检查是否有被引用的
    const citedPlatforms = platformResults.filter(p => p.cited);
    if (citedPlatforms.length > 0) {
        return {
            status: 'cited',
            ...statusMapping.cited,
            details: citedPlatforms.map(p => p.platformName).join('、'),
            platforms: platformResults
        };
    }

    // 检查是否有被索引的
    const indexedPlatforms = platformResults.filter(p => p.indexed);
    if (indexedPlatforms.length > 0) {
        return {
            status: 'indexed',
            ...statusMapping.indexed,
            details: indexedPlatforms.map(p => p.platformName).join('、'),
            platforms: platformResults
        };
    }

    // 都未被索引
    return {
        status: 'not_indexed',
        ...statusMapping.not_indexed,
        details: '',
        platforms: platformResults
    };
}

// 检测单篇文章的AI引用状态
async function detectArticleStatus(articleId, articleUrl, articleTitle) {
    const cfg = loadConfig();
    const enabledSources = cfg.detectionSources.filter(s => s.enabled)
        .sort((a, b) => a.priority - b.priority);

    const platformResults = [];

    for (const source of enabledSources) {
        try {
            const result = await detectPlatformStatus(source.id, articleUrl, articleTitle);
            platformResults.push({
                platformId: source.id,
                platformName: source.name,
                ...result
            });
        } catch (error) {
            platformResults.push({
                platformId: source.id,
                platformName: source.name,
                indexed: false,
                cited: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    const overallStatus = determineOverallStatus(platformResults);

    // 缓存结果
    const cacheKey = `article_${articleId}`;
    statusCache.set(cacheKey, {
        articleId,
        ...overallStatus,
        updatedAt: new Date().toISOString()
    });

    return {
        articleId,
        ...overallStatus
    };
}

// 批量检测多篇文章
async function batchDetectStatus(articles) {
    const results = [];
    
    for (const article of articles) {
        const result = await detectArticleStatus(
            article.id,
            article.url || `https://example.com/article/${article.id}`,
            article.title
        );
        results.push(result);
    }

    return results;
}

// 获取缓存的状态
function getCachedStatus(articleId) {
    const cacheKey = `article_${articleId}`;
    return statusCache.get(cacheKey) || null;
}

// 获取配置
function getConfig() {
    return loadConfig();
}

// 刷新所有文章状态（定时任务调用）
async function refreshAllStatuses(articles) {
    console.log('[AI Citation] 开始刷新所有文章状态...');
    const startTime = Date.now();
    
    const results = await batchDetectStatus(articles);
    
    console.log(`[AI Citation] 状态刷新完成，耗时: ${Date.now() - startTime}ms`);
    return results;
}

module.exports = {
    detectArticleStatus,
    batchDetectStatus,
    getCachedStatus,
    getConfig,
    refreshAllStatuses,
    loadConfig
};
