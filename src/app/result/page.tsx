'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ComprehensiveResult } from '@/types'
import EvaluatorCard from '@/components/EvaluatorCard'
import ResultSummary from '@/components/ResultSummary'

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<ComprehensiveResult | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [field, setField] = useState<string>('')
  const [showOCR, setShowOCR] = useState(false)
  const [showModelAnswer, setShowModelAnswer] = useState(false)
  const [modelAnswer, setModelAnswer] = useState<string>('')
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    const storedResult = sessionStorage.getItem('evaluationResult')
    const storedText = sessionStorage.getItem('extractedText')
    const storedField = sessionStorage.getItem('field')

    if (!storedResult) {
      router.push('/')
      return
    }

    setResult(JSON.parse(storedResult))
    setExtractedText(storedText || '')
    setField(storedField || '')
  }, [router])

  // 모범답안 생성 함수
  const generateModelAnswer = async () => {
    if (!result || !extractedText) return

    setIsGeneratingAnswer(true)
    setGenerationError(null)
    setShowModelAnswer(true)

    try {
      const response = await fetch('/api/generate-model-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText,
          selectedField: field,
          evaluations: result.evaluations,
          overallStrengths: result.overallStrengths,
          overallWeaknesses: result.overallWeaknesses,
          improvements: result.improvements,
        }),
      })

      if (!response.ok) {
        throw new Error('모범답안 생성에 실패했습니다.')
      }

      const data = await response.json()
      if (data.success) {
        setModelAnswer(data.data.modelAnswer)
      } else {
        throw new Error(data.error || '모범답안 생성에 실패했습니다.')
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : '모범답안 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">평가 결과</h2>
          <p className="text-gray-400 mt-1">{field}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl text-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow"
        >
          ← 새 평가하기
        </button>
      </div>

      {/* Summary */}
      <ResultSummary result={result} />

      {/* Evaluator Cards - 세로 배치 */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm">
            3
          </span>
          평가위원별 상세 평가
        </h3>
        <div className="space-y-6">
          {result.evaluations.map((evaluation) => (
            <EvaluatorCard key={evaluation.evaluatorId} evaluation={evaluation} />
          ))}
        </div>
      </div>

      {/* Model Answer Section */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI 모범 답안 생성</h3>
              <p className="text-sm text-gray-400">평가위원들의 피드백을 반영하여 수정된 답안을 생성합니다</p>
            </div>
          </div>
          {!modelAnswer && !isGeneratingAnswer ? (
            <button
              onClick={generateModelAnswer}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              모범 답안 생성
            </button>
          ) : (
            <button
              onClick={() => setShowModelAnswer(!showModelAnswer)}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-xl transition-all duration-200 font-medium flex items-center gap-2"
            >
              {showModelAnswer ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  접기
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  펼치기
                </>
              )}
            </button>
          )}
        </div>

        {/* Model Answer Content */}
        {showModelAnswer && (
          <div className="mt-6 animate-fadeIn">
            {isGeneratingAnswer ? (
              <div className="bg-gray-900/80 rounded-xl p-8 border border-gray-700">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin opacity-30" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-white font-medium mb-2">모범 답안을 생성하고 있습니다</p>
                  <p className="text-sm text-gray-400">
                    평가위원들의 피드백을 분석하여 강점은 유지하고 약점을 보완합니다...
                  </p>
                </div>
              </div>
            ) : generationError ? (
              <div className="bg-red-900/30 rounded-xl p-6 border border-red-700/50">
                <div className="flex items-center gap-3 text-red-400">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{generationError}</span>
                </div>
                <button
                  onClick={generateModelAnswer}
                  className="mt-4 px-4 py-2 bg-red-800/50 hover:bg-red-700/50 rounded-lg text-red-300 text-sm transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : modelAnswer ? (
              <div className="bg-gray-900/80 rounded-xl border border-gray-700 overflow-hidden">
                {/* 모범답안 헤더 */}
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-white font-medium">피드백 반영 수정 답안</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      평가위원 피드백 기반
                    </span>
                  </div>
                </div>

                {/* 모범답안 내용 */}
                <div className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {modelAnswer}
                    </div>
                  </div>
                </div>

                {/* 복사 버튼 */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    본 답안은 AI가 생성한 참고용 답안입니다.
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(modelAnswer)
                      alert('모범 답안이 클립보드에 복사되었습니다.')
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    복사하기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* OCR Result Toggle */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowOCR(!showOCR)}
          className="w-full p-5 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <span className="font-medium text-gray-300">OCR 추출 텍스트 확인</span>
          </div>
          <span className={`text-gray-500 transition-transform duration-200 ${showOCR ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
        {showOCR && (
          <div className="p-5 border-t border-gray-800 bg-gray-800/50 animate-fadeIn">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
              {extractedText}
            </pre>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl text-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          결과 인쇄
        </button>
        <button
          onClick={() => {
            const data = JSON.stringify(result, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `evaluation-result-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          결과 저장
        </button>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-800">
        본 평가는 AI 기반 참고용 평가이며, 실제 시험 결과와 다를 수 있습니다.
      </div>
    </div>
  )
}
