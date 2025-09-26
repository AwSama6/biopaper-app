import { NextRequest, NextResponse } from 'next/server'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

interface UserInfo {
  sub?: string
  _id?: string
  id?: string
  user_id?: string
  name?: string
  username?: string
  display_name?: string
  email?: string
  picture?: string
  avatar?: string
  avatar_url?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, state, redirect_uri } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: '缺少授权码' },
        { status: 400 }
      )
    }

    const clientId = process.env.DEEPCOGNITION_CLIENT_ID
    const clientSecret = process.env.DEEPCOGNITION_CLIENT_SECRET
    const oauthBaseUrl = process.env.DEEPCOGNITION_OAUTH_BASE_URL || "https://www.opensii.ai"

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'OAuth 配置不完整' },
        { status: 500 }
      )
    }

    // 1. 交换授权码获取访问令牌
    const tokenResponse = await fetch(`${oauthBaseUrl}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri
      })
    })

    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text()
      console.error('令牌交换失败:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        response: responseText
      })
      return NextResponse.json(
        { success: false, error: `令牌交换失败: ${tokenResponse.status}` },
        { status: 400 }
      )
    }

    const tokens: TokenResponse = await tokenResponse.json()
    console.log('令牌获取成功:', { token_type: tokens.token_type, expires_in: tokens.expires_in })

    // 2. 使用访问令牌获取用户信息
    const userResponse = await fetch(`${oauthBaseUrl}/auth/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json',
      }
    })

    if (!userResponse.ok) {
      const responseText = await userResponse.text()
      console.error('用户信息获取失败:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        response: responseText
      })
      return NextResponse.json(
        { success: false, error: `用户信息获取失败: ${userResponse.status}` },
        { status: 400 }
      )
    }

    const userInfo: UserInfo = await userResponse.json()
    console.log('用户信息获取成功:', { 
      id: userInfo.sub || userInfo._id || userInfo.id || userInfo.user_id,
      name: userInfo.name || userInfo.username || userInfo.display_name 
    })

    // 3. 创建用户会话
    const user = {
      id: userInfo.sub || userInfo._id || userInfo.id || userInfo.user_id,
      name: userInfo.name || userInfo.username || userInfo.display_name,
      email: userInfo.email,
      image: userInfo.picture || userInfo.avatar || userInfo.avatar_url,
    }

    // 创建会话
    const appBaseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const sessionResponse = await fetch(`${appBaseUrl}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: user,
        tokens: {
          access_token: tokens.access_token,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in
        }
      })
    })

    if (!sessionResponse.ok) {
      console.error('会话创建失败')
      return NextResponse.json(
        { success: false, error: '会话创建失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: user
    })

  } catch (error) {
    console.error('OAuth 回调处理失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}
