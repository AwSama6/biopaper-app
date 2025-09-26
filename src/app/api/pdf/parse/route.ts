import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 解析 PDF
    const data = await pdf(buffer)
    
    return Response.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
    })
  } catch (error) {
    console.error('PDF parsing error:', error)
    return Response.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    )
  }
}