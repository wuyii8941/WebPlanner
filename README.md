# AI旅行规划器 - WebPlanner

一个基于AI的智能旅行规划应用，通过语音和文字输入自动生成个性化的旅行路线，提供完整的行程规划、费用管理和地图导航功能。

## 🌟 项目概述

**WebPlanner** 是一款创新的智能旅行规划软件，旨在简化旅行规划过程。通过AI技术理解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助功能。

## 🎯 核心功能

### 1. 智能行程规划
- **多模态输入**: 支持语音和文字输入旅行需求
- **AI自动生成**: 基于DeepSeek大模型自动生成个性化旅行路线
- **详细行程**: 包含交通、住宿、景点、餐厅等完整信息
- **个性化推荐**: 根据用户偏好（美食、动漫、亲子等）定制行程

### 2. 费用预算与管理
- **智能预算分析**: AI根据用户预算进行费用分配
- **实时记账**: 支持语音记账，实时跟踪旅行开销
- **预算提醒**: 实时显示预算使用情况和剩余金额
- **费用分类**: 自动分类交通、住宿、餐饮、娱乐等费用

### 3. 用户管理与数据存储
- **安全认证**: Firebase Authentication用户注册登录
- **云端同步**: Firestore实时数据同步，支持多设备访问
- **行程管理**: 保存和管理多份旅行计划
- **偏好设置**: 保存用户旅行偏好和历史记录

### 4. 地图集成与导航
- **百度地图**: 集成百度地图API，提供地理位置服务
- **行程可视化**: 在地图上标记所有行程地点
- **智能定位**: 自动定位到旅行目的地
- **导航支持**: 提供地点导航和路线规划

### 5. 语音交互
- **语音输入**: 支持语音描述旅行需求
- **语音记账**: 语音记录旅行开销
- **多平台支持**: 浏览器原生语音识别 + 科大讯飞API备用

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **百度地图JavaScript API** - 地图服务

### 后端服务
- **Firebase Authentication** - 用户认证
- **Firestore** - 实时数据库
- **Firebase Security Rules** - 数据安全

### 第三方API集成
- **DeepSeek API** - AI行程规划和费用预算
- **百度地图API** - 地图服务和地理编码
- **科大讯飞API** - 语音识别服务
- **浏览器SpeechRecognition** - 原生语音识别

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn
- 现代浏览器（支持Web Speech API）

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

5. **访问应用**
   打开浏览器访问 `http://localhost:5173`

## 🔑 API密钥配置（重要）

### 预配置API密钥（供助教测试使用）

以下API密钥已预配置在项目中，保证3个月内有效，助教可直接使用：

| API服务 | API密钥 |
|---------|---------|
| **百度地图API** | `a5TgeT2IkvMiZO7kyrq2nkT4mlEEtmUp` |
| **DeepSeek AI API** | `sk-674c20d824f942a59d7cb09426c0d33b` |
| **科大讯飞API** | `78b46e0bacff3d433ca3fa3e52fc3f56` |

### 详细API密钥信息

#### 百度地图API
- **API Key**: `a5TgeT2IkvMiZO7kyrq2nkT4mlEEtmUp`
- **用途**: 地图显示、地理编码、路线规划
- **有效期**: 3个月

#### DeepSeek AI API
- **API Key**: `sk-674c20d824f942a59d7cb09426c0d33b`
- **用途**: AI行程规划、费用预算分析
- **有效期**: 3个月

#### 科大讯飞API
- **API Key**: `78b46e0bacff3d433ca3fa3e52fc3f56`
- **用途**: 语音识别（备用方案）
- **有效期**: 3个月

### 自定义配置
如需使用自己的API密钥，可在应用设置页面进行配置：
1. 注册登录后进入设置页面
2. 在API配置区域填入相应密钥
3. 保存设置后即可使用

## 📦 Docker部署

### 环境要求
- Docker 20.10+ 或 Docker Desktop
- 至少 2GB 可用内存
- 稳定的网络连接

### 安装Docker（如未安装）

