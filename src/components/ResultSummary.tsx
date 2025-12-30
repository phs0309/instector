'use client'

import { ComprehensiveResult } from '@/types'

interface ResultSummaryProps {
  result: ComprehensiveResult
}

export default function ResultSummary({ result }: ResultSummaryProps) {
  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'from-emerald-500 to-emerald-700'
    if (grade === 'B+' || grade === 'B') return 'from-blue-500 to-blue-700'
    if (grade === 'C') return 'from-amber-500 to-amber-700'
    return 'from-red-500 to-red-700'
  }

  const getPassStatusStyle = (status: string) => {
    if (status === '합격권') return 'bg-emerald-500 text-white'
    if (status === '경계선') return 'bg-amber-500 text-white'
    return 'bg-red-500 text-white'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return '우수한 답안입니다!'
    if (score >= 60) return '합격 수준의 답안입니다.'
    if (score >= 50) return '조금 더 보완이 필요합니다.'
    return '기초부터 다시 학습이 필요합니다.'
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
      {/* Score Header */}
      <div className={`bg-gradient-to-r ${getGradeColor(result.predictedGrade)} p-8`}>
        <div className="text-center text-white">
          {/* Score Circle */}
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-40 h-40">
              <circle
                className="text-white/20"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="62"
                cx="80"
                cy="80"
              />
              <circle
                className="text-white"
                strokeWidth="8"
                strokeDasharray={`${(result.averageScore / 100) * 390} 390`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="62"
                cx="80"
                cy="80"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-bold">{result.averageScore.toFixed(0)}</span>
              <span className="text-lg opacity-80">/ 100</span>
            </div>
          </div>

          {/* Grade & Status */}
          <div className="mt-6 flex justify-center items-center gap-4">
            <div className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm opacity-80">예상 등급</span>
              <span className="ml-2 text-2xl font-bold">{result.predictedGrade}</span>
            </div>
            <div className={`px-6 py-2 rounded-full font-semibold ${getPassStatusStyle(result.passStatus)}`}>
              {result.passStatus}
            </div>
          </div>

          {/* Message */}
          <p className="mt-4 text-white/90 text-lg">{getScoreMessage(result.averageScore)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Score Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">평가위원별 점수</h3>
          <div className="grid grid-cols-3 gap-4">
            {result.evaluations.map((eval_) => (
              <div key={eval_.evaluatorId} className="text-center p-4 bg-gray-800 rounded-xl">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                  {eval_.evaluatorId}
                </div>
                <div className="text-2xl font-bold text-white">{eval_.score}</div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-800" />

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-xl p-5 border border-emerald-800/50">
            <h3 className="font-bold text-emerald-300 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              종합 강점
            </h3>
            <ul className="space-y-3">
              {result.overallStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-emerald-700 text-emerald-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-emerald-200">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-red-900/30 to-rose-900/20 rounded-xl p-5 border border-red-800/50">
            <h3 className="font-bold text-red-300 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              종합 약점
            </h3>
            <ul className="space-y-3">
              {result.overallWeaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-red-700 text-red-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-red-200">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 rounded-xl p-5 border border-blue-800/50">
          <h3 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            구체적 개선 방향
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {result.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-800/60 rounded-lg p-3">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-blue-200 text-sm">{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
