'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface OAuthConfig {
  oauth_base_url: string
  redirect_uri: string
  client_id?: string
  has_client_id: boolean
  has_client_secret: boolean
  has_preauth_key: boolean
}

export default function LoginPage() {
  const [config, setConfig] = useState<OAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' }>({ message: '', type: 'info' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/oauth/register')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('获取配置失败:', error)
      setStatus({ message: '获取配置失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAuthCode = async (code: string, popupWindow?: Window) => {
    try {
      setStatus({ message: '正在处理授权码...', type: 'info' })
      
      // 调用后端API处理OAuth回调
      const response = await fetch('/api/auth/callback/popup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state: 'login_state_' + Date.now(),
          redirect_uri: config?.redirect_uri || `${window.location.origin}/api/auth/callback/deepcognition`
        })
      })

      console.log('API响应状态:', response.status)
      console.log('API响应头:', response.headers.get('content-type'))

      if (!response.ok) {
        const responseText = await response.text()
        console.error('API错误响应:', responseText)
        throw new Error(`API错误: ${response.status} - ${responseText}`)
      }

      const result = await response.json()
      console.log('API成功响应:', result)

      if (result.success) {
        if (popupWindow) {
          popupWindow.close()
        }
        setIsProcessing(false)
        setLoginSuccess(true)
        
        // 存储用户信息和令牌到 localStorage
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user))
        }
        if (result.session?.tokens) {
          localStorage.setItem('tokens', JSON.stringify(result.session.tokens))
        }
        
        setStatus({ message: '登录成功！正在跳转...', type: 'success' })
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        throw new Error(result.error || '登录失败')
      }
    } catch (error) {
      console.error('处理授权码失败:', error)
      if (popupWindow) {
        popupWindow.close()
      }
      setIsProcessing(false)
      setLoginSuccess(false)
      setStatus({ message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}`, type: 'error' })
    }
  }

  const handleOAuthLogin = async () => {
    if (!config?.has_client_id || !config?.has_client_secret) {
      setStatus({ message: 'OAuth 配置不完整', type: 'error' })
      return
    }

    setIsProcessing(true)
    setStatus({ message: '正在打开登录窗口...', type: 'info' })

    // 构建授权URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id || '',
      redirect_uri: config.redirect_uri || `${window.location.origin}/api/auth/callback/deepcognition`,
      scope: 'read write',
      state: 'login_state_' + Date.now()
    })

    const authUrl = `${config.oauth_base_url}/oauth/authorize?${params.toString()}`

    // 打开弹出窗口
    const popup = window.open(
      authUrl,
      'oauth_login',
      'width=600,height=700,scrollbars=yes,resizable=yes,top=100,left=100'
    )

    if (!popup) {
      setStatus({ message: '无法打开弹窗，请检查浏览器设置', type: 'error' })
      return
    }

    setStatus({ message: '请在弹出窗口中完成登录', type: 'info' })

    // 监听弹出窗口的消息
    const handleMessage = (event: MessageEvent) => {
      console.log('收到弹出窗口消息:', event.data, '来源:', event.origin)
      // 允许来自当前域名和DeepCognition域名的消息
      const allowedOrigins = [window.location.origin, 'https://www.opensii.ai']
      if (!allowedOrigins.includes(event.origin)) {
        console.log('拒绝来自未授权域名的消息:', event.origin)
        return
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        console.log('登录成功，关闭弹出窗口')
        popup.close()
        setIsProcessing(false)
        setLoginSuccess(true)
        setStatus({ message: '登录成功！正在跳转...', type: 'success' })
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else if (event.data.type === 'OAUTH_ERROR') {
        console.log('登录失败:', event.data.error)
        popup.close()
        setIsProcessing(false)
        setLoginSuccess(false)
        setStatus({ message: `登录失败: ${event.data.error}`, type: 'error' })
      } else if (event.data.type === 'oauth_authorize_result') {
        console.log('收到OAuth授权结果:', event.data)
        if (event.data.error) {
          console.log('OAuth错误:', event.data.error)
          popup.close()
          setIsProcessing(false)
          setLoginSuccess(false)
          setStatus({ message: `OAuth错误: ${event.data.error}`, type: 'error' })
        } else if (event.data.code) {
          console.log('从OAuth结果获取到授权码:', event.data.code)
          // 直接处理授权码
          handleAuthCode(event.data.code, popup)
        } else {
          console.log('OAuth结果中没有找到授权码')
          popup.close()
          setIsProcessing(false)
          setLoginSuccess(false)
          setStatus({ message: '未收到授权码', type: 'error' })
        }
      } else if (event.data.type === 'CHECK_URL_PARAMS') {
        console.log('检查URL参数:', event.data.url)
        // 解析URL中的授权码
        try {
          const url = new URL(event.data.url)
          const code = url.searchParams.get('code')
          const error = url.searchParams.get('error')
          
          if (error) {
            console.log('OAuth错误:', error)
            popup.close()
            setIsProcessing(false)
            setLoginSuccess(false)
            setStatus({ message: `OAuth错误: ${error}`, type: 'error' })
          } else if (code) {
            console.log('从URL获取到授权码:', code)
            // 直接处理授权码
            handleAuthCode(code)
          } else {
            console.log('URL中没有找到授权码')
            popup.close()
            setIsProcessing(false)
            setLoginSuccess(false)
            setStatus({ message: '未收到授权码', type: 'error' })
          }
        } catch (err) {
          console.error('解析URL失败:', err)
          popup.close()
          setIsProcessing(false)
          setLoginSuccess(false)
          setStatus({ message: 'URL解析失败', type: 'error' })
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // 监听弹窗关闭
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setIsProcessing(false)
        if (!loginSuccess) {
          setStatus({ message: '登录已取消', type: 'info' })
        }
      }
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            生物论文学习助手
          </h1>
          <p className="text-gray-600">
            专为高中生设计的医学文献理解工具
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">功能特色</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• PDF论文智能解析</li>
              <li>• 知识卡片生成</li>
              <li>• 细胞生物学关联解释</li>
              <li>• 个性化学习指导</li>
            </ul>
          </div>

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

          {config?.has_client_id && config?.has_client_secret ? (
            <Button 
              onClick={handleOAuthLogin} 
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? '处理中...' : '使用 DeepCognition 登录'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-1">OAuth 配置未完成</h4>
                <p className="text-sm text-yellow-700">
                  需要先配置 DeepCognition OAuth 客户端才能使用登录功能
                </p>
              </div>
              <Link href="/oauth-setup">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  配置 OAuth 客户端
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>登录即表示您同意我们的服务条款</p>
        </div>
      </div>
    </div>
  )
}