'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DeepCognitionCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理登录...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        console.log('回调页面收到的参数:', { code, error, state })
        console.log('当前URL:', window.location.href)

        if (error) {
          throw new Error(`OAuth 错误: ${error}`)
        }

        if (!code) {
          // 如果没有授权码，可能是直接重定向，尝试从父窗口获取
          console.log('未收到授权码，尝试从父窗口获取')
          if (window.opener) {
            // 通知父窗口检查URL参数
            window.opener.postMessage({
              type: 'CHECK_URL_PARAMS',
              url: window.location.href
            }, window.location.origin)
          }
          return
        }

        setMessage('正在验证授权码...')

        // 调用后端API处理OAuth回调
        const response = await fetch('/api/auth/callback/popup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirect_uri: `${window.location.origin}/api/auth/callback/deepcognition`
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '登录验证失败')
        }

        const result = await response.json()

        if (result.success) {
          setStatus('success')
          setMessage('登录成功！')
          
          // 通知父窗口登录成功
          if (window.opener) {
            console.log('发送登录成功消息给父窗口:', result.user)
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              user: result.user
            }, window.location.origin)
          } else {
            console.log('没有父窗口，无法发送消息')
          }
          
          // 延迟关闭窗口
          setTimeout(() => {
            window.close()
          }, 1500)
        } else {
          throw new Error(result.error || '登录失败')
        }
      } catch (error) {
        console.error('OAuth 回调处理失败:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : '登录失败')
        
        // 通知父窗口登录失败
        if (window.opener) {
          console.log('发送登录失败消息给父窗口:', error)
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : '登录失败'
          }, window.location.origin)
        } else {
          console.log('没有父窗口，无法发送错误消息')
        }
        
        // 延迟关闭窗口
        setTimeout(() => {
          window.close()
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}
          {status === 'success' && (
            <div className="text-green-600 text-6xl mb-4">✓</div>
          )}
          {status === 'error' && (
            <div className="text-red-600 text-6xl mb-4">✗</div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && '处理中...'}
          {status === 'success' && '登录成功'}
          {status === 'error' && '登录失败'}
        </h2>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status === 'success' && (
          <p className="text-sm text-gray-500">窗口将自动关闭</p>
        )}
        
        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">窗口将自动关闭</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              手动关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
