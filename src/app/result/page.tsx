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

      {/* Model Answer Button */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI 모범 답안</h3>
              <p className="text-sm text-gray-400">평가 결과를 바탕으로 생성된 최적의 답안을 확인하세요</p>
            </div>
          </div>
          <button
            onClick={() => setShowModelAnswer(!showModelAnswer)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {showModelAnswer ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                닫기
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                모범 답안 보기
              </>
            )}
          </button>
        </div>

        {/* Model Answer Content */}
        {showModelAnswer && (
          <div className="mt-6 animate-fadeIn">
            <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700">
              <div className="prose prose-invert max-w-none">
                {result.modelAnswer ? (
                  <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {result.modelAnswer}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 mb-4">모범 답안을 생성 중입니다...</p>
                    <p className="text-sm text-gray-500">
                      평가 결과의 강점을 유지하고 약점을 보완한 최적의 답안이 제공됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {result.modelAnswer && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.modelAnswer || '')
                    alert('모범 답안이 클립보드에 복사되었습니다.')
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  복사하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
