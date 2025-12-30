'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'
import OCRPreview from '@/components/OCRPreview'
import { UploadedImage, ComprehensiveResult, StructureAnalysis } from '@/types'

// Dynamic import for ShaderCanvas to avoid SSR issues with WebGL
const ShaderCanvas = dynamic(() => import('@/components/ShaderCanvas'), {
  ssr: false,
  loading: () => <div className="w-80 h-80 bg-gray-800 rounded-full animate-pulse" />,
})

type Step = 'upload' | 'ocr-review' | 'evaluating'

interface EvaluatorProgress {
  id: string
  name: string
  status: 'pending' | 'loading' | 'complete'
  score?: number
  shaderId: number
}

interface StructureAnalysisProgress {
  status: 'pending' | 'loading' | 'complete'
  detectedField?: string
  structureScore?: number
  analysisResult?: StructureAnalysis // 구조 분석 결과 전체
}

export default function Home() {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'ocr' | 'evaluating' | 'analyzing'>('ocr')
  const [error, setError] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string>('')
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [evaluatorProgress, setEvaluatorProgress] = useState<EvaluatorProgress[]>([
    { id: 'A', name: '김학술 (학자형)', status: 'pending', shaderId: 1 },
    { id: 'B', name: '박실무 (실무형)', status: 'pending', shaderId: 2 },
    { id: 'C', name: '이균형 (교육자형)', status: 'pending', shaderId: 3 },
  ])
  const [structureProgress, setStructureProgress] = useState<StructureAnalysisProgress>({
    status: 'pending',
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [analysisMessages, setAnalysisMessages] = useState<string[]>([])
  const [currentMessage, setCurrentMessage] = useState('')

  // 구조 분석 중 실시간 메시지 표시
  const structureAnalysisSteps = [
    '답안 텍스트 파싱 중...',
    '문단 구조 분석 중...',
    '서론/본론/결론 구조 확인 중...',
    '개요도 및 도식 탐지 중...',
    '핵심 키워드 추출 중...',
    '기술 분야 판별 중...',
    '누락 키워드 분석 중...',
    '가독성 평가 중...',
    '분량 측정 중...',
    '구조 점수 산출 중...',
  ]

  // 구조 분석 메시지 순차 표시
  useEffect(() => {
    if (structureProgress.status !== 'loading') {
      setAnalysisMessages([])
      setCurrentMessage('')
      return
    }

    let messageIndex = 0
    const interval = setInterval(() => {
      if (messageIndex < structureAnalysisSteps.length) {
        setCurrentMessage(structureAnalysisSteps[messageIndex])
        if (messageIndex > 0) {
          setAnalysisMessages(prev => [...prev.slice(-2), structureAnalysisSteps[messageIndex - 1]])
        }
        messageIndex++
      } else {
        // 마지막 메시지 후 처음부터 반복
        messageIndex = 0
        setAnalysisMessages([])
      }
    }, 500)

    return () => clearInterval(interval)
  }, [structureProgress.status])

  // 슬라이드 자동 전환
  useEffect(() => {
    if (step !== 'evaluating') {
      setCurrentSlide(0)
      return
    }

    // 구조 분석 완료 시 슬라이드 1로 이동
    if (structureProgress.status === 'complete' && currentSlide === 0) {
      setCurrentSlide(1)
    }

    // 평가위원 완료 시 다음 슬라이드로 이동
    evaluatorProgress.forEach((e, idx) => {
      if (e.status === 'complete' && currentSlide === idx + 1) {
        setCurrentSlide(idx + 2)
      }
    })
  }, [step, structureProgress.status, evaluatorProgress, currentSlide])

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
    setStructureProgress({ status: 'pending' })
    setEvaluatorProgress([
      { id: 'A', name: '김학술 (학자형)', status: 'pending', shaderId: 1 },
      { id: 'B', name: '박실무 (실무형)', status: 'pending', shaderId: 2 },
      { id: 'C', name: '이균형 (교육자형)', status: 'pending', shaderId: 3 },
    ])

    try {
      // 구조 분석 시작 표시
      setStructureProgress({ status: 'loading' })

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: ocrText }),
      })

      if (!response.ok) {
        throw new Error('평가 요청 실패')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '평가 중 오류가 발생했습니다.')
      }

      const result: ComprehensiveResult = data.data

      // 구조 분석 완료 표시
      if (result.structureAnalysis) {
        setStructureProgress({
          status: 'complete',
          detectedField: result.structureAnalysis.detectedField,
          structureScore: result.structureAnalysis.overallStructureScore,
          analysisResult: result.structureAnalysis,
        })
      }

      // 짧은 딜레이 후 슬라이드 전환
      await new Promise(resolve => setTimeout(resolve, 800))

      // 평가위원 결과 순차 표시 (애니메이션 효과)
      if (result.evaluations) {
        for (let i = 0; i < result.evaluations.length; i++) {
          const evaluation = result.evaluations[i]

          // 현재 평가위원 로딩 표시
          setEvaluatorProgress(prev =>
            prev.map((e, idx) =>
              idx === i ? { ...e, status: 'loading' } : e
            )
          )

          // 짧은 딜레이 (애니메이션)
          await new Promise(resolve => setTimeout(resolve, 600))

          // 완료 표시
          setEvaluatorProgress(prev =>
            prev.map((e, idx) =>
              idx === i ? { ...e, status: 'complete', score: evaluation.score } : e
            )
          )

          // 다음 평가위원 전에 잠깐 대기
          await new Promise(resolve => setTimeout(resolve, 400))
        }
      }

      // 종합 분석 표시
      setLoadingStage('analyzing')
      await new Promise(resolve => setTimeout(resolve, 500))

      sessionStorage.setItem('evaluationResult', JSON.stringify(result))
      sessionStorage.setItem('extractedText', ocrText)
      router.push('/result')
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

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - only show on upload and ocr-review steps */}
      {step !== 'evaluating' && (
        <div className={`text-center py-8 transition-all duration-700 ease-out ${step === 'upload' ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
          <div className="flex justify-center items-center mb-6">
            <ShaderCanvas size={320} shaderId={1} isActive={true} />
          </div>
          <h2 className="text-2xl font-bold text-white transition-opacity duration-500">
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
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  답안지 이미지 업로드
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  기술사 분야는 AI가 답안 내용을 분석하여 자동으로 판단합니다.
                </p>
                <ImageUploader images={images} onImagesChange={setImages} />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleOCR}
                disabled={images.length === 0 || isLoading}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2
                  ${images.length > 0 && !isLoading
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    손글씨 인식 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    손글씨 텍스트로 변환하기
                  </>
                )}
              </button>
            </div>

            {/* Features - moved below image upload */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">손글씨 인식</h3>
                <p className="text-sm text-gray-400">
                  AI가 손글씨를 정확하게 텍스트로 변환합니다.
                </p>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">3인 평가위원</h3>
                <p className="text-sm text-gray-400">
                  학자형, 실무형, 교육자형 3가지 관점으로 다각적 평가를 진행합니다.
                </p>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">학습 가이드</h3>
                <p className="text-sm text-gray-400">
                  취약점을 분석하고 맞춤형 학습 방향을 제시합니다.
                </p>
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

      {/* Step 3: Evaluating - 슬라이드 기반 */}
      <div className={`transition-all duration-700 ease-out ${step === 'evaluating' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
        {step === 'evaluating' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fadeIn">
            {/* 슬라이드 컨테이너 */}
            <div className="relative w-full overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {/* 슬라이드 0: 구조 분석 */}
                <div className="w-full flex-shrink-0 flex flex-col items-center justify-center px-4 py-8">
                  <div className="relative mb-8">
                    <div className={`w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center ${structureProgress.status !== 'complete' ? 'animate-pulse' : ''}`}>
                      <svg className="w-40 h-40 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    {structureProgress.status === 'loading' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-72 h-72 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                    {structureProgress.status === 'complete' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-scaleIn">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {structureProgress.status === 'complete' ? '구조 분석 완료' : '구조 분석 중'}
                  </h3>
                  <p className="text-gray-400 text-center mb-4">
                    {structureProgress.status === 'complete'
                      ? '답안 구조 분석이 완료되었습니다'
                      : '답안의 구조와 키워드를 분석하고 있습니다'}
                  </p>

                  {/* 구조 분석 중 실시간 메시지 */}
                  {structureProgress.status === 'loading' && (
                    <div className="w-full max-w-md space-y-2 mt-4">
                      {/* 이전 메시지들 (흐리게) */}
                      {analysisMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-500 text-center transition-all duration-300 animate-fadeIn"
                          style={{ opacity: 0.3 + (idx * 0.2) }}
                        >
                          <span className="text-green-500 mr-2">✓</span>
                          {msg}
                        </div>
                      ))}
                      {/* 현재 메시지 (밝게, 깜빡임) */}
                      {currentMessage && (
                        <div className="text-sm text-purple-300 text-center font-medium animate-pulse">
                          <span className="inline-block w-4 h-4 mr-2 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                          {currentMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 구조 분석 결과 표시 */}
                  {structureProgress.status === 'complete' && structureProgress.analysisResult && (
                    <div className="w-full max-w-2xl mt-4 space-y-4 animate-fadeIn">
                      {/* 분야 및 점수 */}
                      <div className="flex justify-center gap-4">
                        <div className="px-4 py-2 bg-purple-900/50 rounded-xl border border-purple-600">
                          <span className="text-purple-300 text-sm">분야</span>
                          <p className="font-bold text-white">{structureProgress.analysisResult.detectedField}</p>
                        </div>
                        <div className="px-4 py-2 bg-purple-900/50 rounded-xl border border-purple-600">
                          <span className="text-purple-300 text-sm">구조 점수</span>
                          <p className="font-bold text-white">{structureProgress.analysisResult.overallStructureScore}점</p>
                        </div>
                      </div>

                      {/* 구조 분석 상세 */}
                      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">답안 구조</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            structureProgress.analysisResult.structure.hasOutline
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {structureProgress.analysisResult.structure.hasOutline ? '✓' : '✗'} 개요도
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            structureProgress.analysisResult.structure.hasIntro
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {structureProgress.analysisResult.structure.hasIntro ? '✓' : '✗'} 서론
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            structureProgress.analysisResult.structure.hasBody
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {structureProgress.analysisResult.structure.hasBody ? '✓' : '✗'} 본론
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            structureProgress.analysisResult.structure.hasConclusion
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {structureProgress.analysisResult.structure.hasConclusion ? '✓' : '✗'} 결론
                          </span>
                          {structureProgress.analysisResult.diagrams.hasDiagram && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                              ✓ 도식 포함
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {structureProgress.analysisResult.structure.structureComment}
                        </p>
                      </div>

                      {/* 발견된 키워드 */}
                      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">발견된 키워드</h4>
                        <div className="flex flex-wrap gap-2">
                          {structureProgress.analysisResult.keywords.found.slice(0, 8).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        {structureProgress.analysisResult.keywords.missing.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-gray-300 mt-4 mb-2">보완 추천 키워드</h4>
                            <div className="flex flex-wrap gap-2">
                              {structureProgress.analysisResult.keywords.missing.slice(0, 5).map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-xs"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 분량 및 가독성 */}
                      <div className="flex justify-center gap-4 text-sm">
                        <div className="text-gray-400">
                          예상 분량: <span className="text-white font-medium">{structureProgress.analysisResult.format.estimatedPages}페이지</span>
                        </div>
                        <div className="text-gray-400">
                          가독성: <span className={`font-medium ${
                            structureProgress.analysisResult.format.readability === '상'
                              ? 'text-green-400'
                              : structureProgress.analysisResult.format.readability === '중'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}>{structureProgress.analysisResult.format.readability}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 슬라이드 1-3: 평가위원 A, B, C */}
                {evaluatorProgress.map((evaluator) => (
                  <div key={evaluator.id} className="w-full flex-shrink-0 flex flex-col items-center justify-center px-4 py-8">
                    <div className="relative mb-8">
                      {evaluator.status === 'complete' ? (
                        <div className="w-80 h-80 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-full flex items-center justify-center">
                          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-scaleIn">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ShaderCanvas size={320} shaderId={evaluator.shaderId} isActive={evaluator.status === 'loading'} />
                          {evaluator.status === 'loading' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-72 h-72 border-4 border-white/10 border-t-white/40 rounded-full animate-spin"></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {evaluator.status === 'complete'
                        ? `평가위원 ${evaluator.id} 완료`
                        : evaluator.status === 'loading'
                        ? `평가위원 ${evaluator.id} 평가 중`
                        : `평가위원 ${evaluator.id} 대기 중`}
                    </h3>
                    <p className="text-gray-400">{evaluator.name}</p>
                    {evaluator.status === 'complete' && evaluator.score !== undefined && (
                      <div className={`mt-4 px-6 py-3 rounded-xl font-bold text-xl ${
                        evaluator.score >= 60
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {evaluator.score}점
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 슬라이드 인디케이터 */}
            <div className="flex gap-2 mt-8">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'bg-purple-500 w-8' : 'bg-gray-600 w-3'
                  }`}
                />
              ))}
            </div>

            {/* 진행 바 */}
            <div className="w-64 h-1.5 bg-gray-800 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${((currentSlide + 1) / 4) * 100}%` }}
              />
            </div>

            {/* 단계 라벨 */}
            <div className="mt-4 text-sm text-gray-500">
              {currentSlide === 0 && '1/4 구조 분석'}
              {currentSlide === 1 && '2/4 평가위원 A'}
              {currentSlide === 2 && '3/4 평가위원 B'}
              {currentSlide === 3 && '4/4 평가위원 C'}
            </div>

            {/* 종합 분석 표시 */}
            {loadingStage === 'analyzing' && (
              <div className="mt-8 bg-purple-900/20 rounded-2xl border border-purple-600 p-6 animate-fadeIn max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">종합 분석 진행 중</div>
                    <div className="text-sm text-gray-400">결과를 종합하고 있습니다...</div>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                        style={{ animationDelay: `${dot * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
