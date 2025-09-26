'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface OAuthConfig {
  oauth_base_url: string
  redirect_uri: string
  has_client_id: boolean
  has_client_secret: boolean
  has_preauth_key: boolean
}

interface ClientData {
  client_id: string
  client_secret: string
  client_name: string
}

interface TokenData {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

export default function OAuthTestPage() {
  const [config, setConfig] = useState<OAuthConfig | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null)
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' }>({ message: '', type: 'info' })
  const [authUrl, setAuthUrl] = useState<string>('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/oauth/register')
      const data = await response.json()
      setConfig(data)
      
      // 如果已有客户端配置，自动加载
      if (data.has_client_id && data.has_client_secret) {
        setStatus({ message: '检测到已配置的OAuth客户端', type: 'success' })
      }
    } catch {
      setStatus({ message: '获取配置失败', type: 'error' })
    }
  }

  const loadExistingClient = () => {
    const clientId = prompt('请输入 Client ID:')
    const clientSecret = prompt('请输入 Client Secret:')
    
    if (clientId && clientSecret) {
      setClientData({
        client_id: clientId,
        client_secret: clientSecret,
        client_name: '测试客户端'
      })
      setStatus({ message: '已加载客户端凭据', type: 'success' })
    }
  }

  const generateAuthUrl = () => {
    if (!clientData || !config) {
      setStatus({ message: '请先配置客户端信息', type: 'error' })
      return
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientData.client_id,
      redirect_uri: config.redirect_uri,
      scope: 'read write',
      state: 'test_state_' + Date.now()
    })

    const url = `${config.oauth_base_url}/oauth/authorize?${params.toString()}`
    setAuthUrl(url)
    setStatus({ message: '授权URL已生成', type: 'success' })
  }

  const openAuthWindow = () => {
    if (!authUrl) {
      setStatus({ message: '请先生成授权URL', type: 'error' })
      return
    }

    const popup = window.open(
      authUrl,
      'oauth_authorize',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      setStatus({ message: '无法打开弹窗，请检查浏览器设置', type: 'error' })
      return
    }

    setStatus({ message: '授权窗口已打开，请完成授权', type: 'info' })

    // 监听弹窗关闭
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        setStatus({ message: '授权窗口已关闭', type: 'info' })
      }
    }, 1000)
  }

  const simulateCallback = async () => {
    const authCode = prompt('请输入授权码 (或使用模拟码):') || 'mock_auth_code_' + Date.now()
    await exchangeCodeForToken(authCode)
  }

  const exchangeCodeForToken = async (authCode: string) => {
    if (!clientData || !config) {
      setStatus({ message: '缺少客户端配置', type: 'error' })
      return
    }

    setStatus({ message: '正在交换访问令牌...', type: 'info' })

    try {
      const response = await fetch(`${config.oauth_base_url}/auth/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: clientData.client_id,
          client_secret: clientData.client_secret,
          redirect_uri: config.redirect_uri
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `令牌交换失败: ${response.status}`)
      }

      const tokens = await response.json()
      setTokenData(tokens)
      setStatus({ message: '访问令牌获取成功!', type: 'success' })
    } catch (error) {
      setStatus({ 
        message: `令牌交换失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      })
    }
  }

  const verifyToken = async () => {
    if (!tokenData || !config) {
      setStatus({ message: '请先获取访问令牌', type: 'error' })
      return
    }

    setStatus({ message: '正在验证访问令牌...', type: 'info' })

    try {
      const response = await fetch(`${config.oauth_base_url}/auth/oauth/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `验证失败: ${response.status}`)
      }

      const user = await response.json()
      setUserInfo(user)
      setStatus({ message: `Token有效，用户: ${user.username || user.name || user._id}`, type: 'success' })
    } catch (error) {
      setStatus({ 
        message: `验证失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      })
    }
  }

  const revokeToken = async () => {
    if (!tokenData || !clientData || !config) {
      setStatus({ message: '缺少必要信息', type: 'error' })
      return
    }

    setStatus({ message: '正在撤销访问令牌...', type: 'info' })

    try {
      const response = await fetch(`${config.oauth_base_url}/auth/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          token: tokenData.access_token,
          client_id: clientData.client_id,
          client_secret: clientData.client_secret
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `撤销失败: ${response.status}`)
      }

      setTokenData(null)
      setUserInfo(null)
      setStatus({ message: '访问令牌已成功撤销!', type: 'success' })
    } catch (error) {
      setStatus({ 
        message: `撤销失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      })
    }
  }

  const clearAll = () => {
    setClientData(null)
    setTokenData(null)
    setUserInfo(null)
    setAuthUrl('')
    setStatus({ message: '已清除所有状态', type: 'info' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">OAuth 测试客户端</h1>
            <p className="text-purple-100">模拟外部服务使用 DeepCognition OAuth 集成</p>
          </div>

          <div className="p-6 space-y-6">
            {/* 状态显示 */}
            {status.message && (
              <div className={`p-4 rounded-lg ${
                status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <strong>[{status.type.toUpperCase()}]</strong> {status.message}
              </div>
            )}

            {/* 配置信息 */}
            {config && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">OAuth 配置</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>OAuth 服务器:</strong>
                    <div className="font-mono bg-gray-200 p-2 rounded mt-1">{config.oauth_base_url}</div>
                  </div>
                  <div>
                    <strong>回调地址:</strong>
                    <div className="font-mono bg-gray-200 p-2 rounded mt-1">{config.redirect_uri}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 客户端配置 */}
            <div className="border border-gray-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">1. 客户端配置</h2>
              <div className="space-y-3">
                <Button onClick={loadExistingClient} variant="outline">
                  加载已有客户端凭据
                </Button>
                {clientData && (
                  <div className="bg-green-50 p-3 rounded border">
                    <h4 className="font-medium mb-2">客户端信息:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Client ID:</strong> {clientData.client_id}</div>
                      <div><strong>Client Secret:</strong> {clientData.client_secret.substring(0, 20)}...</div>
                      <div><strong>名称:</strong> {clientData.client_name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* OAuth 流程 */}
            {clientData && (
              <div className="border border-gray-200 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">2. OAuth 授权流程</h2>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={generateAuthUrl}>生成授权URL</Button>
                    <Button onClick={openAuthWindow} disabled={!authUrl}>打开授权窗口</Button>
                    <Button onClick={simulateCallback} variant="outline">模拟回调</Button>
                  </div>
                  
                  {authUrl && (
                    <div className="bg-gray-100 p-3 rounded">
                      <h4 className="font-medium mb-2">授权URL:</h4>
                      <div className="font-mono text-sm break-all">{authUrl}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 令牌信息 */}
            {tokenData && (
              <div className="border border-gray-200 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">3. 访问令牌</h2>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded border">
                    <h4 className="font-medium mb-2">令牌信息:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>访问令牌:</strong> {tokenData.access_token.substring(0, 30)}...</div>
                      <div><strong>令牌类型:</strong> {tokenData.token_type}</div>
                      <div><strong>过期时间:</strong> {tokenData.expires_in} 秒</div>
                      {tokenData.refresh_token && (
                        <div><strong>刷新令牌:</strong> {tokenData.refresh_token.substring(0, 30)}...</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={verifyToken}>验证令牌</Button>
                    <Button onClick={revokeToken} variant="destructive">撤销令牌</Button>
                  </div>
                </div>
              </div>
            )}

            {/* 用户信息 */}
            {userInfo && (
              <div className="border border-gray-200 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">4. 用户信息</h2>
                <div className="bg-green-50 p-3 rounded border">
                  <h4 className="font-medium mb-2">用户详细信息:</h4>
                  <div className="text-sm space-y-1">
                    {Object.entries(userInfo).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between">
              <Button onClick={clearAll} variant="outline">
                清除所有状态
              </Button>
              <Button onClick={() => window.location.href = '/oauth-setup'} variant="outline">
                前往OAuth设置
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}