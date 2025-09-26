'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface PdfUploadProps {
  onTextExtracted: (text: string) => void
}

export function PdfUpload({ onTextExtracted }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadStatus('请选择PDF文件')
      return
    }

    setIsUploading(true)
    setUploadStatus('正在解析PDF...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pdf/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('PDF解析失败')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setUploadStatus(`成功解析PDF (${data.pages}页)`)
      onTextExtracted(data.text)
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('PDF upload error:', error)
      setUploadStatus('PDF解析失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3">
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>解析中...</span>
            </>
          ) : (
            <>
              <span>📄</span>
              <span>上传PDF论文</span>
            </>
          )}
        </Button>
        
        {uploadStatus && (
          <span className={`text-sm ${
            uploadStatus.includes('成功') ? 'text-green-600' : 
            uploadStatus.includes('失败') ? 'text-red-600' : 'text-blue-600'
          }`}>
            {uploadStatus}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        支持上传PDF格式的生物医学论文，系统将自动提取文本内容进行分析
      </p>
    </div>
  )
}