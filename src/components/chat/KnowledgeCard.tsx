'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import html2canvas from 'html2canvas'

interface KnowledgeCardProps {
  title: string
  content: string
}

export function KnowledgeCard({ title, content }: KnowledgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `知识卡片-${title}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Failed to save card as image:', error)
    }
  }

  return (
    <div className="my-4">
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg"
      >
        {/* 卡片头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-blue-800">{title}</h3>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              {isExpanded ? '收起' : '展开'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAsImage}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              💾 保存
            </Button>
          </div>
        </div>

        {/* 卡片内容 */}
        <div className={`text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''}`}>
          <div className="space-y-3">
            {content.split('\n').map((line, index) => {
              if (line.trim().startsWith('- ')) {
                return (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{line.slice(2)}</span>
                  </div>
                )
              } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                return (
                  <h4 key={index} className="font-semibold text-blue-700 mt-3 mb-1">
                    {line.replace(/\*\*/g, '')}
                  </h4>
                )
              } else if (line.trim()) {
                return (
                  <p key={index} className="leading-relaxed">
                    {line}
                  </p>
                )
              }
              return null
            })}
          </div>
        </div>

        {/* 卡片底部装饰 */}
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>🧬 生物学知识卡片</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}