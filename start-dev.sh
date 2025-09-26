#!/bin/bash

echo "🧬 启动生物论文学习助手开发服务器..."

# 检查环境变量文件
if [ ! -f .env.local ]; then
    echo "⚠️  未找到 .env.local 文件"
    echo "请复制并配置环境变量："
    echo "cp .env.local.example .env.local"
    echo "然后编辑 .env.local 文件填入正确的配置"
    exit 1
fi

# 检查依赖
if [ ! -d node_modules ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev