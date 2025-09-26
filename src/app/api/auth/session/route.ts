import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface User {
  id: string
  name: string
  email?: string
  image?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user, tokens } = body

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: '用户信息不完整' },
        { status: 400 }
      )
    }

    // 创建会话数据
    const sessionData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      },
      tokens: tokens,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天过期
    }

    // 设置会话cookie
    const cookieStore = cookies()
    cookieStore.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7天
    })

    return NextResponse.json({
      success: true,
      user: sessionData.user
    })

  } catch (error) {
    console.error('会话创建失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('auth-session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    // 检查会话是否过期
    if (new Date(sessionData.expires) < new Date()) {
      cookieStore.delete('auth-session')
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: sessionData.user
    })

  } catch (error) {
    console.error('会话获取失败:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies()
    cookieStore.delete('auth-session')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('会话删除失败:', error)
    return NextResponse.json(
      { success: false, error: '会话删除失败' },
      { status: 500 }
    )
  }
}
