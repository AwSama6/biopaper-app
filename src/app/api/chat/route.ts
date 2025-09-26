import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { openRouterClient } from '@/lib/openrouter'
import { EDUCATION_BIO_PROMPT } from '@/lib/education-prompt'
import { ObjectId } from 'mongodb'

// 从请求头中获取用户信息
function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  const userEmail = request.headers.get('x-user-email')
  
  if (userId && userName) {
    return {
      id: userId,
      name: userName,
      email: userEmail
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // 直接从请求头获取用户信息
    const user = getUserFromRequest(request)
    
    if (!user) {
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
                  if (user.id) {
                    await saveConversation(user.id, conversationId, messages, fullResponse)
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
    
    console.log('保存对话到数据库:', {
      userId,
      conversationId,
      messageCount: allMessages.length,
      lastMessage: allMessages[allMessages.length - 1]
    })
    
    const result = await conversations.updateOne(
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
    
    console.log('数据库保存结果:', result)
  } catch (error) {
    console.error('Failed to save conversation:', error)
  }
}