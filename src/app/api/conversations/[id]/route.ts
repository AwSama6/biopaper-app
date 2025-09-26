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

export async function DELETE(
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
    
    // 删除对话，确保只能删除自己的对话
    const result = await conversations.deleteOne({
      _id: new ObjectId(conversationId),
      userId: user.id
    })

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return Response.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
