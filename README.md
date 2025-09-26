# 🧬 生物论文学习助手

专为高中生设计的AI驱动生物医学论文理解工具，通过智能解析和知识卡片，帮助学生从细胞生物学基础走向医学研究前沿。

## ✨ 功能特色

- **📄 PDF智能解析**: 上传生物医学PDF论文，AI自动提取关键信息
- **🎯 知识卡片生成**: 自动生成精美的学习卡片，支持保存为图片
- **🔗 细胞关联解释**: 将医学概念与细胞生物学知识建立联系
- **💬 智能对话**: 基于Claude 4的教育导师，提供个性化指导
- **📚 历史记录**: MongoDB存储对话历史，支持多会话管理
- **🔐 安全登录**: 集成DeepCognition OAuth认证

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React 18 + App Router
- **TypeScript** - 类型安全
- **TailwindCSS** - 现代化样式
- **html2canvas** - 知识卡片图片导出

### 后端
- **Next.js API Routes** - 服务端API
- **NextAuth v5** - 身份认证
- **MongoDB** - 数据存储
- **pdf-parse** - PDF文档解析

### AI服务
- **OpenRouter** - Claude 4 API接入
- **SSE (Server-Sent Events)** - 流式响应

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 多服务编排
- **火山云** - 云服务器部署

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Docker & Docker Compose
- MongoDB (或使用Docker)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd biopaper-app
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入以下配置：

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# DeepCognition OAuth
DEEPCOGNITION_CLIENT_ID=your-deepcognition-client-id
DEEPCOGNITION_CLIENT_SECRET=your-deepcognition-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/biopaper

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key
```

4. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000

### Docker 部署

1. **配置环境变量**
确保 `.env.local` 文件已正确配置

2. **运行部署脚本**
```bash
./deploy.sh
```

或手动执行：
```bash
docker-compose up -d
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── chat/          # 聊天接口
│   │   ├── pdf/           # PDF解析
│   │   └── conversations/ # 对话管理
│   ├── dashboard/         # 主应用界面
│   ├── login/            # 登录页面
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── ui/               # 基础UI组件
│   └── chat/             # 聊天相关组件
└── lib/                  # 工具库
    ├── auth.ts           # 认证配置
    ├── mongodb.ts        # 数据库连接
    ├── openrouter.ts     # AI服务
    └── education-prompt.ts # 教育提示词
```

## 🔧 配置说明

### DeepCognition OAuth

1. 获取预授权密钥（联系 DeepCognition 管理员）
2. 访问 `http://localhost:3000/oauth-setup` 注册 OAuth 客户端
3. 或手动调用 API 注册客户端（详见 [OAUTH_SETUP.md](./OAUTH_SETUP.md)）
4. 将返回的 Client ID 和 Client Secret 添加到环境变量

**快速配置**:
- 访问 `/oauth-setup` 页面进行可视化配置
- 访问 `/oauth-test` 页面测试 OAuth 流程
- 详细配置说明请参考 [OAUTH_SETUP.md](./OAUTH_SETUP.md)

### OpenRouter API

1. 注册 OpenRouter 账号
2. 获取 API Key
3. 确保账户有足够余额使用 Claude 4

### MongoDB

支持本地MongoDB或云端MongoDB Atlas：

```env
# 本地MongoDB
MONGODB_URI=mongodb://localhost:27017/biopaper

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biopaper
```

## 🎯 使用指南

### 学生使用流程

1. **登录系统**: 使用DeepCognition账号登录
2. **上传论文**: 选择生物医学PDF论文上传
3. **AI分析**: 系统自动解析论文内容
4. **知识卡片**: 查看生成的学习卡片
5. **深度对话**: 与AI导师进行学习讨论
6. **保存学习**: 导出知识卡片，保存对话历史

### 教师使用建议

- 预先筛选适合高中生水平的论文
- 引导学生关注论文的关键概念
- 鼓励学生提出问题和思考
- 利用知识卡片进行课堂讨论

## 🔒 安全考虑

- 所有API调用都需要身份认证
- 敏感信息通过环境变量管理
- PDF文件仅在服务器端处理，不存储
- 对话历史与用户账号绑定

## 📊 监控和日志

查看应用日志：
```bash
docker-compose logs -f app
```

查看MongoDB日志：
```bash
docker-compose logs -f mongodb
```

## 🚀 部署到火山云

1. **准备服务器**
   - 创建火山云ECS实例
   - 安装Docker和Docker Compose
   - 配置安全组开放3000端口

2. **上传代码**
```bash
scp -r . user@your-server:/path/to/app
```

3. **配置环境**
```bash
ssh user@your-server
cd /path/to/app
cp .env.local.example .env.local
# 编辑环境变量
```

4. **启动服务**
```bash
./deploy.sh
```

5. **配置域名** (可选)
   - 配置Nginx反向代理
   - 申请SSL证书

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系开发团队

---

**让每个高中生都能轻松理解医学文献** 🎓