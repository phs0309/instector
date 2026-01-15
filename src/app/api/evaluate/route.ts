import { NextRequest, NextResponse } from 'next/server'
import { EvaluationResult, EvaluatorType, APIResponse, ComprehensiveResult, EngineerField, AIModel } from '@/types'
import { evaluators, getEvaluatorPromptWithField, getComprehensiveAnalysisPrompt } from '@/lib/evaluators'

// GPT 평가용 시스템 프롬프트 (GPT_prompt.txt에서 로드)
const GPT_SYSTEM_PROMPT = `대한민국 기술사 시험 답안 채점 시스템 프롬프트
1. 역할 정의 (Role)

당신은 대한민국 국가기술자격 기술사 시험 답안을 채점하는 전문 평가관이다.
당신의 역할은 수험생의 답안을 실제 기술사 시험 채점 기준에 최대한 근접하게 평가하고, 합격 가능성 관점에서 점수·수준·보완 방향을 제시하는 것이다.

당신은 강의자, 코치, 멘토가 아니다.
당신은 채점자이며, 평가 기준은 오직 "기술사 시험에서 통과 가능한 답안인가"이다.

2. 채점 철학 (Evaluation Philosophy)

기술사 답안은 지식의 나열이 아니라 사고 구조의 표현이다.

"맞는 말"보다 **"기술사스럽게 정리된 말"**을 더 높이 평가한다.

채점은 관대하지도, 교육적으로도 하지 않는다.
→ 실제 시험과 동일하게 구조·완성도·통제력 중심으로 감점한다.

부분 점수는 존재하지만, 구조가 무너지면 상한선이 명확히 존재한다.

그림·표·도식은 미적 요소가 아니라 사고 압축 도구로 평가한다.

3. 기본 채점 기준 (Scoring Framework)
① 구조 점수 (최우선, 약 40%)

서론–본론–결론 또는 정의–원리–적용–한계의 구조적 완결성

문항 요구사항을 빠짐없이 구조로 반영했는가

답안 전체 흐름이 "기술사 사고 루틴"에 맞는가

② 내용 점수 (약 35%)

핵심 개념의 정확성

기술적 용어 사용의 적절성

과도한 설명 없이 핵심 위주로 압축되었는가

③ 표현·가독성 점수 (약 15%)

문장 길이의 통제

항목화, 번호화, 줄바꿈의 적절성

채점자가 빠르게 읽고 구조를 인식할 수 있는가

④ 도식·보조자료 점수 (약 10%)

그림/표/수식이 본문 논리를 보조하는가

설명 없는 장식용 그림은 점수에 거의 기여하지 않음

단순해도 의미 전달이 명확하면 가산

4. 점수 분포 원칙 (Score Distribution)

40점대: 구조 부재, 서술형 메모 수준

50점대: 개념은 있으나 구조 미흡, 불안정

60~65점: 최소 합격권 (구조 성립, 내용 일부 부족)

70점대: 안정적 구조 + 기술사다운 압축

80점 이상: 실제 시험에서도 상위 답안 수준

※ 구조가 무너지면 내용이 좋아도 60점 초과 불가

5. 감점 성향 (Penalty Rules)

다음 항목은 반복적으로 강하게 감점한다.

문제 요구사항 누락

문단형 장문 서술 (항목화 부족)

정의 없이 바로 설명 시작

키워드 나열식 답안

그림만 있고 설명이 없는 경우

시험장에서 쓰기 어려운 과도한 분량

6. 선호하는 답안 구조 (Preferred Structure)

기본 권장 구조는 다음 중 하나를 따른다.

정의 → 원리 → 구성요소 → 적용/사례 → 한계/유의점

개요 → 메커니즘 → 설계/운영 포인트 → 문제점 → 대책

분류 → 각 항목별 핵심 설명 → 종합 정리

※ 문제 유형에 따라 구조 변형은 허용하되, 일관된 사고 흐름은 필수

7. 말투 및 평가 스타일 (Tone & Style)

단정적, 평가자 시점

불필요한 미사여구 금지

"~로 볼 수 있다 / ~수준이다 / ~가 부족하다"와 같은 판정형 문장 사용

위로, 격려, 학습 코칭 문구 사용 금지`

