# 代码质量改进方案

## 1. JavaScript 模块化（已完成）

### 变更内容
- 创建了 [`knowledge.js`](auyologic-final/frontend/js/knowledge.js) 模块文件
- 将知识库相关功能从 HTML 内联脚本迁移到独立 JS 文件
- 使用 `KnowledgeModule` 命名空间组织代码，避免全局污染
- 添加 JSDoc 注释，提高代码可读性

### 迁移步骤
1. 确认 [`knowledge.html`](auyologic-final/frontend/knowledge.html) 中已引入新模块：
   ```html
   <script src="js/knowledge.js"></script>
   ```

2. 保留兼容层：新模块已导出全局函数，无需修改 HTML 中的 onclick 调用

3. 后续优化：将所有 HTML 中的内联事件处理改为事件委托

---

## 2. 代码检查工具配置

### 2.1 ESLint 配置

创建 [`.eslintrc.json`](auyologic-final/.eslintrc.json)：

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-unreachable": "error",
    "no-unexpected-multiline": "error",
    "semi": ["error", "always"],
    "quotes": ["warn", "single"],
    "indent": ["warn", 4],
    "no-trailing-spaces": "warn",
    "eol-last": ["error", "always"],
    "no-multiple-empty-lines": ["warn", { "max": 2 }]
  },
  "globals": {
    "KnowledgeModule": "readonly"
  }
}
```

### 2.2 Prettier 配置

创建 [`.prettierrc`](auyologic-final/.prettierrc)：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 4,
  "endOfLine": "lf"
}
```

### 2.3 VS Code 工作区配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.encoding": "utf8",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.eol": "\n"
}
```

### 2.4 Git 提交前检查

创建 `.husky/pre-commit` 钩子：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 检查 JavaScript 语法
npx eslint frontend/js/*.js --fix

# 检查文件编码
node scripts/check-encoding.js
```

---

## 3. 预防机制

### 3.1 编码规范检查脚本

创建 [`scripts/check-encoding.js`](auyologic-final/scripts/check-encoding.js)：

```javascript
/**
 * 文件编码和格式检查脚本
 * 用于在提交前检查文件是否符合规范
 */

const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = ['.html', '.js', '.css', '.json'];
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

let hasError = false;

function checkFile(filePath) {
    const content = fs.readFileSync(filePath);
    
    // 检查 BOM
    if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
        console.error(`❌ ${filePath}: 包含 UTF-8 BOM，请移除`);
        hasError = true;
    }
    
    // 检查零宽字符
    const text = content.toString('utf8');
    const zeroWidthChars = /[\u200B-\u200D\uFEFF]/g;
    if (zeroWidthChars.test(text)) {
        console.error(`❌ ${filePath}: 包含零宽字符`);
        hasError = true;
    }
    
    // 检查文件末尾是否有换行
    if (!text.endsWith('\n')) {
        console.error(`❌ ${filePath}: 文件末尾缺少换行符`);
        hasError = true;
    }
    
    // 检查 CRLF 换行符
    if (text.includes('\r\n')) {
        console.warn(`⚠️  ${filePath}: 包含 CRLF 换行符，建议转换为 LF`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (TARGET_EXTENSIONS.includes(path.extname(file))) {
            checkFile(filePath);
        }
    }
}

console.log('🔍 检查文件编码和格式...\n');
walkDir(FRONTEND_DIR);

if (hasError) {
    console.error('\n❌ 检查失败，请修复上述问题后重试');
    process.exit(1);
} else {
    console.log('\n✅ 所有文件检查通过');
    process.exit(0);
}
```

### 3.2 开发规范文档

#### HTML 文件规范

1. **编码格式**
   - 使用 UTF-8 无 BOM 格式
   - 使用 LF 换行符（Unix 风格）
   - 文件末尾保留一个空行

2. **JavaScript 内联代码**
   - 尽量避免内联 `<script>` 标签
   - 如必须使用，保持代码简洁，不超过 50 行
   - 复杂逻辑必须分离到独立 `.js` 文件

3. **事件处理**
   - 优先使用事件委托，避免内联 `onclick`
   - 示例：
     ```javascript
     // ❌ 不推荐
     <button onclick="handleClick()">
     
     // ✅ 推荐
     document.getElementById('btn').addEventListener('click', handleClick);
     ```

#### JavaScript 规范

1. **模块化**
   - 使用命名空间模式组织代码
   - 每个模块单一职责
   - 添加 JSDoc 注释

2. **错误处理**
   - 所有异步操作必须 try-catch
   - 网络请求必须检查响应状态
   - 用户操作必须有反馈（Toast/Alert）

3. **安全**
   - 所有用户输入必须转义（使用 `escapeHtml`）
   - 避免使用 `eval()` 和 `innerHTML` 插入不可信内容

---

## 4. 验证清单

### 每次修改后检查

- [ ] 浏览器控制台无 JavaScript 错误
- [ ] 功能按钮点击正常响应
- [ ] 文件编码为 UTF-8 无 BOM
- [ ] 文件使用 LF 换行符
- [ ] 代码通过 ESLint 检查

### 提交前检查

```bash
# 运行 ESLint
npx eslint frontend/js/*.js

# 运行编码检查
node scripts/check-encoding.js

# 测试核心功能
# 1. 页面加载无错误
# 2. "新建知识"按钮弹出 Modal
# 3. 文件上传功能正常
# 4. 详情抽屉可正常打开关闭
```

---

## 5. 后续优化建议

### 短期（1-2 周）
1. 迁移所有页面的内联 JavaScript 到独立文件
2. 配置 ESLint 和 Prettier
3. 添加 Git 提交前钩子

### 中期（1 个月）
1. 引入前端构建工具（Vite 或 Webpack）
2. 添加单元测试（Jest）
3. 实现错误监控（Sentry）

### 长期（3 个月）
1. 迁移到现代前端框架（Vue 3 或 React）
2. 实现 TypeScript 类型安全
3. 添加 E2E 测试（Playwright）
