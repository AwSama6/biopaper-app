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

interface RegistrationResult {
  success: boolean
  client?: {
    client_id: string
    client_secret: string
    client_name: string
    redirect_uris: string[]
    scopes: string[]
  }
  error?: string
  details?: string
  message?: string
}

export default function OAuthSetupPage() {
  const [config, setConfig] = useState<OAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [result, setResult] = useState<RegistrationResult | null>(null)
  const [formData, setFormData] = useState({
    client_name: '生物论文学习助手',
    client_description: '专为高中生设计的AI驱动生物医学论文理解工具',
    preauth_key: '',
    scopes: ['read', 'write']
  })

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
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!formData.preauth_key.trim()) {
      alert('请输入预授权密钥')
      return
    }

    setRegistering(true)
    setResult(null)

    try {
      const response = await fetch('/api/oauth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setRegistering(false)
    }
  }

  const handleScopeChange = (scope: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      scopes: checked 
        ? [...prev.scopes, scope]
        : prev.scopes.filter(s => s !== scope)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载配置中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">OAuth 客户端设置</h1>
            <p className="text-blue-100">配置 DeepCognition OAuth 集成</p>
          </div>

          <div className="p-6 space-y-6">
            {/* 当前配置状态 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">当前配置状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>OAuth 服务器:</span>
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {config?.oauth_base_url}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>回调地址:</span>
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {config?.redirect_uri}
                    </code>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Client ID:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      config?.has_client_id 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config?.has_client_id ? '已配置' : '未配置'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client Secret:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      config?.has_client_secret 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config?.has_client_secret ? '已配置' : '未配置'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>预授权密钥:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      config?.has_preauth_key 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {config?.has_preauth_key ? '已配置' : '可选配置'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 注册表单 */}
            {(!config?.has_client_id || !config?.has_client_secret) && (
              <div className="border border-gray-200 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">注册新的 OAuth 客户端</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      应用名称
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      应用描述
                    </label>
                    <textarea
                      value={formData.client_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      预授权密钥 *
                    </label>
                    <input
                      type="text"
                      value={formData.preauth_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, preauth_key: e.target.value }))}
                      placeholder="请输入从管理员处获取的预授权密钥"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      请联系 DeepCognition 管理员获取预授权密钥
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      授权范围
                    </label>
                    <div className="space-y-2">
                      {['read', 'write', 'admin'].map(scope => (
                        <label key={scope} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.scopes.includes(scope)}
                            onChange={(e) => handleScopeChange(scope, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {scope} - {
                              scope === 'read' ? '读取用户基本信息' :
                              scope === 'write' ? '修改用户信息' :
                              '管理员权限'
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={registering || !formData.preauth_key.trim()}
                    className="w-full"
                  >
                    {registering ? '注册中...' : '注册 OAuth 客户端'}
                  </Button>
                </div>
              </div>
            )}

            {/* 注册结果 */}
            {result && (
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '注册成功!' : '注册失败'}
                </h3>
                
                {result.success && result.client && (
                  <div className="space-y-3">
                    <p className="text-green-700">{result.message}</p>
                    <div className="bg-white p-3 rounded border">
                      <h4 className="font-medium mb-2">请将以下信息添加到环境变量:</h4>
                      <div className="font-mono text-sm space-y-1">
                        <div>DEEPCOGNITION_CLIENT_ID={result.client.client_id}</div>
                        <div>DEEPCOGNITION_CLIENT_SECRET={result.client.client_secret}</div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h4 className="font-medium mb-2">客户端信息:</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>名称:</strong> {result.client.client_name}</div>
                        <div><strong>授权范围:</strong> {result.client.scopes.join(', ')}</div>
                        <div><strong>回调地址:</strong> {result.client.redirect_uris.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {!result.success && (
                  <div className="text-red-700">
                    <p><strong>错误:</strong> {result.error}</p>
                    {result.details && <p><strong>详情:</strong> {result.details}</p>}
                  </div>
                )}
              </div>
            )}

            {/* 已配置提示 */}
            {config?.has_client_id && config?.has_client_secret && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">OAuth 配置完成</h3>
                <p className="text-green-700">
                  您的应用已经配置了有效的 OAuth 客户端凭据，可以正常使用 DeepCognition 登录功能。
                </p>
                <div className="mt-3">
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    前往登录页面
                  </Button>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">使用说明</h3>
              <div className="text-blue-700 text-sm space-y-2">
                <p>1. 如果您还没有 OAuth 客户端凭据，请使用预授权密钥注册新客户端</p>
                <p>2. 注册成功后，将返回的 Client ID 和 Client Secret 添加到环境变量中</p>
                <p>3. 重启应用以使新的环境变量生效</p>
                <p>4. 配置完成后即可使用 DeepCognition 账号登录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}