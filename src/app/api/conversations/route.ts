import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

// 从请求头中获取用户信息
function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  const userEmail = request.headers.get('x-user-email')
  
  console.log('请求头信息:', {
    userId,
    userName,
    userEmail,
    allHeaders: Object.fromEntries(request.headers.entries())
  })
  
  if (userId && userName) {
    return {
      id: userId,
      name: userName,
      email: userEmail
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    // 直接从请求头获取用户信息
    const user = getUserFromRequest(request)
    
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized', 
        debug: {
          userId: request.headers.get('x-user-id'),
          userName: request.headers.get('x-user-name'),
          userEmail: request.headers.get('x-user-email')
        }
      }, { status: 401 })
    }

    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const userConversations = await conversations
      .find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()

    return Response.json(userConversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return Response.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 直接从请求头获取用户信息
    const user = getUserFromRequest(request)
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title } = await request.json()
    
    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const newConversation = {
      userId: user.id,
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await conversations.insertOne(newConversation)
    
    return Response.json({
      _id: result.insertedId,
      ...newConversation,
    })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return Response.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}