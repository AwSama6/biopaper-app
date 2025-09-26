import { NextRequest, NextResponse } from 'next/server'
import { registerOAuthClient, getRedirectUri } from '@/lib/oauth-client'

/**
 * 注册OAuth客户端的API端点
 * POST /api/oauth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      client_name = "生物论文学习助手",
      client_description = "专为高中生设计的AI驱动生物医学论文理解工具",
      scopes = ["read", "write"],
      preauth_key 
    } = body

    if (!preauth_key) {
      return NextResponse.json(
        { error: '缺少预授权密钥' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.DEEPCOGNITION_OAUTH_BASE_URL || "https://www.opensii.ai"
    
    const registration = {
      client_name,
      client_description,
      redirect_uris: [getRedirectUri()],
      scopes,
      preauth_key
    }

    const client = await registerOAuthClient(registration, baseUrl)

    return NextResponse.json({
      success: true,
      client: {
        client_id: client.client_id,
        client_secret: client.client_secret,
        client_name: client.client_name,
        redirect_uris: client.redirect_uris,
        scopes: client.scopes
      },
      message: '请将client_id和client_secret添加到环境变量中'
    })

  } catch (error) {
    console.error('OAuth客户端注册失败:', error)
    
    return NextResponse.json(
      { 
        error: '注册失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * 获取OAuth配置信息
 * GET /api/oauth/register
 */
export async function GET() {
  const baseUrl = process.env.DEEPCOGNITION_OAUTH_BASE_URL || "https://www.opensii.ai"
  const redirectUri = getRedirectUri()
  
  return NextResponse.json({
    oauth_base_url: baseUrl,
    redirect_uri: redirectUri,
    client_id: process.env.DEEPCOGNITION_CLIENT_ID,
    has_client_id: !!process.env.DEEPCOGNITION_CLIENT_ID,
    has_client_secret: !!process.env.DEEPCOGNITION_CLIENT_SECRET,
    has_preauth_key: !!process.env.DEEPCOGNITION_PREAUTH_KEY
  })
}