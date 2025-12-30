'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'
import OCRPreview from '@/components/OCRPreview'
import { UploadedImage, ComprehensiveResult, EngineerField } from '@/types'

// 기술사 종목 목록
const engineerFields: { value: EngineerField; label: string; category: string }[] = [
  // 정보통신 분야
  { value: '정보관리기술사', label: '정보관리기술사', category: '정보통신' },
  { value: '컴퓨터시스템응용기술사', label: '컴퓨터시스템응용기술사', category: '정보통신' },
  { value: '정보통신기술사', label: '정보통신기술사', category: '정보통신' },
  // 전기·전자 분야
  { value: '전자응용기술사', label: '전자응용기술사', category: '전기·전자' },
  { value: '전기응용기술사', label: '전기응용기술사', category: '전기·전자' },
  { value: '전기철도기술사', label: '전기철도기술사', category: '전기·전자' },
  // 기계·건설 분야
  { value: '기계기술사', label: '기계기술사', category: '기계·건설' },
  { value: '건축기계설비기술사', label: '건축기계설비기술사', category: '기계·건설' },
  { value: '건설기계기술사', label: '건설기계기술사', category: '기계·건설' },
  { value: '토목구조기술사', label: '토목구조기술사', category: '기계·건설' },
  { value: '토질및기초기술사', label: '토질및기초기술사', category: '기계·건설' },
  { value: '건축구조기술사', label: '건축구조기술사', category: '기계·건설' },
  { value: '건축시공기술사', label: '건축시공기술사', category: '기계·건설' },
  // 화학·환경 분야
  { value: '화공기술사', label: '화공기술사', category: '화학·환경' },
  { value: '대기관리기술사', label: '대기관리기술사', category: '화학·환경' },
  { value: '수질관리기술사', label: '수질관리기술사', category: '화학·환경' },
  { value: '소음진동기술사', label: '소음진동기술사', category: '화학·환경' },
  // 안전·품질 분야
  { value: '산업안전기술사', label: '산업안전기술사', category: '안전·품질' },
  { value: '건설안전기술사', label: '건설안전기술사', category: '안전·품질' },
  { value: '소방기술사', label: '소방기술사', category: '안전·품질' },
  { value: '품질관리기술사', label: '품질관리기술사', category: '안전·품질' },
  // 기타 분야
  { value: '측량및지형공간정보기술사', label: '측량및지형공간정보기술사', category: '기타' },
  { value: '발송배전기술사', label: '발송배전기술사', category: '기타' },
  { value: '식품기술사', label: '식품기술사', category: '기타' },
]

// 카테고리별 그룹핑
const fieldsByCategory = engineerFields.reduce((acc, field) => {
  if (!acc[field.category]) acc[field.category] = []
  acc[field.category].push(field)
  return acc
}, {} as Record<string, typeof engineerFields>)

// Dynamic import for ShaderCanvas to avoid SSR issues with WebGL
const ShaderCanvas = dynamic(() => import('@/components/ShaderCanvas'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 bg-gray-800 rounded-full animate-pulse" />,
})

type Step = 'upload' | 'ocr-review' | 'evaluating'

interface EvaluatorProgress {
  id: string
  name: string
  persona: string
  status: 'pending' | 'loading' | 'complete'
  score?: number
  shaderId: number
  timeOffset: number  // 각 셰이더가 다르게 움직이도록 시간 오프셋
}

