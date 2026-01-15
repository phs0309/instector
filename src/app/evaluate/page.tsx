'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'
import OCRPreview from '@/components/OCRPreview'
import { UploadedImage, ComprehensiveResult, EngineerField, AIModel } from '@/types'

// 84개 기술사 종목 목록
const engineerFields: { value: EngineerField; label: string; category: string }[] = [
  // 건설 및 건축 분야 - 건축 (5개)
  { value: '건축구조기술사', label: '건축구조기술사', category: '건축' },
  { value: '건축기계설비기술사', label: '건축기계설비기술사', category: '건축' },
  { value: '건축시공기술사', label: '건축시공기술사', category: '건축' },
  { value: '건축전기설비기술사', label: '건축전기설비기술사', category: '건축' },
  { value: '건축품질시험기술사', label: '건축품질시험기술사', category: '건축' },
  // 건설 및 건축 분야 - 토목 (11개)
  { value: '토목시공기술사', label: '토목시공기술사', category: '토목' },
  { value: '토질및기초기술사', label: '토질및기초기술사', category: '토목' },
  { value: '토목구조기술사', label: '토목구조기술사', category: '토목' },
  { value: '도로및공항기술사', label: '도로및공항기술사', category: '토목' },
  { value: '상하수도기술사', label: '상하수도기술사', category: '토목' },
  { value: '수자원개발기술사', label: '수자원개발기술사', category: '토목' },
  { value: '지적기술사', label: '지적기술사', category: '토목' },
  { value: '측량및지형공간정보기술사', label: '측량및지형공간정보기술사', category: '토목' },
  { value: '항만및해안기술사', label: '항만및해안기술사', category: '토목' },
  { value: '철도기술사', label: '철도기술사', category: '토목' },
  { value: '농어업토목기술사', label: '농어업토목기술사', category: '토목' },
  // 건설 및 건축 분야 - 도시/교통 (3개)
  { value: '도시계획기술사', label: '도시계획기술사', category: '도시/교통' },
  { value: '조경기술사', label: '조경기술사', category: '도시/교통' },
  { value: '교통기술사', label: '교통기술사', category: '도시/교통' },
  // 안전관리 및 환경 분야 - 안전 (7개)
  { value: '소방기술사', label: '소방기술사', category: '안전' },
  { value: '건설안전기술사', label: '건설안전기술사', category: '안전' },
  { value: '기계안전기술사', label: '기계안전기술사', category: '안전' },
  { value: '전기안전기술사', label: '전기안전기술사', category: '안전' },
  { value: '화공안전기술사', label: '화공안전기술사', category: '안전' },
  { value: '가스기술사', label: '가스기술사', category: '안전' },
  { value: '인간공학기술사', label: '인간공학기술사', category: '안전' },
  // 안전관리 및 환경 분야 - 환경 (6개)
  { value: '수질관리기술사', label: '수질관리기술사', category: '환경' },
  { value: '대기관리기술사', label: '대기관리기술사', category: '환경' },
  { value: '소음진동기술사', label: '소음진동기술사', category: '환경' },
  { value: '폐기물처리기술사', label: '폐기물처리기술사', category: '환경' },
  { value: '자연환경관리기술사', label: '자연환경관리기술사', category: '환경' },
  { value: '토양환경기술사', label: '토양환경기술사', category: '환경' },
  // 안전관리 및 환경 분야 - 비파괴 (1개)
  { value: '비파괴검사기술사', label: '비파괴검사기술사', category: '비파괴' },
  // 기계 및 금속 분야 - 기계 (5개)
  { value: '기계기술사', label: '기계기술사', category: '기계' },
  { value: '공조냉동기계기술사', label: '공조냉동기계기술사', category: '기계' },
  { value: '건설기계기술사', label: '건설기계기술사', category: '기계' },
  { value: '산업기계설비기술사', label: '산업기계설비기술사', category: '기계' },
  { value: '금형기술사', label: '금형기술사', category: '기계' },
  // 기계 및 금속 분야 - 자동차/항공/조선 (4개)
  { value: '차량기술사', label: '차량기술사', category: '자동차/항공/조선' },
  { value: '항공기관기술사', label: '항공기관기술사', category: '자동차/항공/조선' },
  { value: '항공기체기술사', label: '항공기체기술사', category: '자동차/항공/조선' },
  { value: '조선기술사', label: '조선기술사', category: '자동차/항공/조선' },
  // 기계 및 금속 분야 - 금속/재료 (4개)
  { value: '금속제련기술사', label: '금속제련기술사', category: '금속/재료' },
  { value: '금속재료기술사', label: '금속재료기술사', category: '금속/재료' },
  { value: '표면처리기술사', label: '표면처리기술사', category: '금속/재료' },
  { value: '세라믹기술사', label: '세라믹기술사', category: '금속/재료' },
  // 전기, 전자 및 정보통신 분야 - 전기 (3개)
  { value: '발송배전기술사', label: '발송배전기술사', category: '전기' },
  { value: '전기응용기술사', label: '전기응용기술사', category: '전기' },
  { value: '철도신호기술사', label: '철도신호기술사', category: '전기' },
  // 전기, 전자 및 정보통신 분야 - 전자 (2개)
  { value: '산업계측제어기술사', label: '산업계측제어기술사', category: '전자' },
  { value: '전자응용기술사', label: '전자응용기술사', category: '전자' },
  // 전기, 전자 및 정보통신 분야 - 정보통신/IT (3개)
  { value: '정보관리기술사', label: '정보관리기술사', category: '정보통신' },
  { value: '컴퓨터시스템응용기술사', label: '컴퓨터시스템응용기술사', category: '정보통신' },
  { value: '정보통신기술사', label: '정보통신기술사', category: '정보통신' },
  // 화공, 에너지 및 기타 분야 - 화공 (1개)
  { value: '화공기술사', label: '화공기술사', category: '화공' },
  // 화공, 에너지 및 기타 분야 - 에너지 (2개)
  { value: '원자력발전기술사', label: '원자력발전기술사', category: '에너지' },
  { value: '방사선관리기술사', label: '방사선관리기술사', category: '에너지' },
  // 화공, 에너지 및 기타 분야 - 농림/수산 (5개)
  { value: '산림기술사', label: '산림기술사', category: '농림/수산' },
  { value: '종자기술사', label: '종자기술사', category: '농림/수산' },
  { value: '시설원예기술사', label: '시설원예기술사', category: '농림/수산' },
  { value: '수산제조기술사', label: '수산제조기술사', category: '농림/수산' },
  { value: '해양기술사', label: '해양기술사', category: '농림/수산' },
  // 화공, 에너지 및 기타 분야 - 기타 (4개)
  { value: '포장기술사', label: '포장기술사', category: '기타' },
  { value: '기상예보기술사', label: '기상예보기술사', category: '기타' },
  { value: '식품기술사', label: '식품기술사', category: '기타' },
  { value: '품질관리기술사', label: '품질관리기술사', category: '기타' },
]

