'use client'

import { useState } from 'react'
import { EvaluationResult, DetailedScore } from '@/types'
import { evaluators } from '@/lib/evaluators'
import RadarChart from './RadarChart'

interface EvaluatorCardProps {
  evaluation: EvaluationResult
}

// 평가위원별 Shader ID 매핑 (더 이상 사용하지 않지만 호환성을 위해 유지)
const evaluatorShaderMap: Record<string, number> = {
  'A': 1, // 초록색 (학자형)
  'B': 2, // 남색 (실무형)
  'C': 3, // 핑크색 (교육자형)
}

// 평가위원별 색상
const evaluatorColorMap: Record<string, string> = {
  'A': '#22c55e', // 초록색
  'B': '#6366f1', // 남색
  'C': '#ec4899', // 핑크색
}

export default function EvaluatorCard({ evaluation }: EvaluatorCardProps) {
  const evaluator = evaluators[evaluation.evaluatorId]
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30 border-green-700'
    if (score >= 60) return 'text-blue-400 bg-blue-900/30 border-blue-700'
    if (score >= 40) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700'
    return 'text-red-400 bg-red-900/30 border-red-700'
  }

  const getScoreBarColor = (score: number, max: number) => {
    const percentage = (score / max) * 100
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDetailScoreBar = (score: number, max: number = 20) => {
    const percentage = (score / max) * 100
    return (
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getScoreBarColor(score, max)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  const categories = [
    { key: 'theory', label: '이론적 정확성', icon: '📚', description: '핵심 개념과 원리에 대한 이해도' },
    { key: 'practical', label: '실무 적용성', icon: '💼', description: '현장에서의 활용 가능성' },
    { key: 'structure', label: '답안 구조', icon: '🏗️', description: '논리적 전개와 체계성' },
    { key: 'expression', label: '표현력', icon: '✍️', description: '명확하고 적절한 표현' },
    { key: 'completeness', label: '완성도', icon: '✅', description: '답안의 전체적인 완결성' },
  ]

  const renderDetailedSection = (key: string, detail: DetailedScore, label: string, icon: string, description: string) => {
    return (
      <div key={key} className="border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between bg-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div className="text-left">
              <div className="font-medium text-white">{label}</div>
              <div className="text-xs text-gray-400">{description}</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${detail.score >= 12 ? 'text-green-400' : detail.score >= 8 ? 'text-blue-400' : 'text-red-400'}`}>
              {detail.score}
            </span>
            <span className="text-gray-500 text-sm">/20</span>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4 border-t border-gray-700 bg-gray-800/50">
          {/* Score Bar */}
          <div className="pt-3">
            {getDetailScoreBar(detail.score)}
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-300">{detail.comment}</p>

          {/* Quotes */}
          {detail.quotes && detail.quotes.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">답안 인용 및 평가</div>
              {detail.quotes.map((q, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 ${q.isPositive ? 'bg-green-900/30 border-l-4 border-green-500' : 'bg-red-900/30 border-l-4 border-red-500'}`}
                >
                  <div className={`text-sm font-medium mb-1 ${q.isPositive ? 'text-green-300' : 'text-red-300'}`}>
                    &ldquo;{q.quote}&rdquo;
                  </div>
                  <div className={`text-xs ${q.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    → {q.evaluation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 사람 모양 아이콘 */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-500/50 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{evaluator.name}</h3>
              <p className="text-sm text-gray-400">{evaluator.persona}</p>
            </div>
          </div>
          <div className={`px-5 py-3 rounded-xl border-2 ${getScoreColor(evaluation.score)}`}>
            <span className="text-3xl font-bold">{evaluation.score}</span>
            <span className="text-sm ml-1 opacity-70">/ 100</span>
          </div>
        </div>
      </div>

      {/* Key Points */}
      {evaluation.keyPoints && evaluation.keyPoints.length > 0 && (
        <div className="px-5 py-4 bg-amber-900/20 border-b border-gray-800">
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wide mb-2">핵심 포인트</div>
          <div className="flex flex-wrap gap-2">
            {evaluation.keyPoints.map((point, i) => (
              <span key={i} className="px-3 py-1 bg-amber-900/30 text-amber-300 rounded-full text-sm font-medium">
                {point}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Detailed Scores - Toggle All */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-300">세부 평가 항목</div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              {isExpanded ? '세부 평가 접기' : '세부 평가 보기'}
            </button>
          </div>

          {/* Radar Chart */}
          <div className="flex justify-center mb-4">
            <RadarChart
              scores={{
                theory: evaluation.detailedFeedback.theory?.score || 0,
                practical: evaluation.detailedFeedback.practical?.score || 0,
                structure: evaluation.detailedFeedback.structure?.score || 0,
                expression: evaluation.detailedFeedback.expression?.score || 0,
                completeness: evaluation.detailedFeedback.completeness?.score || 0,
              }}
              size={240}
              color={evaluatorColorMap[evaluation.evaluatorId] || '#8b5cf6'}
            />
          </div>

          {/* Detailed sections (toggle) */}
          {isExpanded && (
            <div className="space-y-3">
              {categories.map(({ key, label, icon, description }) => {
                const detail = evaluation.detailedFeedback[key as keyof typeof evaluation.detailedFeedback]
                if (!detail) return null
                return renderDetailedSection(key, detail, label, icon, description)
              })}
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-900/20 rounded-xl p-4 border border-green-800/50">
            <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              강점
            </h4>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-300 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/50">
            <h4 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</span>
              보완점
            </h4>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comment */}
        <div className="bg-gray-800 rounded-xl p-4 border-l-4 border-gray-600">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">총평</div>
          <p className="text-gray-300 leading-relaxed">{evaluation.comment}</p>
        </div>
      </div>
    </div>
  )
}
