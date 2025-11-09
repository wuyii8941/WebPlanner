# Firebase代理配置指南

## 问题描述
Firebase Firestore连接超时错误：`net::ERR_CONNECTION_TIMED_OUT`

## 解决方案
已配置Vite开发服务器代理，通过7890端口访问Firebase服务。

## 配置详情

### 1. Vite代理配置 (`vite.config.js`)
```javascript
server: {
  proxy: {
    // Firebase Firestore 代理配置 - 只代理Firebase相关请求
    '/google.firestore.v1.Firestore': {
      target: 'https://firestore.googleapis.com',
      changeOrigin: true,
      secure: false,
      ws: true
    },
    // Firebase Auth 代理配置
    '/identitytoolkit.googleapis.com': {
      target: 'https://identitytoolkit.googleapis.com',
      changeOrigin: true,
      secure: false
    },
    // 只代理Firebase特定的v1路径，不影响其他API
    '^/v1/projects/.*': {
      target: 'https://firestore.googleapis.com',
      changeOrigin: true,
      secure: false
    }
  }
}
```

**重要更新**：代理配置已优化，现在只针对Firebase服务，不会影响其他API（如DeepSeek AI API）。

### 2. 环境变量配置 (`.env`)
```env
# 代理配置
VITE_PROXY_ENABLED=true
VITE_PROXY_SERVER=http://127.0.0.1:7890
```

## 测试步骤

### 方法1：使用代理测试页面
1. 确保代理软件（Clash、V2Ray等）正在运行并监听7890端口
2. 访问 http://localhost:3000/proxy-test (需要先添加路由)
3. 点击"运行连接测试"按钮
4. 查看所有测试项是否显示绿色

### 方法2：手动测试
1. 打开浏览器开发者工具 → Network标签
2. 尝试创建旅行记录
3. 观察是否有到Firebase的请求
4. 检查请求是否成功（状态码200）

## 故障排除

### 如果代理测试失败：

1. **检查代理软件状态**
   - 确认代理软件正在运行
   - 确认监听端口为7890
   - 测试代理是否能正常访问Google服务

2. **检查网络连接**
   ```bash
   # 测试代理连接
   curl -x http://127.0.0.1:7890 https://firestore.googleapis.com
   ```

3. **检查Vite配置**
   - 确认 `vite.config.js` 中的代理配置正确
   - 重启开发服务器：`npm run dev`

4. **检查环境变量**
   - 确认 `.env` 文件中的代理配置正确
   - 确保环境变量已加载

### 常见错误及解决方案

**错误1：代理连接失败**
- 原因：代理软件未运行或端口错误
- 解决：启动代理软件，确认端口为7890

**错误2：Firebase初始化失败**
- 原因：环境变量配置错误
- 解决：检查 `.env` 文件中的Firebase配置

**错误3：Firestore权限错误**
- 原因：数据库规则限制
- 解决：在Firebase控制台调整Firestore规则

## 开发说明

### 代理测试工具
- 位置：`src/services/proxyTestService.js`
- 功能：完整的连接测试和诊断报告
- 使用：`await proxyTestService.runFullTest()`

### 测试组件
- 位置：`src/components/ProxyTest.jsx`
- 功能：可视化测试界面
- 路由：`/proxy-test` (需要配置)

## 生产环境注意事项

⚠️ **重要**：代理配置仅用于开发环境。生产环境需要：
- 确保服务器能直接访问Firebase服务
- 移除代理相关配置
- 使用正确的生产环境配置

## 技术支持

如果问题仍然存在：
1. 查看浏览器控制台错误信息
2. 运行代理测试生成诊断报告
3. 检查代理软件日志
4. 验证网络连接状态
