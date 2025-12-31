'use client'

import { useState, useCallback } from 'react'
import { UploadedImage } from '@/types'

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void
  images: UploadedImage[]
}

export default function ImageUploader({ onImagesChange, images }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    // 첫 번째 파일만 처리
    const file = files[0]

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: e.target?.result as string,
        }
        // 기존 이미지를 대체
        onImagesChange([newImage])
      }
      reader.readAsDataURL(file)
    }
  }, [onImagesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
  }, [processFiles])

  const removeImage = useCallback((id: string) => {
    onImagesChange(images.filter((img) => img.id !== id))
  }, [images, onImagesChange])

  // 예시 이미지 로드 함수
  const loadExampleImage = useCallback(async () => {
    try {
      const response = await fetch('/example-answer.jpg')
      const blob = await response.blob()
      const file = new File([blob], 'example-answer.jpg', { type: 'image/jpeg' })

      const reader = new FileReader()
      reader.onload = (e) => {
        const exampleImage: UploadedImage = {
          id: `example-${Date.now()}`,
          file,
          preview: e.target?.result as string,
        }
        // 기존 이미지를 대체
        onImagesChange([exampleImage])
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('예시 이미지 로드 실패:', error)
    }
  }, [onImagesChange])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4 flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-200">
              답안지 사진을 올려주세요
            </p>
            <p className="text-sm text-gray-400 mt-1">
              드래그 앤 드롭 또는 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-500 mt-2">
              답안지 1장을 업로드해주세요
            </p>
          </div>
        </div>
      </div>

      {/* 예시 이미지 로드 버튼 */}
      <button
        type="button"
        onClick={loadExampleImage}
        className="w-full py-3 px-4 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>예시 답안 이미지 불러오기</span>
        <span className="text-xs text-gray-500">(건축시공기술사)</span>
      </button>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            업로드된 답안지
          </h3>
          <div className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-800 shadow-sm max-w-md mx-auto">
            <img
              src={images[0].preview}
              alt="답안지"
              className="w-full h-auto object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
            <button
              onClick={() => removeImage(images[0].id)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                flex items-center justify-center text-lg font-bold hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