#### Windows系统
1. 下载并安装 [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. 启动Docker Desktop
3. 确保WSL 2后端已启用

#### macOS系统
1. 下载并安装 [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. 启动Docker Desktop

#### Linux系统（Ubuntu/Debian）
```bash
# 更新包索引
sudo apt update

# 安装Docker
sudo apt install docker.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组（可选）
sudo usermod -aG docker $USER

# 重新登录或重启生效
```

### 使用Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务将在 http://localhost:8080 运行

### 手动Docker构建

```bash
# 构建镜像
docker build -t webplanner .

# 运行容器
docker run -d -p 8080:80 --name webplanner-app webplanner

# 查看容器状态
docker ps

# 查看容器日志
docker logs webplanner-app

# 停止容器
docker stop webplanner-app

# 删除容器
docker rm webplanner-app
```

### Docker镜像信息
- **基础镜像**: nginx:alpine
- **端口**: 80 (容器内) -> 8080 (主机)
- **构建命令**: `docker build -t webplanner .`
- **运行命令**: `docker run -p 8080:80 webplanner`

### 验证部署
部署完成后，打开浏览器访问 `http://localhost:8080`，应该能看到WebPlanner应用界面。

### 预构建Docker镜像（推荐）

我们已通过GitHub Actions自动构建并推送Docker镜像到阿里云镜像仓库，助教可以直接拉取使用：

```bash
# 拉取预构建的Docker镜像
docker pull registry.cn-hangzhou.aliyuncs.com/wuyii8941/WebPlanner:latest

# 运行容器
docker run -d -p 8080:80 --name webplanner-app registry.cn-hangzhou.aliyuncs.com/wuyii8941/WebPlanner:latest
```

**镜像信息**:
- **镜像地址**: `registry.cn-hangzhou.aliyuncs.com/wuyii8941/WebPlanner:latest`
- **构建状态**: 每次推送到main分支时自动构建
- **最新版本**: 始终与GitHub仓库main分支同步

### GitHub Actions自动构建

项目配置了GitHub Actions工作流，自动完成以下操作：
1. 代码推送到main分支时触发构建
2. 自动构建Docker镜像
3. 推送到阿里云镜像仓库
4. 生成多个标签（latest、分支名、commit hash等）

如需配置自己的阿里云镜像仓库，需要在GitHub仓库设置中添加以下Secrets：
- `ALIYUN_USERNAME`: 阿里云账号用户名
- `ALIYUN_PASSWORD`: 阿里云账号密码

## 🔧 项目结构

```
WebPlanner/
├── src/
│   ├── components/           # React组件
│   │   ├── TripForm.jsx     # 行程创建表单
│   │   ├── TripList.jsx     # 行程列表
│   │   ├── TripDetail.jsx   # 行程详情（含地图）
│   │   ├── ExpenseTracker.jsx # 费用跟踪器
│   │   ├── Settings.jsx     # 设置页面
│   │   └── WeatherWidget.jsx # 天气组件
│   ├── pages/               # 页面组件
│   │   ├── AppPage.jsx      # 主应用页面
│   │   ├── LoginPage.jsx    # 登录页面
│   │   └── RegisterPage.jsx # 注册页面
│   ├── services/            # 服务层
│   │   ├── aiService.js     # AI服务
│   │   ├── mapService.js    # 地图服务
│   │   ├── speechService.js # 语音服务
│   │   ├── tripService.js   # 行程服务
│   │   └── weatherService.js # 天气服务
│   ├── models/              # 数据模型
│   │   └── Trip.js          # 行程数据模型
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
├── nginx.conf               # Nginx配置
└── README.md
```

## 📱 使用指南

### 1. 用户注册与登录
- 首次使用需要注册账号
- 支持邮箱密码注册登录
- 自动重定向到主应用页面

### 2. 创建新行程
- 点击"新建行程"按钮
- 通过语音或文字输入旅行需求：
  - 目的地（如：日本）
  - 旅行天数（如：5天）
  - 预算（如：1万元）
  - 同行人数
  - 旅行偏好（如：美食、动漫、带孩子）
- AI自动生成完整行程计划

### 3. 查看和管理行程
- 在行程列表中查看所有行程
- 点击行程查看详细信息
- 地图显示所有活动地点
- 时间线展示每日安排

### 4. 费用管理
- 在行程详情页面记录开销
- 支持语音记账："今天午餐花费200元"
- 实时更新预算使用情况
- 查看费用分类统计

### 5. 语音功能使用
- 确保浏览器支持Web Speech API
- 允许麦克风权限
- 点击语音按钮开始录音
- 系统自动识别并处理语音输入

## 🔒 安全特性

- **API Key安全**: 所有API Keys通过localStorage管理，不在代码中硬编码
- **数据隔离**: Firebase安全规则确保用户数据隔离
- **输入验证**: 所有用户输入都经过验证和清理
- **错误处理**: 完善的错误处理和用户提示
- **HTTPS支持**: 生产环境强制使用HTTPS

## 🐛 故障排除

### 常见问题

1. **Firebase配置错误**
   - 确保正确配置 `firebase-config.js`
   - 检查Firebase控制台中的项目设置
   - 验证Authentication和Firestore已启用

2. **API Key无效**
   - 确认API Key是否正确
   - 检查API服务配额是否用完
   - 验证网络连接和代理设置

3. **语音识别不工作**
   - 确保使用HTTPS或localhost
   - 检查浏览器权限设置
   - 确认浏览器支持Web Speech API
   - 尝试使用科大讯飞API作为备用方案

4. **地图显示异常**
   - 检查百度地图API Key是否正确
   - 验证网络连接
   - 清除浏览器缓存

### 🔧 代理配置说明

**重要：不同API服务的代理配置要求**

#### Firebase服务（需要代理）
- **Firebase Authentication** - 需要代理访问
- **Firestore数据库** - 需要代理访问
- **Firebase Security Rules** - 需要代理访问

**原因**: Firebase服务位于境外，在国内网络环境下可能需要代理才能正常访问。

#### 其他API服务（不需要代理）
- **DeepSeek AI API** - 直连访问，无需代理
- **百度地图API** - 直连访问，无需代理  
- **科大讯飞API** - 直连访问，无需代理

**原因**: 这些API服务在国内有服务器，直连访问速度更快更稳定。

#### 代理配置建议
1. **开发环境**: 确保系统代理设置正确，Firebase服务能通过代理访问
2. **生产环境**: 部署到支持访问境外服务的服务器
3. **混合模式**: Firebase走代理，其他API直连（系统自动处理）

**注意**: 如果遇到Firebase连接问题，请检查代理设置或尝试使用VPN。

### 开发调试

```bash
# 启用详细日志
DEBUG=* npm run dev

# 检查构建
npm run build

# 预览生产构建
npm run preview
```

## 📊 技术特性

### 性能优化
- **懒加载**: 地图组件延迟加载，提升页面响应速度
- **代码分割**: 按需加载组件，减少初始包大小
- **缓存策略**: 合理使用浏览器缓存和Firestore缓存

### 用户体验
- **响应式设计**: 适配桌面和移动设备
- **实时更新**: Firestore实时数据同步
- **离线支持**: 基础功能支持离线使用
- **错误边界**: 完善的错误处理和用户提示

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **项目维护者**: [wuyii8941](https://github.com/wuyii8941)
- **GitHub仓库**: [https://github.com/wuyii8941/WebPlanner](https://github.com/wuyii8941/WebPlanner)
- **问题反馈**: [GitHub Issues](https://github.com/wuyii8941/WebPlanner/issues)

## 🙏 致谢

- [Firebase](https://firebase.google.com/) - 后端即服务
- [DeepSeek](https://www.deepseek.com/) - AI大语言模型
- [百度地图](https://lbsyun.baidu.com/) - 地图服务
- [科大讯飞](https://www.xfyun.cn/) - 语音识别服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Vite](https://vitejs.dev/) - 构建工具

---

**注意**: 本项目为课程作业提交，所有API密钥保证在提交后3个月内有效，供助教批改使用。