// OpenAI API 호출 함수 (GPT-5.2 사용, GPT_prompt.txt 시스템 프롬프트 적용)
async function callOpenAI(prompt: string, maxTokens: number = 8192): Promise<string> {
  const apiKey = process.env.CHATGPT_API_KEY

  console.log('\n🤖 OpenAI API 호출 시작')
  console.log(`   API Key 존재: ${apiKey ? '✓ (길이: ' + apiKey.length + ')' : '✗ 없음'}`)
  console.log(`   모델: gpt-4o`)
  console.log(`   max_tokens: ${maxTokens}`)

  if (!apiKey) {
    console.error('❌ CHATGPT_API_KEY 환경변수가 없습니다!')
    throw new Error('ChatGPT API 키가 설정되지 않았습니다.')
  }

  // 재시도 로직 (최대 3번)
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\n📡 OpenAI API 요청 시도 ${attempt}/3`)
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { role: 'system', content: GPT_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`\n❌ OpenAI API Error (attempt ${attempt}/3)`)
        console.error(`   Status: ${response.status}`)
        console.error(`   Response: ${errorText}`)

        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          continue
        }
        throw new Error(`OpenAI API 오류 (${response.status}): ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log(`✅ OpenAI API 응답 수신 (attempt ${attempt})`)

      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.error('❌ OpenAI API 응답에 content가 없습니다:', JSON.stringify(data, null, 2))
        throw new Error('OpenAI API 응답을 가져올 수 없습니다.')
      }

      return content
    } catch (error) {
      lastError = error as Error
      console.error(`❌ OpenAI API 예외 발생 (attempt ${attempt}/3):`, lastError.message)
      if (attempt < 3) {
        console.log(`⏳ 재시도 중... (${attempt}/3)`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
  }

  console.error('❌ OpenAI API 최종 실패:', lastError?.message)
  throw lastError || new Error('OpenAI API 호출 실패')
}

// Gemini API 호출 함수
async function callGemini(prompt: string, maxTokens: number = 8192): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('Google API 키가 설정되지 않았습니다.')
  }

  // 재시도 로직 (최대 3번)
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.7,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error(`Gemini API Error (attempt ${attempt}/3):`, error)

        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          continue
        }
        throw new Error(`Gemini API 호출 중 오류가 발생했습니다: ${response.status}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error('Gemini API 응답을 가져올 수 없습니다.')
      }

      return content
    } catch (error) {
      lastError = error as Error
      if (attempt < 3) {
        console.log(`재시도 중... (${attempt}/3)`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
  }

  throw lastError || new Error('Gemini API 호출 실패')
}

// 통합 AI 호출 함수 (모델 선택에 따라 분기)
async function callAI(prompt: string, aiModel: AIModel, maxTokens: number = 8192): Promise<string> {
  if (aiModel === 'gpt-4o') {
    // GPT-5.2 사용, GPT_prompt.txt 시스템 프롬프트 자동 적용
    return await callOpenAI(prompt, maxTokens)
  } else {
    return await callGemini(prompt, maxTokens)
  }
}

// 평가위원 평가 (선택된 기술사 종목 및 AI 모델 사용)
async function evaluateWithAI(
  evaluatorId: EvaluatorType,
  extractedText: string,
  selectedField: EngineerField,
  aiModel: AIModel
): Promise<EvaluationResult> {
  const evaluator = evaluators[evaluatorId]
  const prompt = getEvaluatorPromptWithField(evaluator, extractedText, selectedField)
  const content = await callAI(prompt, aiModel, 8192)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`평가위원의 응답 형식이 올바르지 않습니다.`)
  }

  const result = JSON.parse(jsonMatch[0])

  return {
    evaluatorId,
    score: result.score,
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    comment: result.comment || '',
    keyPoints: result.keyPoints || [],
    detailedFeedback: {
      theory: result.detailedFeedback?.theory || { score: 0, comment: '', quotes: [] },
      practical: result.detailedFeedback?.practical || { score: 0, comment: '', quotes: [] },
      structure: result.detailedFeedback?.structure || { score: 0, comment: '', quotes: [] },
      expression: result.detailedFeedback?.expression || { score: 0, comment: '', quotes: [] },
      completeness: result.detailedFeedback?.completeness || { score: 0, comment: '', quotes: [] },
    },
  }
}

// 종합 분석 (항상 Gemini 사용)
async function getComprehensiveAnalysis(
  evaluation: EvaluationResult
) {
  const evaluationText = `[AI 평가위원]
점수: ${evaluation.score}/100
강점: ${evaluation.strengths.join(', ')}
약점: ${evaluation.weaknesses.join(', ')}
코멘트: ${evaluation.comment}
세부 점수:
- 이론적 정확성: ${evaluation.detailedFeedback.theory.score}/20
- 실무 적용성: ${evaluation.detailedFeedback.practical.score}/20
- 답안 구조: ${evaluation.detailedFeedback.structure.score}/20
- 표현력: ${evaluation.detailedFeedback.expression.score}/20
- 완성도: ${evaluation.detailedFeedback.completeness.score}/20`

  const prompt = getComprehensiveAnalysisPrompt(evaluationText)
  // 종합 분석은 항상 Gemini로 처리
  const content = await callGemini(prompt, 4096)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('종합 분석 응답 형식이 올바르지 않습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<ComprehensiveResult>>> {
  try {
    const { extractedText, selectedField, aiModel = 'gpt-4o' } = await request.json()

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        error: '분석할 텍스트가 제공되지 않았습니다.',
      }, { status: 400 })
    }

    if (!selectedField) {
      return NextResponse.json({
        success: false,
        error: '기술사 종목이 선택되지 않았습니다.',
      }, { status: 400 })
    }

    // API 키 확인
    if (aiModel === 'gpt-4o' && !process.env.CHATGPT_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'ChatGPT API 키가 설정되지 않았습니다.',
      }, { status: 500 })
    }

    if (aiModel === 'gemini' && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Google API 키가 설정되지 않았습니다.',
      }, { status: 500 })
    }

    const startTime = Date.now()

    console.log('\n' + '='.repeat(60))
    console.log('📊 평가 프로세스 시작')
    console.log('='.repeat(60))
    console.log(`시작 시간: ${new Date().toISOString()}`)
    console.log(`AI 모델: ${aiModel}`)
    console.log(`기술사 종목: ${selectedField}`)

    // 1명 통합 평가위원 평가
    console.log('\n📌 Step 1: AI 평가위원 평가')
    const step1Start = Date.now()
    const evaluatorId: EvaluatorType = 'A'
    const evaluation = await evaluateWithAI(evaluatorId, extractedText, selectedField, aiModel as AIModel)
    const step1Time = Date.now() - step1Start
    console.log(`✅ 평가 완료: 점수 = ${evaluation.score}`)
    console.log(`⏱️  Step 1 소요시간: ${step1Time}ms`)

    // 평가 결과 상세 로그
    console.log('\n' + '-'.repeat(50))
    console.log('📋 AI 평가 결과 상세')
    console.log('-'.repeat(50))
    console.log(`총점: ${evaluation.score}/100`)
    console.log(`강점: ${evaluation.strengths.join(', ')}`)
    console.log(`약점: ${evaluation.weaknesses.join(', ')}`)
    console.log(`세부 점수:`)
    console.log(`  - 이론적 정확성: ${evaluation.detailedFeedback.theory.score}/20`)
    console.log(`  - 실무 적용성: ${evaluation.detailedFeedback.practical.score}/20`)
    console.log(`  - 답안 구조: ${evaluation.detailedFeedback.structure.score}/20`)
    console.log(`  - 표현력: ${evaluation.detailedFeedback.expression.score}/20`)
    console.log(`  - 완성도: ${evaluation.detailedFeedback.completeness.score}/20`)
    console.log(`총평: ${evaluation.comment.substring(0, 100)}...`)
    console.log('-'.repeat(50))

    // 종합 분석
    console.log('\n📌 Step 2: 종합 분석 (Gemini)')
    const step2Start = Date.now()
    const comprehensiveAnalysis = await getComprehensiveAnalysis(evaluation)
    const step2Time = Date.now() - step2Start
    console.log(`⏱️  Step 2 소요시간: ${step2Time}ms`)

    const totalTime = Date.now() - startTime
    console.log('\n' + '='.repeat(60))
    console.log('📊 평가 프로세스 완료')
    console.log('='.repeat(60))
    console.log(`Step 1 (평가):      ${step1Time}ms`)
    console.log(`Step 2 (종합 분석): ${step2Time}ms`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🏁 총 소요시간:      ${totalTime}ms (${(totalTime/1000).toFixed(1)}초)`)
    console.log('='.repeat(60) + '\n')

    const result: ComprehensiveResult = {
      ...comprehensiveAnalysis,
      evaluations: [evaluation],
      selectedField,
      aiModel,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Evaluation Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '평가 중 오류가 발생했습니다.',
    }, { status: 500 })
  }
}
