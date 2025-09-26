'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { useRouter } from 'next/navigation'

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

export function DashboardClient() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // 从localStorage获取用户信息
    const userData = localStorage.getItem('user')
    console.log('DashboardClient: localStorage用户数据:', userData)
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log('DashboardClient: 解析后的用户数据:', parsedUser)
        setUser(parsedUser)
        // 用户信息设置后立即加载对话
        loadConversations(parsedUser)
      } catch (error) {
        console.error('解析用户数据失败:', error)
        // 如果解析失败，重定向到登录页
        router.push('/login')
        return
      }
    } else {
      console.log('DashboardClient: 没有找到用户数据，重定向到登录页')
      // 如果没有用户信息，重定向到登录页
      router.push('/login')
      return
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = async (userToLoad?: User) => {
    try {
      const targetUser = userToLoad || user
      console.log('loadConversations: 目标用户:', targetUser)
      
      const headers: HeadersInit = {}
      if (targetUser) {
        headers['x-user-id'] = targetUser.id || ''
        headers['x-user-name'] = targetUser.name || ''
        headers['x-user-email'] = targetUser.email || ''
      }
      
      console.log('loadConversations: 请求头:', headers)
      
      const response = await fetch('/api/conversations', { headers })
      console.log('loadConversations: 响应状态:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('loadConversations: 对话数据:', data)
        setConversations(data)
        if (data.length > 0 && !currentConversationId) {
          setCurrentConversationId(data[0]._id)
        }
      } else {
        console.error('Failed to load conversations:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (user) {
        headers['x-user-id'] = user.id || ''
        headers['x-user-name'] = user.name || ''
        headers['x-user-email'] = user.email || ''
      }
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `新对话 ${new Date().toLocaleString()}`,
        }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversationId(newConversation._id)
      } else {
        console.error('Failed to create conversation:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const headers: HeadersInit = {}
      
      if (user) {
        headers['x-user-id'] = user.id || ''
        headers['x-user-name'] = user.name || ''
        headers['x-user-email'] = user.email || ''
      }
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        // 从列表中移除已删除的对话
        setConversations(prev => prev.filter(conv => conv._id !== conversationId))
        
        // 如果删除的是当前对话，切换到第一个对话或清空
        if (currentConversationId === conversationId) {
          const remainingConversations = conversations.filter(conv => conv._id !== conversationId)
          if (remainingConversations.length > 0) {
            setCurrentConversationId(remainingConversations[0]._id)
          } else {
            setCurrentConversationId(null)
          }
        }
        
        setShowDeleteConfirm(null)
      } else {
        console.error('Failed to delete conversation:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  if (isLoading || !user) {
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
              onClick={() => {
                // 清除localStorage中的用户数据
                localStorage.removeItem('user')
                localStorage.removeItem('tokens')
                // 重定向到首页
                router.push('/')
              }}
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
              <div
                key={conversation._id}
                className={`relative group rounded-lg transition-colors ${
                  currentConversationId === conversation._id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onMouseEnter={() => setHoveredConversationId(conversation._id)}
                onMouseLeave={() => setHoveredConversationId(null)}
              >
                <button
                  onClick={() => setCurrentConversationId(conversation._id)}
                  className="w-full text-left p-3 pr-10"
                >
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </button>
                
                {/* 三点菜单 */}
                {hoveredConversationId === conversation._id && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(conversation._id)
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* 删除确认弹窗 */}
                {showDeleteConfirm === conversation._id && (
                  <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
                    <div className="text-sm text-gray-700 mb-2">确定要删除这个对话吗？</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conversation._id)
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(null)
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
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