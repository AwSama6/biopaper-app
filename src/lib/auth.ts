import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

// 获取OAuth服务器基础URL
const getOAuthBaseUrl = () => {
  return process.env.DEEPCOGNITION_OAUTH_BASE_URL || "https://www.opensii.ai"
}

// 检查OAuth配置是否完整
const hasOAuthConfig = () => {
  return !!(process.env.DEEPCOGNITION_CLIENT_ID && process.env.DEEPCOGNITION_CLIENT_SECRET)
}

export const authConfig = {
  providers: hasOAuthConfig() ? [
    {
      id: "deepcognition",
      name: "DeepCognition",
      type: "oauth",
      clientId: process.env.DEEPCOGNITION_CLIENT_ID,
      clientSecret: process.env.DEEPCOGNITION_CLIENT_SECRET,
      authorization: {
        url: `${getOAuthBaseUrl()}/oauth/authorize`,
        params: {
          scope: "read write",
          response_type: "code",
        },
      },
      checks: [],
      token: `${getOAuthBaseUrl()}/auth/oauth/token`,
      userinfo: `${getOAuthBaseUrl()}/oauth/userinfo`,
      profile(profile) {
        return {
          id: profile.sub || profile._id || profile.id || profile.user_id,
          name: profile.name || profile.username || profile.display_name,
          email: profile.email,
          image: profile.picture || profile.avatar || profile.avatar_url,
        }
      },
    },
  ] : [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)