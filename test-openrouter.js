#!/usr/bin/env node

/**
 * OpenRouter API 密钥验证脚本
 * 根据官方文档测试API密钥是否可用
 */

const API_KEY = process.env.OPENROUTER_API_KEY || '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';

async function testOpenRouterAPI() {
  console.log('🔍 开始测试 OpenRouter API...');
  console.log(`📋 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    // 测试1: 使用免费模型
    console.log('🧪 测试1: 使用免费模型 (microsoft/phi-3-mini-128k-instruct)');
    const response1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            content: 'Hello, please respond with "API test successful"'
          }
        ],
        max_tokens: 50
      })
    });

    console.log(`📊 响应状态: ${response1.status} ${response1.statusText}`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ 免费模型测试成功!');
      console.log(`📝 响应内容: ${data1.choices[0].message.content}`);
    } else {
      const error1 = await response1.text();
      console.log('❌ 免费模型测试失败!');
      console.log(`🚨 错误信息: ${error1}`);
    }
    console.log('');

    // 测试2: 使用付费模型 (如果免费模型成功)
    if (response1.ok) {
      console.log('🧪 测试2: 使用付费模型 (anthropic/claude-3.5-sonnet)');
      const response2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'BioPaper Education Assistant',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: 'Hello, please respond with "Claude API test successful"'
            }
          ],
          max_tokens: 50
        })
      });

      console.log(`📊 响应状态: ${response2.status} ${response2.statusText}`);
      
      if (response2.ok) {
        const data2 = await response2.json();
        console.log('✅ 付费模型测试成功!');
        console.log(`📝 响应内容: ${data2.choices[0].message.content}`);
      } else {
        const error2 = await response2.text();
        console.log('❌ 付费模型测试失败!');
        console.log(`🚨 错误信息: ${error2}`);
      }
    }
    console.log('');

    // 测试3: 流式响应
    if (response1.ok) {
      console.log('🧪 测试3: 流式响应测试');
      const response3 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              content: 'Count from 1 to 3'
            }
          ],
          stream: true,
          max_tokens: 50
        })
      });

      if (response3.ok) {
        console.log('✅ 流式响应测试成功!');
        console.log('📝 流式内容:');
        
        const reader = response3.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('🏁 流式响应结束');
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  process.stdout.write(content);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        console.log('');
      } else {
        const error3 = await response3.text();
        console.log('❌ 流式响应测试失败!');
        console.log(`🚨 错误信息: ${error3}`);
      }
    }

  } catch (error) {
    console.log('💥 测试过程中发生错误:');
    console.log(`🚨 错误信息: ${error.message}`);
  }

  console.log('');
  console.log('🏁 测试完成!');
}

// 运行测试
testOpenRouterAPI().catch(console.error);
