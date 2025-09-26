export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async streamChat(messages: Array<{ role: string; content: string }>) {
    // 临时模拟响应，用于测试其他功能
    if (this.apiKey === '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') {
      console.log('使用模拟响应，因为API密钥无效')
      return this.createMockResponse(messages)
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'BioPaper Education Assistant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, response.statusText, errorText)
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response
  }

  private createMockResponse(messages: Array<{ role: string; content: string }>) {
    const lastMessage = messages[messages.length - 1]
    const mockResponse = `你好！我是生物论文学习助手。我看到你发送了"${lastMessage.content}"。

作为你的生物学导师，我很高兴帮助你理解复杂的医学文献。让我们从基础开始：

🧬 **细胞知识回顾**
- 细胞是生命的基本单位
- 每个细胞都包含DNA（遗传信息）
- 细胞通过分裂进行繁殖

📚 **学习建议**
1. 先理解基础概念
2. 逐步建立知识联系
3. 用类比帮助记忆

你想了解哪个具体的生物学概念呢？我可以为你制作知识卡片，帮助你更好地理解！`

    // 创建模拟的流式响应
    const encoder = new TextEncoder()
    let index = 0
    const chunkSize = 10

    const stream = new ReadableStream({
      start(controller) {
        const sendChunk = () => {
          if (index < mockResponse.length) {
            const chunk = mockResponse.slice(index, index + chunkSize)
            const data = {
              choices: [{
                delta: {
                  content: chunk
                }
              }]
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            index += chunkSize
            setTimeout(sendChunk, 50) // 模拟流式延迟
          } else {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        }
        sendChunk()
      }
    })

    return {
      body: stream,
      ok: true,
      status: 200,
      statusText: 'OK'
    } as Response
  }
}

export const openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!)