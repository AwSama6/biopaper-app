# DeepCognition OAuth 集成指南

本文档详细说明如何配置和使用 DeepCognition OAuth 认证系统。

## 概述

本应用使用 NextAuth v5 集成 DeepCognition 的 OAuth 2.0 认证服务，允许用户使用 DeepCognition 账号登录。

## OAuth 服务器信息

- **生产环境**: `https://www.opensii.ai`
- **测试环境**: `http://localhost:8000` (如果有本地测试服务器)

## 配置步骤

### 1. 获取预授权密钥

联系 DeepCognition 管理员获取预授权密钥（preauth key）。这是注册 OAuth 客户端的必要凭据。

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入以下配置：

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# DeepCognition OAuth
DEEPCOGNITION_CLIENT_ID=your-client-id
DEEPCOGNITION_CLIENT_SECRET=your-client-secret
DEEPCOGNITION_OAUTH_BASE_URL=https://www.opensii.ai

# 预授权密钥 (用于自动注册OAuth客户端)
DEEPCOGNITION_PREAUTH_KEY=your-preauth-key
```

### 3. 注册 OAuth 客户端

有两种方式注册 OAuth 客户端：

#### 方式一：使用 Web 界面（推荐）

1. 启动应用：`npm run dev`
2. 访问：`http://localhost:3000/oauth-setup`
3. 输入预授权密钥并点击"注册 OAuth 客户端"
4. 复制返回的 `client_id` 和 `client_secret` 到环境变量
5. 重启应用

#### 方式二：使用 API 接口

```bash
curl -X POST http://localhost:3000/api/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "生物论文学习助手",
    "client_description": "专为高中生设计的AI驱动生物医学论文理解工具",
    "scopes": ["read", "write"],
    "preauth_key": "g4F5JRVre3Zgc7ZmLG4rK7J7pdtmiajc"
  }'
```

#### 方式三：直接调用 DeepCognition API

```bash
curl -X POST https://www.opensii.ai/auth/oauth/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "生物论文学习助手",
    "client_description": "专为高中生设计的AI驱动生物医学论文理解工具",
    "redirect_uris": ["http://localhost:3000/api/auth/callback/deepcognition"],
    "scopes": ["read", "write"],
    "preauth_key": "your-preauth-key"
  }'
```

### 4. 验证配置

1. 访问：`http://localhost:3000/oauth-test` 进行完整的 OAuth 流程测试
2. 或直接访问：`http://localhost:3000/login` 尝试登录

## OAuth 流程说明

### 标准 OAuth 2.0 授权码流程

1. **用户点击登录** → 重定向到 DeepCognition 授权页面
2. **用户授权** → DeepCognition 重定向回应用并携带授权码
3. **交换令牌** → 应用使用授权码交换访问令牌
4. **获取用户信息** → 使用访问令牌获取用户基本信息
5. **创建会话** → NextAuth 创建用户会话

### 关键端点

- **授权端点**: `https://www.opensii.ai/auth/oauth/authorize`
- **令牌端点**: `https://www.opensii.ai/auth/oauth/token`
- **用户信息端点**: `https://www.opensii.ai/auth/oauth/userinfo`
- **撤销端点**: `https://www.opensii.ai/auth/oauth/revoke`

## 授权范围

- `read`: 读取用户基本信息
- `write`: 修改用户信息
- `admin`: 管理员权限

默认请求 `read write` 范围。

## 安全考虑

### 必须遵循的安全实践

1. **HTTPS**: 生产环境必须使用 HTTPS
2. **客户端密钥保护**: 永远不要在前端暴露 `client_secret`
3. **State 参数**: NextAuth 自动处理 CSRF 保护
4. **令牌安全**: 访问令牌存储在安全的 HTTP-only cookies 中
5. **重定向 URI**: 必须与注册时完全一致

### 环境变量安全

- 生产环境中使用强随机的 `NEXTAUTH_SECRET`
- 不要将 `.env.local` 提交到版本控制
- 定期轮换客户端密钥

## 故障排除

### 常见错误

1. **"invalid_client"**
   - 检查 `DEEPCOGNITION_CLIENT_ID` 和 `DEEPCOGNITION_CLIENT_SECRET`
   - 确认客户端已正确注册

2. **"redirect_uri_mismatch"**
   - 确保 `NEXTAUTH_URL` 正确设置
   - 检查注册时的重定向 URI 是否匹配

3. **"invalid_grant"**
   - 授权码可能已过期或已使用
   - 重新进行授权流程

4. **"invalid_scope"**
   - 检查请求的授权范围是否被支持
   - 确认客户端注册时的范围设置

### 调试技巧

1. **查看日志**: 检查应用控制台和网络请求
2. **测试工具**: 使用 `/oauth-test` 页面进行调试
3. **环境检查**: 访问 `/oauth-setup` 查看配置状态

## 开发和测试

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入配置

# 启动开发服务器
npm run dev
```

### 测试流程

1. 访问 `http://localhost:3000/oauth-setup` 配置客户端
2. 访问 `http://localhost:3000/oauth-test` 测试完整流程
3. 访问 `http://localhost:3000/login` 测试实际登录

## 生产部署

### 环境变量配置

```env
NEXTAUTH_SECRET=production-secret-key
NEXTAUTH_URL=https://yourdomain.com
DEEPCOGNITION_CLIENT_ID=production-client-id
DEEPCOGNITION_CLIENT_SECRET=production-client-secret
DEEPCOGNITION_OAUTH_BASE_URL=https://www.opensii.ai
```

### 重定向 URI

生产环境的重定向 URI 应该是：
```
https://yourdomain.com/api/auth/callback/deepcognition
```

确保在 DeepCognition 中注册客户端时使用正确的生产环境 URI。

## API 参考

### 注册客户端

```http
POST /api/oauth/register
Content-Type: application/json

{
  "client_name": "应用名称",
  "client_description": "应用描述",
  "scopes": ["read", "write"],
  "preauth_key": "预授权密钥"
}
```

### 获取配置状态

```http
GET /api/oauth/register
```

返回当前 OAuth 配置状态。

## 支持

如有问题，请：

1. 查看本文档的故障排除部分
2. 使用 `/oauth-test` 页面进行调试
3. 检查应用日志和网络请求
4. 联系 DeepCognition 技术支持

---

**重要提醒**: 在生产环境中，确保所有敏感信息（如客户端密钥）都通过安全的方式管理，不要在代码中硬编码或提交到版本控制系统。