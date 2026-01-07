'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for ShaderCanvas to avoid SSR issues with WebGL
const ShaderCanvas = dynamic(() => import('@/components/ShaderCanvas'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 bg-gray-800 rounded-full animate-pulse" />,
})

// 스크롤 애니메이션 훅
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// 기능 데이터
const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'AI 손글씨 인식',
    description: '사진만 찍으면 끝. Google Vision AI가 손글씨를 98% 정확도로 인식합니다.',
    color: 'indigo',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: '3인 AI 평가위원',
    description: '실제 채점관처럼 이론·실무·구조를 각각 다른 관점에서 평가합니다.',
    color: 'purple',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: '실시간 평가',
    description: 'SSE 스트리밍으로 실시간으로 평가 진행 상황을 확인할 수 있습니다.',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: '5개 영역 점수 분석',
    description: '이론·실무·구조·표현력·완성도를 100점 만점으로 정량화해 드립니다.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'AI 모범 답안 제공',
    description: '같은 문제에 대해 80점 이상 받을 수 있는 모범 답안을 생성해 드립니다.',
    color: 'pink',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '합격 맞춤 학습 전략',
    description: '당신의 취약점을 정확히 분석하고, 단기간 점수를 올릴 학습법을 제안합니다.',
    color: 'amber',
  },
]

// 평가위원 데이터
const evaluators = [
  {
    id: 'A',
    name: '김학술',
    persona: '이론 전문가형',
    description: '기술 개념과 이론의 정확성을 평가합니다. "이 원리의 수학적 근거는?", "최신 표준과 일치하는가?"를 묻습니다. 이론 깊이와 논리적 엄밀성에 가장 높은 가중치를 둡니다.',
    shaderId: 2,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'B',
    name: '박실무',
    persona: '실무 전문가형',
    description: '현장 적용 가능성을 중점 평가합니다. "이 방법이 실제로 작동하는가?", "비용과 일정은 현실적인가?"를 검증합니다. 20년 경력 프로젝트 매니저의 시각으로 답안을 검토합니다.',
    shaderId: 2,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'C',
    name: '이균형',
    persona: '합격 전략형',
    description: '실제 채점 기준에 맞춰 평가합니다. "핵심 키워드가 포함되었는가?", "답안 구조가 채점자 친화적인가?"를 분석합니다. 과년도 출제위원 경력을 바탕으로 합격 확률을 예측합니다.',
    shaderId: 2,
    color: 'from-purple-500 to-indigo-600',
  },
]

// 기술사 분야 카테고리
const fieldCategories = [
  { name: '정보통신', fields: ['정보관리기술사', '컴퓨터시스템응용기술사', '정보통신기술사'], icon: '💻' },
  { name: '전기·전자', fields: ['전자응용기술사', '전기응용기술사', '전기철도기술사'], icon: '⚡' },
  { name: '기계·건설', fields: ['기계기술사', '토목구조기술사', '건축시공기술사', '건축구조기술사'], icon: '🏗️' },
  { name: '화학·환경', fields: ['화공기술사', '대기관리기술사', '수질관리기술사'], icon: '🧪' },
  { name: '안전·품질', fields: ['산업안전기술사', '건설안전기술사', '소방기술사', '품질관리기술사'], icon: '🛡️' },
]

