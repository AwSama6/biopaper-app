'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { KnowledgeCard } from './KnowledgeCard'
import { PdfUpload } from './PdfUpload'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface User {
  id?: string
  name?: string | null
  email?: string | null
}

interface ChatInterfaceProps {
  conversationId: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [, setPdfText] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 从localStorage获取用户信息
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        // 用户信息设置后，如果有conversationId就加载消息
        if (conversationId) {
          loadMessages(parsedUser)
        }
      } catch (error) {
        console.error('解析用户数据失败:', error)
      }
    }
  }, [conversationId])

  // 当conversationId变化时，加载对应的消息
  useEffect(() => {
    if (conversationId && user) {
      loadMessages()
    }
  }, [conversationId, user])

  const loadMessages = async (userToLoad?: User) => {
    const targetUser = userToLoad || user
    if (!conversationId || !targetUser) return
    
    setIsLoadingMessages(true)
    try {
      const headers: HeadersInit = {
        'x-user-id': targetUser.id || '',
        'x-user-name': targetUser.name || '',
        'x-user-email': targetUser.email || ''
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, { headers })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error('Failed to load messages:', response.status, response.statusText)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (user) {
        headers['x-user-id'] = user.id || ''
        headers['x-user-name'] = user.name || ''
        headers['x-user-email'] = user.email || ''
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let assistantMessage = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                assistantMessage += data.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date(),
                    })
                  }
                  return newMessages
                })
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePdfUpload = (text: string) => {
    setPdfText(text)
    const pdfMessage = `我上传了一篇PDF论文，内容如下：\n\n${text.slice(0, 2000)}${text.length > 2000 ? '...' : ''}\n\n请帮我分析这篇论文，并制作相关的知识卡片。`
    setInput(pdfMessage)
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Upload */}
      <div className="p-4 border-b">
        <PdfUpload onTextExtracted={handlePdfUpload} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-500">加载消息中...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <h3 className="text-lg font-semibold mb-2">欢迎来到生物论文学习助手！</h3>
            <p>我是您的生物学导师，专门帮助高中生理解医学文献。</p>
            <p>您可以上传PDF论文，或直接提问关于细胞生物学的问题。</p>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  <MessageContent content={message.content} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入您的问题..."
            className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            发送
          </Button>
        </div>
      </form>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // 检测知识卡片格式并渲染
  const cardRegex = /\*\*知识卡片[：:]\s*(.+?)\*\*\n([\s\S]*?)(?=\n\*\*|$)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = cardRegex.exec(content)) !== null) {
    // 添加卡片前的文本
    if (match.index > lastIndex) {
      parts.push(
        <div key={lastIndex} className="mb-4">
          {content.slice(lastIndex, match.index)}
        </div>
      )
    }

    // 添加知识卡片
    const title = match[1]
    const cardContent = match[2].trim()
    parts.push(
      <KnowledgeCard key={match.index} title={title} content={cardContent} />
    )

    lastIndex = match.index + match[0].length
  }

  // 添加剩余文本
  if (lastIndex < content.length) {
    parts.push(
      <div key={lastIndex}>
        {content.slice(lastIndex)}
      </div>
    )
  }

  return parts.length > 0 ? <>{parts}</> : <div>{content}</div>
}