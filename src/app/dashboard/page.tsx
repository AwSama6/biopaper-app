import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

async function getSession() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/session`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.user ? { user: data.user } : null
  } catch (error) {
    console.error('获取会话失败:', error)
    return null
  }
}

export default async function DashboardPage() {
  // 暂时允许所有用户访问dashboard，让客户端组件处理认证
  // 这样可以支持localStorage中的用户信息
  return <DashboardClient />
}