// 사용 방법 단계
const steps = [
  {
    num: '01',
    title: '답안지 업로드',
    description: '손글씨로 작성한 답안지 사진을 업로드합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'OCR 텍스트 변환',
    description: 'AI가 손글씨를 인식하여 텍스트로 변환합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: '3인 AI 평가',
    description: '3명의 AI 평가위원이 병렬로 평가를 진행합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    num: '04',
    title: '결과 확인',
    description: '종합 점수, 상세 피드백, 학습 가이드를 확인합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  const featuresAnim = useScrollAnimation()
  const howItWorksAnim = useScrollAnimation()
  const evaluatorsAnim = useScrollAnimation()
  const fieldsAnim = useScrollAnimation()
  const ctaAnim = useScrollAnimation()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* 배경 글로우 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Shader 이펙트 */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl scale-150" />
            <ShaderCanvas size={400} shaderId={2} isActive={true} />
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-3 animate-fadeIn">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              PEEX
            </span>
            <span className="text-white ml-4">AI</span>
          </h1>

          <p className="text-sm text-gray-500 tracking-[0.3em] uppercase mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Professional Engineer Examiner AI
          </p>

          {/* 서브 타이틀 */}
          <h2 className="text-2xl md:text-3xl font-medium text-center mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
              기술사 합격률 15%, 당신의 답안은 합격권인가요?
            </span>
          </h2>

          <p className="text-gray-400 text-lg text-center max-w-2xl mb-10 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            3명의 AI 평가위원이 실제 채점 기준으로 답안을 분석하고,<br />
            <span className="text-blue-400 font-semibold">합격을 위해 반드시 개선해야 할 포인트</span>를 알려드립니다
          </p>

          {/* CTA 버튼 */}
          <Link href="/evaluate" className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <button className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3">
                지금 시작하기
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-8 animate-bounce">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresAnim.ref}
        className={`py-24 px-6 transition-all duration-700 ${
          featuresAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            혼자서는 알 수 없는 <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">답안의 약점</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            스터디 없이도, 학원 없이도 전문가급 피드백을 받을 수 있습니다.<br />
            <span className="text-white font-semibold">단 3분이면 답안 분석이 완료</span>됩니다.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800/50 p-8 hover:border-${feature.color}-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-${feature.color}-500/10`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-600/20 to-${feature.color}-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 text-${feature.color}-400`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        ref={howItWorksAnim.ref}
        className={`py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900 transition-all duration-700 ${
          howItWorksAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            어떻게 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">사용하나요?</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            간단한 4단계로 전문적인 AI 평가를 받아보세요
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.num} className="relative">
                {/* 연결선 */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}

                <div className="flex flex-col items-center text-center group">
                  {/* 번호 */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl group-hover:bg-purple-500/30 transition-colors" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 border-2 border-purple-500 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">
                      {step.num}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Evaluators Section */}
      <section
        ref={evaluatorsAnim.ref}
        className={`py-24 px-6 transition-all duration-700 ${
          evaluatorsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            실제 채점관처럼 평가하는 <span className="bg-gradient-to-r from-green-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">3인의 AI</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            학술·실무·합격 전략, 세 가지 관점에서 당신의 답안을 동시에 평가합니다.<br />
            <span className="text-white font-semibold">한 명의 의견이 아닌, 3명의 합의된 평가</span>를 받아보세요.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {evaluators.map((evaluator, index) => (
              <div
                key={evaluator.id}
                className="group flex flex-col items-center text-center p-8 rounded-3xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-500"
              >
                {/* Shader 이펙트 */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${evaluator.color} rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <ShaderCanvas size={200} shaderId={evaluator.shaderId} isActive={true} timeOffset={index * 3.3} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{evaluator.name}</h3>
                <p className={`text-sm font-semibold mb-4 bg-gradient-to-r ${evaluator.color} bg-clip-text text-transparent`}>
                  {evaluator.persona}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">{evaluator.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Fields Section */}
      <section
        ref={fieldsAnim.ref}
        className={`py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-950 transition-all duration-700 ${
          fieldsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            다양한 <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">기술사 종목</span> 지원
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            24개 이상의 국가기술자격 기술사 종목을 평가할 수 있습니다
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fieldCategories.map((category) => (
              <div
                key={category.name}
                className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800/50 p-6 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-bold text-white">{category.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.fields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-lg border border-gray-700/50"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm">
            이 외에도 측량및지형공간정보기술사, 발송배전기술사 등 다양한 종목을 지원합니다
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        ref={ctaAnim.ref}
        className={`py-32 px-6 relative overflow-hidden transition-all duration-700 ${
          ctaAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* 배경 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            합격까지 몇 점 부족한가요?{' '}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              지금 바로 확인
            </span>
            하세요
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            답안 사진 1장이면 충분합니다. 3분 안에 정확한 평가 결과를 받아보세요.<br />
            <span className="text-white font-semibold">완전 무료, 회원가입 불필요</span>
          </p>

          <Link href="/evaluate">
            <button className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3">
                내 답안 평가받기 →
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PEEX
            </span>
            <span className="text-white font-bold">AI</span>
          </div>
          <p className="text-gray-500 text-sm">
            Powered by Google Vision AI & Gemini
          </p>
        </div>
      </footer>
    </div>
  )
}
