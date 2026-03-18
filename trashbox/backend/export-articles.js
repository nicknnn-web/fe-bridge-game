const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('正在获取文章数据...');

const req = http.request({hostname:'localhost',port:3000,path:'/api/articles',method:'GET'}, res => {
  let body = '';
  res.on('data',chunk => body += chunk);
  res.on('end',() => {
    try {
      const data = JSON.parse(body);
      if (data.success && data.data.length > 0) {
        const exportsDir = path.join(__dirname, 'generated', 'exports');
        
        // 确保目录存在
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        let count = 0;
        for (const article of data.data) {
          // 创建文件名
          const safeTitle = article.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
          const filename = `${safeTitle}-${article.id.substring(0,8)}.md`;
          const filepath = path.join(exportsDir, filename);
          
          // 处理关键词
          let keywords = '';
          if (Array.isArray(article.keywords)) {
            keywords = article.keywords.join(', ');
          } else if (typeof article.keywords === 'object' && article.keywords !== null) {
            keywords = Object.values(article.keywords).join(', ');
          } else {
            keywords = String(article.keywords || '无');
          }
          
          // 构建Markdown内容
          const content = `# ${article.title}

---

**摘要**: ${article.summary || '无'}

**关键词**: ${keywords}

**风格**: ${article.style || '无'}

**AI模型**: ${article.model_used || '未知'}

**创建时间**: ${article.created_at}

---

${article.content}

---

*本文由 AI 生成 - AuyoLogic 平台*
`;
          
          fs.writeFileSync(filepath, content, 'utf8');
          count++;
          console.log('已保存:', filepath);
        }
        console.log(`\n共导出 ${count} 篇文章到 generated/exports 文件夹`);
      } else {
        console.log('没有找到文章数据');
      }
    } catch (e) {
      console.error('解析错误:', e.message);
    }
  });
});
req.end();
