# 版本记录

## 2026-03-18 - 品牌拓词与可见度检测优化

### 已完成的工作

#### 1. 品牌拓词页面重构 (brand-keywords-exp.html)
- **关键词卡片化**：每个关键词变成可独立操作的卡片
- **问题预览区**：生成问题后先进入预览区，可编辑/勾选/删除后再同步
- **批量操作**：支持多选关键词批量生成问题
- **自定义问题**：可在预览区添加自定义问题
- **已入库区域**：显示已同步到问题库的所有问题

#### 2. 可见度检测页面优化 (geo-detection.html)
- **步骤顺序调整**：先选择问题 → 后选择平台 → 审核确认 → 执行检测
- **数据同步修复**：与问题库管理页面共用 `exp_detection_questions` 存储键
- **兼容旧数据**：支持从新版拓词(v2)、旧版拓词、问题库三种来源加载
- **问题列表数字标记**：标题旁显示问题总数，筛选时自动更新

#### 3. 数据流向统一
```
品牌拓词页面 ──同步──▶ 问题库管理 ──共用──▶ 可见度检测
     │                        │                    │
     └─ preview 问题          └─ 统一管理          └─ 优先加载
```

#### 4. 页面关联逻辑修复
| 页面 | 存储键 | 说明 |
|------|--------|------|
| 品牌拓词 | `exp_brand_keywords_v2` | 存储关键词和预览问题 |
| 问题库管理 | `exp_detection_questions` | 统一管理所有问题 |
| 可见度检测 | 优先读取问题库 | 确保与问题库管理同步 |

### 文件修改列表
- `auyologic-final/frontend/brand-keywords-exp.html` - 完全重构
- `auyologic-final/frontend/geo-detection.html` - 步骤调整和数据同步修复
- `auyologic-final/frontend/enterprise-settings.html` - 问题库管理（未修改）

### Git 提交记录
- **外层仓库**: `69d477a` Initial commit: project setup with git repository
- **前端仓库**: `8a48189` refactor: 重构品牌拓词和可见度检测页面

### 当前状态
✅ 所有修改已提交到 Git，工作区干净

### 已知问题
- 无

### 下一步建议
- 测试完整的业务流程：拓词 → 同步 → 检测
- 考虑添加数据迁移脚本（旧版数据 → 新版格式）

## 2026-03-18 - AI标签/关键词页与品牌拓词页统一存储

### 已完成的工作

#### 1. 统一存储格式
- AI标签/关键词页 (enterprise-settings.html) 现在使用 `exp_brand_keywords_v2` 存储键
- 与品牌拓词页使用相同的数据格式

#### 2. 双向同步实现
- **loadKeywords()**: 从 `exp_brand_keywords_v2` 读取数据，提取 text 字段转换为简单数组
- **syncToBrandKeywords()**: 将简单数组转换回对象格式保存，保留原有对象的扩展字段
- **extractKeywords()**: 辅助函数，支持从对象或字符串格式提取关键词

#### 3. 自动保存机制
- 添加关键词时自动调用 `syncToBrandKeywords()`
- 删除关键词时自动调用 `syncToBrandKeywords()`
- 添加推荐关键词时自动调用 `syncToBrandKeywords()`

#### 4. 按钮更新
- "添加到拓词关键词库" 按钮改为 "🔄 强制同步到拓词"
- 按钮样式改为 btn-secondary，添加 title 提示已自动同步

### 技术实现
```javascript
// 数据转换逻辑
// 加载：exp_brand_keywords_v2 (对象数组) → keywordsData (字符串数组)
// 保存：keywordsData (字符串数组) → exp_brand_keywords_v2 (对象数组)
```

### 文件修改列表
- `auyologic-final/frontend/enterprise-settings.html` - 关键词管理逻辑重构

### Git 提交记录
- 待提交

### 当前状态
✅ 代码修改完成，待测试和提交

### 下一步建议
- 测试双向同步：在品牌拓词页添加关键词，检查AI标签页是否同步
- 测试自动保存：在AI标签页添加/删除关键词，检查品牌拓词页是否更新
