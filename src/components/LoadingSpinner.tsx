'use client'

interface LoadingSpinnerProps {
  stage: 'ocr' | 'evaluating' | 'analyzing'
}

const stageInfo = {
  ocr: {
    title: '답안지 분석 중...',
    description: '손글씨를 텍스트로 변환하고 있습니다.',
    icon: '🔍',
  },
  evaluating: {
    title: '3인 평가위원 평가 중...',
    description: '세 명의 AI 평가위원이 답안을 검토하고 있습니다.',
    icon: '👨‍⚖️',
  },
  analyzing: {
    title: '종합 분석 중...',
    description: '평가 결과를 종합하고 학습 가이드를 생성하고 있습니다.',
    icon: '📊',
  },
}

export default function LoadingSpinner({ stage }: LoadingSpinnerProps) {
  const info = stageInfo[stage]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Animated Icon */}
          <div className="text-6xl animate-bounce">{info.icon}</div>

          {/* Loading Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{info.title}</h3>
            <p className="text-gray-500 mt-2">{info.description}</p>
          </div>

          {/* Progress Stages */}
          <div className="flex justify-center space-x-4 pt-4">
            {Object.keys(stageInfo).map((s, index) => (
              <div
                key={s}
                className={`flex items-center ${index < Object.keys(stageInfo).length - 1 ? 'space-x-4' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${s === stage
                      ? 'bg-blue-500 text-white animate-pulse'
                      : Object.keys(stageInfo).indexOf(s) < Object.keys(stageInfo).indexOf(stage)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {Object.keys(stageInfo).indexOf(s) < Object.keys(stageInfo).indexOf(stage)
                    ? '✓'
                    : index + 1
                  }
                </div>
                {index < Object.keys(stageInfo).length - 1 && (
                  <div
                    className={`w-8 h-1 ${
                      Object.keys(stageInfo).indexOf(s) < Object.keys(stageInfo).indexOf(stage)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
