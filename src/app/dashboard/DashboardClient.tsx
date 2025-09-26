'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { signOut } from 'next-auth/react'

interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Conversation {
  _id: string
  title: string
  updatedAt: string
}

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        if (data.length > 0 && !currentConversationId) {
          setCurrentConversationId(data[0]._id)
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `新对话 ${new Date().toLocaleString()}`,
        }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversationId(newConversation._id)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || ''}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700"
            >
              退出
            </Button>
          </div>
        </div>

        {/* 新建对话按钮 */}
        <div className="p-4">
          <Button
            onClick={createNewConversation}
            className="w-full"
          >
            + 新建对话
          </Button>
        </div>

        {/* 对话历史 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setCurrentConversationId(conversation._id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentConversationId === conversation._id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-medium truncate">{conversation.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 应用信息 */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-1">
              🧬 生物论文学习助手
            </h3>
            <p className="text-xs text-gray-500">
              专为高中生设计的医学文献理解工具
            </p>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {currentConversationId ? (
          <ChatInterface conversationId={currentConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                欢迎使用生物论文学习助手！
              </h2>
              <p className="text-gray-600 mb-6">
                选择一个对话或创建新对话开始学习
              </p>
              <Button onClick={createNewConversation}>
                开始新对话
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}