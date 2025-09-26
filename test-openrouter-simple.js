#!/usr/bin/env node

/**
 * 简化的 OpenRouter API 测试脚本
 * 用于快速验证API密钥
 */

const API_KEY = process.env.OPENROUTER_API_KEY || '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';

async function quickTest() {
  console.log('🔍 快速测试 OpenRouter API...');
  console.log(`📋 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'BioPaper Education Assistant',
      },
      body: JSON.stringify({
        model: 'microsoft/phi-3-mini-128k-instruct',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      })
    });

    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API密钥有效!');
      console.log(`📝 响应: ${data.choices[0].message.content}`);
      console.log('');
      console.log('🎉 可以正常使用OpenRouter API');
    } else {
      const error = await response.text();
      console.log('❌ API密钥无效!');
      console.log(`🚨 错误: ${error}`);
      console.log('');
      console.log('💡 解决方案:');
      console.log('1. 访问 https://openrouter.ai');
      console.log('2. 登录账户');
      console.log('3. 生成新的API密钥');
      console.log('4. 更新 .env.local 文件中的 OPENROUTER_API_KEY');
    }

  } catch (error) {
    console.log('💥 网络错误:');
    console.log(`🚨 ${error.message}`);
  }
}

quickTest().catch(console.error);