// 카테고리별 그룹핑
const fieldsByCategory = engineerFields.reduce((acc, field) => {
  if (!acc[field.category]) acc[field.category] = []
  acc[field.category].push(field)
  return acc
}, {} as Record<string, typeof engineerFields>)

// AI 모델 옵션
const aiModels: { id: AIModel; name: string; description: string; color: string }[] = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT (GPT-4o)',
    description: 'OpenAI의 최신 멀티모달 AI',
    color: 'emerald',
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Flash',
    description: 'Google의 빠른 AI 모델',
    color: 'blue',
  },
]

// Dynamic import for ShaderCanvas to avoid SSR issues with WebGL
const ShaderCanvas = dynamic(() => import('@/components/ShaderCanvas'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 bg-zinc-800 rounded-full animate-pulse" />,
})

type Step = 'upload' | 'ocr-review' | 'evaluating'

interface EvaluatorProgress {
  id: string
  name: string
  persona: string
  status: 'pending' | 'loading' | 'complete'
  score?: number
  shaderId: number
  timeOffset: number
}

export default function EvaluatePage() {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'ocr' | 'evaluating' | 'comprehensive'>('ocr')
  const [selectedField, setSelectedField] = useState<EngineerField>('정보관리기술사')
  const [selectedAI, setSelectedAI] = useState<AIModel>('gpt-4o')
  const [error, setError] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string>('')
  const [evaluatorProgress, setEvaluatorProgress] = useState<EvaluatorProgress[]>([
    { id: 'A', name: 'AI 평가위원', persona: '통합 전문가형', status: 'pending', shaderId: 2, timeOffset: 0 },
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
      const image = images[0]

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.preview }),
      })

      const ocrData = await ocrResponse.json()
      if (!ocrData.success) {
        throw new Error(ocrData.error || 'OCR 처리 실패')
      }

      setOcrText(ocrData.data.text)
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
      { id: 'A', name: 'AI 평가위원', persona: '통합 전문가형', status: 'pending', shaderId: 2, timeOffset: 0 },
    ])

    try {
      // SSE 스트리밍 연결 (선택한 기술사 종목 및 AI 모델 전달)
      const response = await fetch('/api/evaluate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: ocrText, selectedField, aiModel: selectedAI }),
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
              console.log('SSE Event:', event.type, event)

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
                  break

                case 'complete':
                  console.log('Complete event received:', event.data)
                  finalResult = event.data
                  break

                case 'error':
                  throw new Error(event.data.message)
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                console.log('JSON parse error (ignored):', line)
                continue
              }
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
  }

  const completedCount = evaluatorProgress.filter(e => e.status === 'complete').length
  const allComplete = completedCount === 1

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      {step !== 'evaluating' && (
        <div className={`text-center py-12 transition-all duration-700 ease-out`}>
          <div className="flex justify-center items-center mb-6 relative">
            <div className="absolute w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
            <ShaderCanvas size={320} shaderId={2} isActive={true} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              PEEX
            </span>
            <span className="text-white ml-3">AI</span>
          </h1>
          <p className="text-xs text-zinc-500 tracking-[0.3em] uppercase mb-4">
            Professional Engineer Examiner AI
          </p>
          <h2 className="text-xl md:text-2xl font-medium bg-gradient-to-r from-zinc-300 via-blue-200 to-zinc-300 bg-clip-text text-transparent">
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
              <div className={`flex items-center gap-2 transition-all duration-300 ${step === s.key ? 'text-purple-400 scale-105' : step === 'evaluating' && s.key !== 'evaluating' ? 'text-green-400' : 'text-zinc-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === s.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : step === 'evaluating' && s.key !== 'evaluating' ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                  {step === 'evaluating' && s.key !== 'evaluating' ? '✓' : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 mx-2 transition-all duration-500 ${step === 'ocr-review' && s.key === 'upload' ? 'bg-green-600' : step === 'evaluating' ? 'bg-green-600' : 'bg-zinc-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      <div className={`transition-all duration-500 ease-out ${step === 'upload' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
        {step === 'upload' && (
          <>
            <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700/50 p-8 space-y-8 animate-fadeIn shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* 이미지 업로드 */}
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  답안지 이미지 업로드
                </label>
                <ImageUploader images={images} onImagesChange={setImages} />
              </div>

              {/* 기술사 종목 선택 */}
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  기술사 시험 종목 선택 (84개 종목)
                </label>
                <div className="relative">
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value as EngineerField)}
                    className="w-full px-5 py-4 bg-zinc-700/80 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
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
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  84개 기술사 종목 중 평가 기준이 되는 종목을 선택하세요
                </p>
              </div>

              {/* AI 모델 선택 */}
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI 모델 선택
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedAI(model.id)}
                      className={`
                        relative p-5 rounded-2xl border-2 transition-all duration-300 text-left
                        ${selectedAI === model.id
                          ? model.id === 'gpt-4o'
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                            : 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                          : 'border-zinc-600/50 bg-zinc-700/30 hover:border-zinc-500'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center text-lg
                          ${selectedAI === model.id
                            ? model.id === 'gpt-4o'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-600/50 text-zinc-400'
                          }
                        `}>
                          {model.id === 'gpt-4o' ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6099-1.4997Z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm-1 3v6.268l-3.964-2.268L6 10.732 10.732 14l-4.732 2.732L7.036 18l3.964-2.268V22h2v-6.268l3.964 2.268L18 16.268 13.268 14 18 11.268 16.964 10l-3.964 2.268V5h-2z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{model.name}</h4>
                          <p className="text-xs text-zinc-400">{model.description}</p>
                        </div>
                      </div>
                      {selectedAI === model.id && (
                        <div className={`
                          absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                          ${model.id === 'gpt-4o' ? 'bg-emerald-500' : 'bg-blue-500'}
                        `}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                    : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed border border-zinc-600/50'
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

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              <div className="group relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">손글씨 인식</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Google Vision AI가 손글씨를 정확하게 텍스트로 변환합니다.
                  </p>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-purple-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">AI 모델 선택</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    GPT-4o 또는 Gemini 중 원하는 AI를 선택하여 평가받을 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-zinc-700/50 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">맞춤형 학습 가이드</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
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
                className="px-4 py-2 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로 가기
              </button>
              {/* 선택된 AI 모델 표시 */}
              <div className={`
                px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2
                ${selectedAI === 'gpt-4o' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}
              `}>
                {selectedAI === 'gpt-4o' ? 'ChatGPT (GPT-4o)' : 'Gemini 2.5 Flash'}로 평가
              </div>
            </div>

            <OCRPreview
              images={images}
              text={ocrText}
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

      {/* Step 3: Evaluating - 1명 평가위원 */}
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
              {/* 선택된 정보 표시 */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-full animate-fadeIn backdrop-blur-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-purple-200 font-semibold">{selectedField}</span>
                </div>
                <div className={`
                  inline-flex items-center gap-3 px-5 py-2.5 rounded-full animate-fadeIn backdrop-blur-sm
                  ${selectedAI === 'gpt-4o' ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-500/30' : 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30'}
                `}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${selectedAI === 'gpt-4o' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  <span className={selectedAI === 'gpt-4o' ? 'text-emerald-200 font-semibold' : 'text-blue-200 font-semibold'}>
                    {selectedAI === 'gpt-4o' ? 'ChatGPT (GPT-4o)' : 'Gemini 2.5 Flash'}
                  </span>
                </div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-4">
                {allComplete ? '평가 완료' : 'AI 평가 진행 중'}
              </h2>
              <p className="text-zinc-400 text-lg">
                {allComplete
                  ? '평가가 완료되었습니다. 결과를 종합하고 있습니다...'
                  : 'AI가 답안을 분석하고 평가하고 있습니다'}
              </p>
            </div>

            {/* 1명 평가위원 카드 */}
            {loadingStage === 'evaluating' && (
              <div className="w-full max-w-md relative">
                {evaluatorProgress.map((evaluator) => (
                  <div
                    key={evaluator.id}
                    className={`
                      group relative flex flex-col items-center p-8 rounded-3xl border transition-all duration-700
                      ${evaluator.status === 'complete'
                        ? 'bg-gradient-to-b from-emerald-950/50 to-zinc-900 border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
                        : evaluator.status === 'loading'
                        ? 'bg-gradient-to-b from-purple-950/50 to-zinc-900 border-purple-500/50 shadow-2xl shadow-purple-500/20'
                        : 'bg-gradient-to-b from-zinc-800/80 to-zinc-900 border-zinc-700/50'
                      }
                    `}
                  >
                    {evaluator.status === 'loading' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-3xl" />
                    )}

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
                            <div className="absolute inset-0 bg-zinc-900/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {evaluator.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-6 font-medium">{evaluator.persona}</p>

                    <div className={`
                      px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500
                      ${evaluator.status === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : evaluator.status === 'loading'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-zinc-700/50 text-zinc-500 border border-zinc-600/50'
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
                          <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                          대기 중
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
                    <div className="text-sm text-zinc-400">평가 결과를 종합하고 있습니다...</div>
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

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
