'use client'

import { ComprehensiveResult } from '@/types'

interface StudyGuideProps {
  studyGuide: ComprehensiveResult['studyGuide']
}

export default function StudyGuide({ studyGuide }: StudyGuideProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl border border-purple-800/50 p-6">
      <h2 className="text-xl font-bold text-purple-200 mb-6 flex items-center">
        <span className="text-2xl mr-2">📚</span>
        맞춤 학습 가이드
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Priority Topics */}
        <div className="bg-gray-900/80 rounded-xl p-4 shadow-sm border border-gray-800">
          <h3 className="font-bold text-purple-300 mb-3 flex items-center">
            <span className="w-8 h-8 bg-purple-900/50 rounded-full flex items-center justify-center mr-2">
              🎯
            </span>
            우선 학습 주제
          </h3>
          <ol className="space-y-2">
            {studyGuide.priority.map((topic, i) => (
              <li key={i} className="flex items-start">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-300">{topic}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Resources */}
        <div className="bg-gray-900/80 rounded-xl p-4 shadow-sm border border-gray-800">
          <h3 className="font-bold text-indigo-300 mb-3 flex items-center">
            <span className="w-8 h-8 bg-indigo-900/50 rounded-full flex items-center justify-center mr-2">
              📖
            </span>
            추천 학습 자료
          </h3>
          <ul className="space-y-2">
            {studyGuide.resources.map((resource, i) => (
              <li key={i} className="text-gray-300 flex items-start">
                <span className="text-indigo-400 mr-2">→</span>
                {resource}
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="bg-gray-900/80 rounded-xl p-4 shadow-sm border border-gray-800">
          <h3 className="font-bold text-blue-300 mb-3 flex items-center">
            <span className="w-8 h-8 bg-blue-900/50 rounded-full flex items-center justify-center mr-2">
              💡
            </span>
            학습 팁
          </h3>
          <ul className="space-y-2">
            {studyGuide.tips.map((tip, i) => (
              <li key={i} className="text-gray-300 flex items-start">
                <span className="text-blue-400 mr-2">★</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Motivation */}
      <div className="mt-6 text-center p-4 bg-gray-900/80 rounded-xl border border-gray-800">
        <p className="text-lg text-purple-300">
          🌟 <strong>꾸준한 연습이 합격의 지름길입니다!</strong> 🌟
        </p>
        <p className="text-sm text-gray-400 mt-2">
          위 학습 가이드를 참고하여 취약점을 보완해 나가세요.
        </p>
      </div>
    </div>
  )
}
