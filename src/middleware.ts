import { auth } from '@/lib/auth'

export default auth(() => {
  // Authentication middleware
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}