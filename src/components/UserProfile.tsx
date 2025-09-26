'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email?: string
  image?: string
  provider?: string
}

interface Tokens {
  access_token: string
  token_type: string
  expires_in: number
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<Tokens | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 读取用户信息
    const userData = localStorage.getItem('user')
    const tokenData = localStorage.getItem('tokens')
    
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('解析用户数据失败:', error)
      }
    }
    
    if (tokenData) {
      try {
        setTokens(JSON.parse(tokenData))
      } catch (error) {
        console.error('解析令牌数据失败:', error)
      }
    }
    
    setLoading(false)
  }, [])

  const handleLogout = () => {
    // 清除 localStorage 中的用户数据
    localStorage.removeItem('user')
    localStorage.removeItem('tokens')
    setUser(null)
    setTokens(null)
    // 刷新页面以更新UI
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">加载中...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user.name}</span>
            <span className="text-xs text-gray-500">{user.provider || 'DeepCognition'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              控制台
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            退出
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Link href="/login">
      <Button>登录</Button>
    </Link>
  )
}
