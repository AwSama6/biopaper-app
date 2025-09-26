import { NextRequest } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// 从请求头中获取用户信息
function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  const userEmail = request.headers.get('x-user-email')
  
  if (userId && userName) {
    return {
      id: userId,
      name: userName,
      email: userEmail
    }
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id
    
    if (!ObjectId.isValid(conversationId)) {
      return Response.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const conversation = await conversations.findOne({
      _id: new ObjectId(conversationId),
      userId: user.id
    })

    console.log('查找对话:', {
      conversationId,
      userId: user.id,
      found: !!conversation,
      messageCount: conversation?.messages?.length || 0
    })

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 返回消息列表，如果没有消息则返回空数组
    const messages = conversation.messages || []
    
    console.log('返回消息:', {
      conversationId,
      messageCount: messages.length,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        contentLength: msg.content?.length || 0,
        timestamp: msg.timestamp
      }))
    })
    
    return Response.json({
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }))
    })
  } catch (error) {
    console.error('Failed to fetch conversation messages:', error)
    return Response.json(
      { error: 'Failed to fetch conversation messages' },
      { status: 500 }
    )
  }
}

