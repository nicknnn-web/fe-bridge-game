# 启动脚本使用指南

## 📁 当前可用脚本

### 1. `auyologic-final/restart-server.bat` ⭐ 推荐
**用途**：快速重启服务器（带验证）

**功能**：
- 关闭占用 3001 端口的旧进程
- 检查代码语法
- 启动新服务器
- 自动验证服务是否正常

**使用方法**：
```bash
cd auyologic-final
restart-server.bat
```

---

### 2. `auyologic-final/test-api.bat` ⭐ 推荐
**用途**：快速测试 API 是否正常

**功能**：
- 测试 /health 接口
- 测试 /api/articles 接口
- 测试 /api/brands 接口

**使用方法**：
```bash
cd auyologic-final
test-api.bat
```

---

### 3. `auyologic-final/start-website.bat` （原有）
**用途**：完整的启动流程

**功能**：
- 关闭旧进程
- 启动服务器
- 自动打开浏览器

---

## 🗑️ 已删除的脚本

| 文件名 | 删除原因 |
|--------|----------|
| `start-geo-website.bat` | 与 `start-website.bat` 功能重复 |

---

## 🚀 快速开始流程

### 第一次启动：
```bash
cd auyologic-final
restart-server.bat
```

### 测试 API：
```bash
test-api.bat
```

### 日常使用：
```bash
# 修改代码后重启
restart-server.bat

# 验证是否正常工作
test-api.bat
```

---

## ⚠️ 注意事项

1. **restart-server.bat** 会强制关闭所有 node.exe 进程
2. **test-api.bat** 需要 curl 命令支持（Windows 10+ 自带）
3. 如果端口 3001 被其他程序占用，需要手动关闭