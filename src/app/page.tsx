import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import UserProfile from '@/components/UserProfile'

export default async function HomePage() {
  // 不再自动重定向，让客户端组件处理用户状态

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🧬</span>
              <h1 className="text-xl font-bold text-gray-900">
                生物论文学习助手
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            让医学文献学习变得
            <span className="text-blue-600">简单有趣</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            专为高中生设计的AI驱动生物医学论文理解工具，
            通过智能解析和知识卡片，帮助学生从细胞生物学基础走向医学研究前沿
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-3">
                开始学习
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              了解更多
            </Button>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-3">PDF智能解析</h3>
            <p className="text-gray-600">
              上传任何生物医学PDF论文，AI自动提取关键信息，
              将复杂的学术内容转化为易懂的知识点
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">知识卡片生成</h3>
            <p className="text-gray-600">
              自动生成精美的知识卡片，包含定义、细胞关联、
              医学意义和记忆技巧，支持保存和分享
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-3">细胞关联解释</h3>
            <p className="text-gray-600">
              将高深的医学概念与熟悉的细胞生物学知识建立联系，
              用生活化类比帮助理解复杂机制
            </p>
          </div>
        </div>

        {/* 学习流程 */}
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-center mb-12">学习流程</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">上传论文</h4>
              <p className="text-sm text-gray-600">选择感兴趣的生物医学PDF论文</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI分析</h4>
              <p className="text-sm text-gray-600">智能提取关键概念和研究发现</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">知识卡片</h4>
              <p className="text-sm text-gray-600">生成个性化学习卡片</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">深度理解</h4>
              <p className="text-sm text-gray-600">通过对话加深理解</p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl">🧬</span>
            <h3 className="text-xl font-bold">生物论文学习助手</h3>
          </div>
          <p className="text-gray-400">
            让每个高中生都能轻松理解医学文献
          </p>
        </div>
      </footer>
    </div>
  )
}