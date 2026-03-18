# 企业知识库页面改进计划

## 问题分析

### 1. Drawer 遮罩层设计问题
- **现状**: 使用 `background: #0f172a` 全屏深色遮罩，完全遮住左侧页面内容
- **影响**: 用户体验差，无法在看详情时参考左侧列表
- **解决方案**: 改为半透明遮罩 `rgba(15, 23, 42, 0.5)`，保留左侧内容可见性

### 2. 模拟数据问题
- **现状**: 前端使用硬编码的 `knowledgeData` 数组
- **后端现状**: 已有完整的 `knowledgeBaseService` 和 REST API
  - `GET /api/kb/files` - 获取文件列表
  - `POST /api/kb/upload` - 上传文件
  - `DELETE /api/kb/files/:id` - 删除文件
  - `GET /api/kb/files/:id/download` - 下载文件
- **解决方案**: 前端调用真实 API

### 3. 上传功能未实现
- **现状**: `handleUpload()` 只添加到本地数组
- **解决方案**: 使用 FormData 调用 `/api/kb/upload` API

## 实现步骤

### 步骤 1: 修复 Drawer 遮罩层样式
修改 `.kb-drawer-overlay` 样式：
```css
.kb-drawer-overlay {
    background: rgba(15, 23, 42, 0.5);  /* 半透明 */
    backdrop-filter: blur(2px);          /* 轻微模糊效果 */
}
```

### 步骤 2: 前端 API 集成
1. 添加 `loadKnowledgeFiles()` 函数调用 `GET /api/kb/files`
2. 将后端数据映射到前端展示格式
3. 添加加载状态显示

### 步骤 3: 实现真实上传
1. 创建 `uploadFile()` 函数
2. 使用 `FormData` 封装文件和元数据
3. 调用 `POST /api/kb/upload`
4. 上传成功后刷新列表

### 步骤 4: 实现删除功能
1. 调用 `DELETE /api/kb/files/:id`
2. 删除成功后刷新列表

### 步骤 5: 实现下载功能
1. 调用 `GET /api/kb/files/:id/download`
2. 使用 Blob 创建下载链接

## 数据映射

后端数据格式：
```json
{
  "id": "uuid",
  "name": "filename.pdf",
  "size": "1.5 MB",
  "mime_type": "application/pdf",
  "chunk_count": 5,
  "status": "completed",
  "created_at": "2024-01-15",
  "metadata": {"category": "技术文档"}
}
```

前端展示格式：
```javascript
{
  id: doc.id,
  title: doc.name,
  type: mimeTypeToType(doc.mime_type),
  category: doc.metadata?.category || '未分类',
  size: doc.size,
  createdAt: doc.created_at,
  status: doc.status
}
```

## API 端点汇总

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 获取列表 | GET | `/api/kb/files` | 获取所有知识库文件 |
| 上传文件 | POST | `/api/kb/upload` | FormData 格式，字段：file, category |
| 删除文件 | DELETE | `/api/kb/files/:id` | 删除指定文件 |
| 下载文件 | GET | `/api/kb/files/:id/download` | 下载文件内容 |
