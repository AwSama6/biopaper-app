/**
 * OAuth客户端管理工具
 * 用于注册和管理DeepCognition OAuth客户端
 */

interface OAuthClientRegistration {
  client_name: string
  client_description: string
  redirect_uris: string[]
  scopes: string[]
  preauth_key: string
}

interface OAuthClientResponse {
  client_id: string
  client_secret: string
  client_name: string
  client_description: string
  redirect_uris: string[]
  scopes: string[]
  created_at: string
}

/**
 * 注册OAuth客户端
 */
export async function registerOAuthClient(
  registration: OAuthClientRegistration,
  baseUrl: string = "https://www.opensii.ai"
): Promise<OAuthClientResponse> {
  const response = await fetch(`${baseUrl}/auth/oauth/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(registration)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `OAuth客户端注册失败: ${response.status}`)
  }

  return await response.json()
}

/**
 * 验证OAuth客户端凭据
 */
export async function verifyOAuthClient(
  clientId: string,
  clientSecret: string,
  baseUrl: string = "https://www.opensii.ai"
): Promise<boolean> {
  try {
    // 尝试获取一个临时的访问令牌来验证客户端凭据
    const response = await fetch(`${baseUrl}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      })
    })

    return response.ok
  } catch (error) {
    console.error('验证OAuth客户端失败:', error)
    return false
  }
}

/**
 * 获取当前应用的重定向URI
 */
export function getRedirectUri(): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/api/auth/callback/deepcognition`
}

/**
 * 自动注册OAuth客户端（如果需要）
 */
export async function ensureOAuthClient(): Promise<{
  clientId: string
  clientSecret: string
} | null> {
  const clientId = process.env.DEEPCOGNITION_CLIENT_ID
  const clientSecret = process.env.DEEPCOGNITION_CLIENT_SECRET
  const preauthKey = process.env.DEEPCOGNITION_PREAUTH_KEY
  const baseUrl = process.env.DEEPCOGNITION_OAUTH_BASE_URL || "https://www.opensii.ai"

  // 如果已有客户端凭据，先验证是否有效
  if (clientId && clientSecret) {
    const isValid = await verifyOAuthClient(clientId, clientSecret, baseUrl)
    if (isValid) {
      return { clientId, clientSecret }
    }
    console.warn('现有OAuth客户端凭据无效，需要重新注册')
  }

  // 如果没有预授权密钥，无法自动注册
  if (!preauthKey) {
    console.error('缺少预授权密钥，无法自动注册OAuth客户端')
    return null
  }

  try {
    console.log('正在自动注册OAuth客户端...')
    const registration: OAuthClientRegistration = {
      client_name: "生物论文学习助手",
      client_description: "专为高中生设计的AI驱动生物医学论文理解工具",
      redirect_uris: [getRedirectUri()],
      scopes: ["read", "write"],
      preauth_key: preauthKey
    }

    const client = await registerOAuthClient(registration, baseUrl)
    
    console.log('OAuth客户端注册成功:', {
      client_id: client.client_id,
      client_name: client.client_name
    })

    // 提示用户更新环境变量
    console.log('请将以下信息添加到您的环境变量中:')
    console.log(`DEEPCOGNITION_CLIENT_ID=${client.client_id}`)
    console.log(`DEEPCOGNITION_CLIENT_SECRET=${client.client_secret}`)

    return {
      clientId: client.client_id,
      clientSecret: client.client_secret
    }
  } catch (error) {
    console.error('自动注册OAuth客户端失败:', error)
    return null
  }
}