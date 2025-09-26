import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// 检查OAuth配置是否完整
function hasOAuthConfig() {
  return !!(process.env.DEEPCOGNITION_CLIENT_ID && process.env.DEEPCOGNITION_CLIENT_SECRET)
}

export default function LoginPage() {
  const oauthConfigured = hasOAuthConfig()

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

          {oauthConfigured ? (
            <form
              action={async () => {
                'use server'
                await signIn('deepcognition', { redirectTo: '/dashboard' })
              }}
            >
              <Button type="submit" className="w-full">
                使用 DeepCognition 登录
              </Button>
            </form>
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