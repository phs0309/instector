'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for ShaderCanvas to avoid SSR issues with WebGL
const ShaderCanvas = dynamic(() => import('@/components/ShaderCanvas'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 bg-zinc-800 rounded-full animate-pulse" />,
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
    description: 'Google Vision AI가 손글씨 답안을 정확하게 텍스트로 변환합니다.',
    color: 'indigo',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'GPT-4o / Gemini 선택',
    description: 'ChatGPT 또는 Gemini 중 원하는 AI 모델을 선택하여 평가받을 수 있습니다.',
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
    title: '상세 분석 리포트',
    description: '이론, 실무, 구조, 표현력, 완성도 5개 영역의 세부 점수를 제공합니다.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: '84개 기술사 종목',
    description: '건설, 안전, 기계, 전기, 정보통신 등 국가기술자격 84개 종목을 지원합니다.',
    color: 'pink',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '맞춤형 학습 가이드',
    description: '취약점 분석과 함께 합격을 위한 학습 방향을 제시합니다.',
    color: 'amber',
  },
]

// AI 모델 데이터
const aiModels = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT',
    fullName: 'GPT-4o',
    description: 'OpenAI의 최신 멀티모달 AI 모델로, 높은 정확도와 깊이 있는 분석을 제공합니다.',
    shaderId: 1,
    color: 'from-emerald-500 to-green-600',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    fullName: '2.5 Flash',
    description: 'Google의 빠르고 효율적인 AI 모델로, 신속한 평가와 정확한 피드백을 제공합니다.',
    shaderId: 2,
    color: 'from-blue-500 to-indigo-600',
  },
]

// 기술사 분야 카테고리 (84개 종목)
const fieldCategories = [
  { name: '건설 및 건축', count: 19, fields: ['건축시공기술사', '토목시공기술사', '토목구조기술사', '도시계획기술사'], icon: '🏗️' },
  { name: '안전관리 및 환경', count: 14, fields: ['소방기술사', '건설안전기술사', '수질관리기술사', '대기관리기술사'], icon: '🛡️' },
  { name: '기계 및 금속', count: 13, fields: ['기계기술사', '공조냉동기계기술사', '차량기술사', '조선기술사'], icon: '⚙️' },
  { name: '전기·전자·정보통신', count: 9, fields: ['정보관리기술사', '발송배전기술사', '전자응용기술사', '정보통신기술사'], icon: '💻' },
  { name: '화공·에너지·기타', count: 29, fields: ['화공기술사', '원자력발전기술사', '식품기술사', '품질관리기술사'], icon: '🧪' },
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
    title: 'AI 평가 진행',
    description: 'GPT-4o 또는 Gemini AI가 답안을 종합 평가합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

          <p className="text-sm text-zinc-500 tracking-[0.3em] uppercase mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Professional Engineer Examiner AI
          </p>

          {/* 서브 타이틀 */}
          <h2 className="text-2xl md:text-3xl font-medium text-center mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
              AI 기술사 답안 평가 서비스
            </span>
          </h2>

          <p className="text-zinc-400 text-lg text-center max-w-lg mb-10 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            GPT-4o 또는 Gemini AI가 당신의 기술사 답안을 종합적으로 평가합니다
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
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            왜 <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">PEEX AI</span>인가요?
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            기술사 시험 준비를 위한 가장 효과적인 AI 기반 평가 시스템
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl border border-zinc-700/50 p-8 hover:border-${feature.color}-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-${feature.color}-500/10`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-600/20 to-${feature.color}-600/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 text-${feature.color}-400`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
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
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
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
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-800 border-2 border-purple-500 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">
                      {step.num}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section
        ref={evaluatorsAnim.ref}
        className={`py-24 px-6 transition-all duration-700 ${
          evaluatorsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">AI 모델</span> 선택
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            ChatGPT (GPT-4o) 또는 Gemini 중 원하는 AI 모델을 선택하여 평가받을 수 있습니다
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {aiModels.map((model, index) => (
              <div
                key={model.id}
                className="group flex flex-col items-center text-center p-8 rounded-3xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-500"
              >
                {/* Shader 이펙트 */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${model.color} rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <ShaderCanvas size={180} shaderId={model.shaderId} isActive={true} timeOffset={index * 3.3} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{model.name}</h3>
                <p className={`text-sm font-semibold mb-4 bg-gradient-to-r ${model.color} bg-clip-text text-transparent`}>
                  {model.fullName}
                </p>
                <p className="text-zinc-400 text-sm leading-relaxed">{model.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Fields Section */}
      <section
        ref={fieldsAnim.ref}
        className={`py-24 px-6 bg-gradient-to-b from-zinc-800/50 to-zinc-900 transition-all duration-700 ${
          fieldsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">84개</span> 기술사 종목 지원
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
            국가기술자격 기술사 84개 전 종목을 평가할 수 있습니다
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fieldCategories.map((category) => (
              <div
                key={category.name}
                className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl border border-zinc-700/50 p-6 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                    <p className="text-xs text-zinc-500">{category.count}개 종목</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.fields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1.5 bg-zinc-700/50 text-zinc-300 text-sm rounded-lg border border-zinc-600/50"
                    >
                      {field}
                    </span>
                  ))}
                  <span className="px-3 py-1.5 text-zinc-500 text-sm">외 {category.count - 4}개...</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 mt-8 text-sm">
            건축, 토목, 안전, 환경, 기계, 전기, 정보통신 등 전 분야 기술사 종목을 지원합니다
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
            지금 바로{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI 평가
            </span>
            를 시작하세요
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            기술사 합격을 향한 첫 걸음, PEEX AI와 함께하세요.
            GPT-4o 또는 Gemini AI가 당신의 답안을 기다리고 있습니다.
          </p>

          <Link href="/evaluate">
            <button className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3">
                무료로 시작하기
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PEEX
            </span>
            <span className="text-white font-bold">AI</span>
          </div>
          <p className="text-zinc-500 text-sm">
            Powered by Google Vision AI & OpenAI GPT-4o / Gemini
          </p>
        </div>
      </footer>
    </div>
  )
}
