#!/bin/bash

# 生物论文学习助手部署脚本
# 适用于火山云等云服务器部署

echo "🚀 开始部署生物论文学习助手..."

# 检查部署模式
DEPLOY_MODE=${1:-"docker"}
echo "📋 部署模式: $DEPLOY_MODE"

if [ "$DEPLOY_MODE" = "local" ]; then
    echo "🔧 使用本地开发模式..."
    echo "📋 准备环境变量..."
    if [ ! -f .env.local ]; then
        echo "❌ 未找到 .env.local 文件，请先配置环境变量"
        exit 1
    fi
    
    echo "🛑 停止现有进程..."
    pkill -f "next dev" 2>/dev/null || true
    
    echo "📦 安装依赖..."
    npm install
    
    echo "🚀 启动开发服务器..."
    npm run dev &
    
    echo "⏳ 等待服务器启动..."
    sleep 10
    
    echo "🔍 检查服务器状态..."
    curl -s http://localhost:3000 > /dev/null && echo "✅ 服务器启动成功" || echo "❌ 服务器启动失败"
    
    echo "✅ 本地开发模式部署完成！"
    echo "🌐 应用访问地址: http://localhost:3000"
    echo "📝 停止服务器: pkill -f 'next dev'"
    exit 0
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装 (支持 V1 和 V2)
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "✅ 检测到 Docker Compose V1"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "✅ 检测到 Docker Compose V2"
else
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    echo "💡 提示: 现代 Docker 版本通常包含 Docker Compose V2"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env.local ]; then
    echo "❌ 未找到 .env.local 文件，请先配置环境变量"
    echo "请复制 .env.local 文件并填入正确的配置信息"
    exit 1
fi

# 复制环境变量文件供Docker Compose使用
echo "📋 准备环境变量..."
cp .env.local .env
echo "✅ 环境变量文件已复制为 .env"

# 停止现有容器
echo "🛑 停止现有容器..."
$DOCKER_COMPOSE_CMD down

# 构建新镜像
echo "🔨 构建应用镜像..."
$DOCKER_COMPOSE_CMD build --no-cache

# 启动服务
echo "🚀 启动服务..."
$DOCKER_COMPOSE_CMD up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
$DOCKER_COMPOSE_CMD ps

# 显示日志
echo "📋 显示应用日志..."
$DOCKER_COMPOSE_CMD logs app

echo "✅ 部署完成！"
echo "🌐 应用访问地址: http://localhost:3000"
echo "📊 MongoDB 访问地址: mongodb://localhost:27017"
echo ""
echo "📝 常用命令:"
echo "  查看日志: $DOCKER_COMPOSE_CMD logs -f app"
echo "  重启服务: $DOCKER_COMPOSE_CMD restart"
echo "  停止服务: $DOCKER_COMPOSE_CMD down"
echo "  查看状态: $DOCKER_COMPOSE_CMD ps"