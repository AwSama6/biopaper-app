import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const userConversations = await conversations
      .find({ userId: session.user?.id })
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
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title } = await request.json()
    
    const db = await getDatabase()
    const conversations = db.collection('conversations')
    
    const newConversation = {
      userId: session.user?.id,
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