export default function EvaluatePage() {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'ocr' | 'evaluating' | 'comprehensive'>('ocr')
  const [selectedField, setSelectedField] = useState<EngineerField>('정보관리기술사')
  const [error, setError] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string>('')
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [evaluatorProgress, setEvaluatorProgress] = useState<EvaluatorProgress[]>([
    { id: 'A', name: '김학술', persona: '이론 전문가형', status: 'pending', shaderId: 1, timeOffset: 0 },
    { id: 'B', name: '박실무', persona: '실무 전문가형', status: 'pending', shaderId: 2, timeOffset: 3.3 },
    { id: 'C', name: '이균형', persona: '합격 가이드형', status: 'pending', shaderId: 3, timeOffset: 6.7 },
  ])

  const handleOCR = async () => {
    if (images.length === 0) {
      setError('답안지 이미지를 업로드해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingStage('ocr')

    try {
      const ocrResults: { text: string; confidence: number }[] = []

      for (const image of images) {
        const ocrResponse = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: image.preview }),
        })

        const ocrData = await ocrResponse.json()
        if (!ocrData.success) {
          throw new Error(ocrData.error || 'OCR 처리 실패')
        }
        ocrResults.push({
          text: ocrData.data.text,
          confidence: ocrData.data.confidence,
        })
      }

      const combinedText = ocrResults.map(r => r.text).join('\n\n--- 페이지 구분 ---\n\n')
      const avgConfidence = ocrResults.reduce((acc, r) => acc + r.confidence, 0) / ocrResults.length

      setOcrText(combinedText)
      setOcrConfidence(avgConfidence)
      setStep('ocr-review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!ocrText.trim()) {
      setError('평가할 텍스트가 없습니다.')
      return
    }

    setIsLoading(true)
    setError(null)
    setStep('evaluating')
    setLoadingStage('evaluating')

    // Reset progress states
    setEvaluatorProgress([
      { id: 'A', name: '김학술', persona: '이론 전문가형', status: 'pending', shaderId: 1, timeOffset: 0 },
      { id: 'B', name: '박실무', persona: '실무 전문가형', status: 'pending', shaderId: 2, timeOffset: 3.3 },
      { id: 'C', name: '이균형', persona: '합격 가이드형', status: 'pending', shaderId: 3, timeOffset: 6.7 },
    ])

    try {
      // SSE 스트리밍 연결 (선택한 기술사 종목 전달)
      const response = await fetch('/api/evaluate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: ocrText, selectedField }),
      })

      if (!response.ok) {
        throw new Error('평가 요청 실패')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다.')
      }

      const decoder = new TextDecoder()
      let finalResult: ComprehensiveResult | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              switch (event.type) {
                case 'evaluator-start':
                  setEvaluatorProgress(prev =>
                    prev.map(e =>
                      e.id === event.evaluatorId ? { ...e, status: 'loading' } : e
                    )
                  )
                  break

                case 'evaluator-complete':
                  setEvaluatorProgress(prev =>
                    prev.map(e =>
                      e.id === event.evaluatorId
                        ? { ...e, status: 'complete', score: event.data.score }
                        : e
                    )
                  )
                  break

                case 'comprehensive-start':
                  setLoadingStage('comprehensive')
                  break

                case 'comprehensive-complete':
                  // 종합 분석 완료
                  break

                case 'complete':
                  finalResult = event.data
                  break

                case 'error':
                  throw new Error(event.data.message)
              }
            } catch (parseError) {
              // JSON 파싱 실패 시 무시 (불완전한 청크일 수 있음)
              if (parseError instanceof SyntaxError) continue
              throw parseError
            }
          }
        }
      }

      if (finalResult) {
        sessionStorage.setItem('evaluationResult', JSON.stringify(finalResult))
        sessionStorage.setItem('extractedText', ocrText)
        router.push('/result')
      } else {
        throw new Error('평가 결과를 받지 못했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '평가 중 오류가 발생했습니다.')
      setStep('ocr-review')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setStep('upload')
    setOcrText('')
    setOcrConfidence(0)
  }

  // 완료된 평가위원 수 계산
  const completedCount = evaluatorProgress.filter(e => e.status === 'complete').length
  const allComplete = completedCount === 3

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - only show on upload and ocr-review steps */}
      {step !== 'evaluating' && (
        <div className={`text-center py-12 transition-all duration-700 ease-out ${step === 'upload' ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
          <div className="flex justify-center items-center mb-6 relative">
            {/* 배경 글로우 효과 */}
            <div className="absolute w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
            <ShaderCanvas size={320} shaderId={2} isActive={true} />
          </div>
          {/* 메인 타이틀 - PEEX AI */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              PEEX
            </span>
            <span className="text-white ml-3">AI</span>
          </h1>
          <p className="text-xs text-gray-500 tracking-[0.3em] uppercase mb-4">
            Professional Engineer Examiner AI
          </p>
          {/* 소제목 */}
          <h2 className="text-xl md:text-2xl font-medium bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 bg-clip-text text-transparent">
            AI 기술사 답안 평가 서비스
          </h2>
        </div>
      )}

      {/* Progress Steps */}
      <div className={`flex justify-center transition-all duration-500 ${step === 'evaluating' ? 'pt-4' : ''}`}>
        <div className="flex items-center gap-4">
          {[
            { key: 'upload', label: '이미지 업로드', num: 1 },
            { key: 'ocr-review', label: '텍스트 변환', num: 2 },
            { key: 'evaluating', label: '평가', num: 3 },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-2 transition-all duration-300 ${step === s.key ? 'text-purple-400 scale-105' : step === 'evaluating' && s.key !== 'evaluating' ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === s.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : step === 'evaluating' && s.key !== 'evaluating' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {step === 'evaluating' && s.key !== 'evaluating' ? '✓' : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 mx-2 transition-all duration-500 ${step === 'ocr-review' && s.key === 'upload' ? 'bg-green-600' : step === 'evaluating' ? 'bg-green-600' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      <div className={`transition-all duration-500 ease-out ${step === 'upload' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
        {step === 'upload' && (
          <>
            {/* Main Form */}
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl border border-gray-800/50 p-8 space-y-8 animate-fadeIn shadow-2xl shadow-purple-900/10">
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-4">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  답안지 이미지 업로드
                </label>
                <ImageUploader images={images} onImagesChange={setImages} />
              </div>

              {/* 기술사 종목 선택 */}
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-4">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  기술사 시험 종목 선택
                </label>
                <div className="relative">
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value as EngineerField)}
                    className="w-full px-5 py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {Object.entries(fieldsByCategory).map(([category, fields]) => (
                      <optgroup key={category} label={`━━ ${category} ━━`}>
                        {fields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  평가 기준이 되는 기술사 종목을 선택하세요
                </p>
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-900/50 rounded-2xl p-5 text-red-400 flex items-center gap-4 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleOCR}
                disabled={images.length === 0 || isLoading}
                className={`
                  relative w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden
                  ${images.length > 0 && !isLoading
                    ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/50'
                  }
                `}
              >
                {images.length > 0 && !isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                )}
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    손글씨 인식 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    손글씨 텍스트로 변환하기
                  </>
                )}
              </button>
            </div>

            {/* Features - moved below image upload */}
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              <div className="group relative bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800/50 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">손글씨 인식</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Google Vision AI가 손글씨를 정확하게 텍스트로 변환합니다.
                  </p>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-purple-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">3인 AI 평가위원</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    학자형, 실무형, 교육자형 3가지 관점으로 다각적 평가를 진행합니다.
                  </p>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800/50 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">맞춤형 학습 가이드</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    취약점을 분석하고 합격을 위한 맞춤형 학습 방향을 제시합니다.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Step 2: OCR Review */}
      <div className={`transition-all duration-500 ease-out ${step === 'ocr-review' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
        {step === 'ocr-review' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로 가기
              </button>
            </div>

            <OCRPreview
              images={images}
              text={ocrText}
              confidence={ocrConfidence}
              onTextChange={setOcrText}
              onConfirm={handleEvaluate}
              onRetry={handleOCR}
              isLoading={isLoading}
            />

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Evaluating - 3명 가로 배치 */}
      <div className={`transition-all duration-700 ease-out ${step === 'evaluating' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
        {step === 'evaluating' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fadeIn px-4 relative">
            {/* 배경 글로우 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            {/* 타이틀 */}
            <div className="text-center mb-16 relative">
              {/* 선택된 기술사 종목 표시 */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-full mb-6 animate-fadeIn backdrop-blur-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-purple-200 font-semibold">{selectedField}</span>
                <span className="text-purple-400/60 text-sm">시험 답안 평가</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-4">
                {allComplete ? '평가 완료' : 'AI 평가위원 심사 중'}
              </h2>
              <p className="text-gray-400 text-lg">
                {allComplete
                  ? '모든 평가가 완료되었습니다. 결과를 종합하고 있습니다...'
                  : `${selectedField} 기준으로 3명의 AI 평가위원이 심사 중입니다`}
              </p>
            </div>

            {/* 3명 평가위원 가로 배치 */}
            {loadingStage === 'evaluating' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative">
              {evaluatorProgress.map((evaluator, index) => (
                <div
                  key={evaluator.id}
                  className={`
                    group relative flex flex-col items-center p-8 rounded-3xl border transition-all duration-700
                    ${evaluator.status === 'complete'
                      ? 'bg-gradient-to-b from-emerald-950/50 to-gray-950 border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
                      : evaluator.status === 'loading'
                      ? 'bg-gradient-to-b from-purple-950/50 to-gray-950 border-purple-500/50 shadow-2xl shadow-purple-500/20'
                      : 'bg-gradient-to-b from-gray-900/80 to-gray-950 border-gray-700/50'
                    }
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 카드 배경 글로우 */}
                  {evaluator.status === 'loading' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-3xl" />
                  )}

                  {/* Shader Effect / 완료 체크 */}
                  <div className="relative mb-8">
                    {evaluator.status === 'complete' ? (
                      <div className="relative w-56 h-56">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full animate-pulse" />
                        <div className="absolute inset-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <svg className="w-16 h-16 text-white animate-scaleIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <ShaderCanvas
                          size={224}
                          shaderId={evaluator.shaderId}
                          isActive={evaluator.status === 'loading'}
                          timeOffset={evaluator.timeOffset}
                        />
                        {evaluator.status === 'pending' && (
                          <div className="absolute inset-0 bg-gray-900/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 평가위원 정보 */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {evaluator.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 font-medium">{evaluator.persona}</p>

                  {/* 상태 표시 */}
                  <div className={`
                    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500
                    ${evaluator.status === 'complete'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : evaluator.status === 'loading'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
                    }
                  `}>
                    {evaluator.status === 'complete' ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        평가 완료
                      </span>
                    ) : evaluator.status === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        심사 진행 중
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        대기 중
                      </span>
                    )}
                  </div>

                </div>
              ))}
            </div>
            )}

            {/* 전체 진행 상황 */}
            {loadingStage === 'evaluating' && (
            <div className="mt-16 w-full max-w-lg relative">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-400 font-medium">전체 진행률</span>
                <span className="text-purple-300 font-semibold">{completedCount}/3 완료</span>
              </div>
              <div className="h-3 bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/50">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 transition-all duration-700 ease-out relative"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            )}

            {/* 종합 분석 표시 */}
            {loadingStage === 'comprehensive' && (
              <div className="mt-12 bg-gradient-to-br from-purple-950/60 to-indigo-950/60 rounded-3xl border border-purple-500/30 p-8 animate-fadeIn max-w-lg w-full backdrop-blur-sm shadow-2xl shadow-purple-500/10">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg mb-1">종합 분석 진행 중</div>
                    <div className="text-sm text-gray-400">3명의 평가 결과를 종합하고 있습니다...</div>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Animation CSS */}
      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
