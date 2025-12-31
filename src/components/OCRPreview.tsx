'use client'

import { UploadedImage } from '@/types'
import { useState } from 'react'

interface OCRPreviewProps {
  images: UploadedImage[]
  text: string
  onTextChange: (text: string) => void
  onConfirm: () => void
  onRetry: () => void
  isLoading: boolean
}

export default function OCRPreview({
  images,
  text,
  onTextChange,
  onConfirm,
  onRetry,
  isLoading,
}: OCRPreviewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 border-b border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">텍스트 변환 결과</h3>
              <p className="text-sm text-gray-400">원본과 비교하며 텍스트를 확인하세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Image + Text */}
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {/* Left: Original Image */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">원본 답안지</h4>
            {images.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  disabled={selectedImageIndex === 0}
                  className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500">
                  {selectedImageIndex + 1} / {images.length}
                </span>
                <button
                  onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                  disabled={selectedImageIndex === images.length - 1}
                  className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50">
            <div className="h-[400px] overflow-auto">
              {images[selectedImageIndex] && (
                <img
                  src={images[selectedImageIndex].preview}
                  alt={`답안지 페이지 ${selectedImageIndex + 1}`}
                  className="w-full object-contain"
                />
              )}
            </div>
          </div>
          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex
                      ? 'border-purple-500 ring-2 ring-purple-500/30'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <img
                    src={img.preview}
                    alt={`페이지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: OCR Text */}
        <div className="p-5">
          <h4 className="text-sm font-medium text-gray-300 mb-3">추출된 텍스트</h4>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full h-[400px] p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm leading-relaxed text-gray-200 placeholder-gray-500"
            placeholder="손글씨에서 변환된 텍스트가 여기에 표시됩니다..."
          />
          <p className="mt-2 text-xs text-gray-500">
            * 잘못 인식된 부분이 있다면 직접 수정할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 bg-gray-800/50 border-t border-gray-800 flex justify-between">
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-300 transition-all duration-200 font-medium flex items-center gap-2 border border-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          다시 변환
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading || !text.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              평가 진행 중...
            </>
          ) : (
            <>
              이 내용으로 평가하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
