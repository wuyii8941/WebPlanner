# AI旅行规划器 - WebPlanner

一个基于AI的智能旅行规划应用，通过语音和文字输入自动生成个性化的旅行路线，提供完整的行程规划、费用管理和地图导航功能。

## 🌟 核心功能

### 1. 智能行程规划
- **多模态输入**: 支持语音和文字输入旅行需求
- **AI自动生成**: 基于DeepSeek大模型自动生成个性化旅行路线
- **详细行程**: 包含交通、住宿、景点、餐厅等完整信息

### 2. 费用预算与管理
- **智能预算分析**: AI根据用户预算进行费用分配
- **实时记账**: 支持语音记账，实时跟踪旅行开销
- **预算提醒**: 实时显示预算使用情况和剩余金额

### 3. 用户管理与数据存储
- **安全认证**: Firebase Authentication用户注册登录
- **云端同步**: Firestore实时数据同步，支持多设备访问
- **行程管理**: 保存和管理多份旅行计划

### 4. 地图集成
- **高德地图**: 集成高德地图API，提供地理位置服务
- **行程可视化**: 在地图上标记所有行程地点
- **导航支持**: 提供地点导航功能

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具

### 后端服务
- **Firebase Authentication** - 用户认证
- **Firestore** - 实时数据库
- **Firebase Security Rules** - 数据安全

### 第三方API
- **DeepSeek API** - AI行程规划
- **高德地图API** - 地图服务和地理编码
- **浏览器SpeechRecognition** - 语音识别（主要）
- **科大讯飞API** - 语音识别（备用）

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/wuyii8941/WebPlanner.git
   cd WebPlanner
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置Firebase**
   - 复制 `firebase-config.example.js` 为 `firebase-config.js`
   - 在 [Firebase控制台](https://console.firebase.google.com/) 创建新项目
   - 启用 Authentication 和 Firestore
   - 将配置信息填入 `firebase-config.js`

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **配置API Keys**
   - 打开应用并注册/登录
   - 进入设置页面配置以下API Keys:
     - **DeepSeek API Key** (必需)
     - **高德地图 API Key** (必需)
     - **科大讯飞 API Key** (可选)

### API Key获取指南

#### DeepSeek API
1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册账号并获取API Key
3. 在应用设置页面填入

#### 高德地图API
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册实名认证账号
3. 创建应用获取Web服务API Key
4. 在应用设置页面填入

#### 科大讯飞API (可选)
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 注册认证获取语音识别API
3. 在应用设置页面填入

## 📦 Docker部署

### 使用Docker Compose (推荐)

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down
```

服务将在 http://localhost:8080 运行

### 手动Docker构建

```bash
# 构建镜像
docker build -t webplanner .

# 运行容器
docker run -p 8080:80 webplanner
```

## 🔧 项目结构

```
WebPlanner/
├── src/
│   ├── App.jsx              # 主应用组件
│   ├── main.jsx             # 应用入口
│   └── index.css            # 全局样式
├── firebase-config.example.js # Firebase配置示例
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔒 安全特性

- **API Key安全**: 所有API Keys通过localStorage管理，不在代码中硬编码
- **数据隔离**: Firebase安全规则确保用户数据隔离
- **输入验证**: 所有用户输入都经过验证和清理
- **错误处理**: 完善的错误处理和用户提示

## 📱 功能演示

### 1. 用户认证
- 邮箱/密码注册登录
- 自动重定向到设置页面配置API Keys

### 2. 行程创建
- 语音/文字输入旅行需求
- AI自动生成完整行程
- 实时保存到云端

### 3. 行程查看
- 时间线展示每日行程
- 地图标记所有活动地点
- 预算和住宿信息展示

### 4. 费用管理
- 语音记账功能
- 实时预算计算
- 费用分类统计

## 🐛 故障排除

### 常见问题

1. **Firebase配置错误**
   - 确保正确配置 `firebase-config.js`
   - 检查Firebase控制台中的项目设置

2. **API Key无效**
   - 确认API Key是否正确
   - 检查API服务配额是否用完

3. **语音识别不工作**
   - 确保使用HTTPS或localhost
   - 检查浏览器权限设置

### 开发调试

```bash
# 启用详细日志
DEBUG=* npm run dev

# 检查构建
npm run build
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [wuyii8941](https://github.com/wuyii8941)
- 问题反馈: [GitHub Issues](https://github.com/wuyii8941/WebPlanner/issues)

## 🙏 致谢

- [Firebase](https://firebase.google.com/) - 后端即服务
- [DeepSeek](https://www.deepseek.com/) - AI大语言模型
- [高德地图](https://lbs.amap.com/) - 地图服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Vite](https://vitejs.dev/) - 构建工具
