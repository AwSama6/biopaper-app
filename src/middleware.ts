import { auth } from '@/lib/auth'

export default auth((req) => {
  // 暂时禁用中间件认证，让客户端组件处理认证
  // 这样可以支持localStorage中的用户信息
  return
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}