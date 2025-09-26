import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { openRouterClient } from '@/lib/openrouter'
import { EDUCATION_BIO_PROMPT } from '@/lib/education-prompt'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = await request.json()
    
    // 添加教育提示词到消息开头
    const systemMessage = {
      role: 'system',
      content: EDUCATION_BIO_PROMPT
    }
    
    const fullMessages = [systemMessage, ...messages]
    
    // 获取流式响应
    const response = await openRouterClient.streamChat(fullMessages)
    
    // 创建可读流
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let fullResponse = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // 保存对话到数据库
                  if (session.user?.id) {
                    await saveConversation(session.user.id, conversationId, messages, fullResponse)
                  }
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    fullResponse += content
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch {
              // 忽略解析错误
            }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

async function saveConversation(
  userId: string,
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
  response: string
) {
  try {
    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const allMessages = [
      ...messages,
      {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
    ]
    
    await conversations.updateOne(
      { 
        _id: new ObjectId(conversationId),
        userId 
      } as Record<string, unknown>,
      {
        $set: {
          userId,
          messages: allMessages,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    )
  } catch (error) {
    console.error('Failed to save conversation:', error)
  }
}