import { NextRequest, NextResponse } from 'next/server'
import { EvaluationResult, EvaluatorType, APIResponse, ComprehensiveResult, StructureAnalysis } from '@/types'
import { evaluators, getEvaluatorPrompt, getComprehensiveAnalysisPrompt, getStructureAnalysisPrompt } from '@/lib/evaluators'

// Step 1: 구조 분석
async function analyzeStructure(
  extractedText: string,
  apiKey: string
): Promise<StructureAnalysis> {
  const stepStart = Date.now()
  const prompt = getStructureAnalysisPrompt(extractedText)

  console.log('=== 구조 분석 시작 ===')
  console.log(`입력 텍스트 길이: ${extractedText.length}자`)
  console.log(`프롬프트 길이: ${prompt.length}자`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Structure Analysis Error:', error)
    throw new Error('구조 분석 중 오류가 발생했습니다.')
  }

  const apiTime = Date.now() - stepStart
  console.log(`API 응답 시간: ${apiTime}ms`)

  const data = await response.json()
  const content = data.content[0]?.text

  console.log(`응답 토큰: 입력=${data.usage?.input_tokens}, 출력=${data.usage?.output_tokens}`)
  console.log(`응답 길이: ${content?.length || 0}자`)

  if (!content) {
    throw new Error('구조 분석 결과를 가져올 수 없습니다.')
  }

  // JSON 파싱 (마크다운 코드 블록 제거)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('구조 분석 응답 형식이 올바르지 않습니다.')
  }

  const totalTime = Date.now() - stepStart
  console.log(`=== 구조 분석 완료: ${totalTime}ms ===\n`)

  return JSON.parse(jsonMatch[0])
}

// Step 2: 평가위원 평가 (구조 분석 결과 포함)
async function evaluateWithAI(
  evaluatorId: EvaluatorType,
  extractedText: string,
  structureAnalysis: StructureAnalysis,
  apiKey: string
): Promise<EvaluationResult> {
  const stepStart = Date.now()
  const evaluator = evaluators[evaluatorId]
  const prompt = getEvaluatorPrompt(evaluator, extractedText, structureAnalysis)

  console.log(`=== 평가위원 ${evaluatorId} 시작 ===`)
  console.log(`프롬프트 길이: ${prompt.length}자`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  const apiTime = Date.now() - stepStart
  console.log(`평가위원 ${evaluatorId} API 응답 시간: ${apiTime}ms`)

  if (!response.ok) {
    const error = await response.text()
    console.error(`Evaluator ${evaluatorId} Error:`, error)
    throw new Error(`평가위원 ${evaluatorId} 평가 중 오류가 발생했습니다.`)
  }

  const data = await response.json()
  const content = data.content[0]?.text

  console.log(`평가위원 ${evaluatorId} 토큰: 입력=${data.usage?.input_tokens}, 출력=${data.usage?.output_tokens}`)
  console.log(`평가위원 ${evaluatorId} 응답 길이: ${content?.length || 0}자`)

  if (!content) {
    throw new Error(`평가위원 ${evaluatorId}의 평가 결과를 가져올 수 없습니다.`)
  }

  // JSON 파싱 (마크다운 코드 블록 제거)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`평가위원 ${evaluatorId}의 응답 형식이 올바르지 않습니다.`)
  }

  const totalTime = Date.now() - stepStart
  console.log(`=== 평가위원 ${evaluatorId} 완료: ${totalTime}ms ===\n`)

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

async function getComprehensiveAnalysis(
  evaluations: EvaluationResult[],
  apiKey: string
): Promise<Omit<ComprehensiveResult, 'evaluations'>> {
  const stepStart = Date.now()

  const evaluationsText = evaluations
    .map((e) => {
      return `[평가위원 ${e.evaluatorId}]
점수: ${e.score}/100
강점: ${e.strengths.join(', ')}
약점: ${e.weaknesses.join(', ')}
코멘트: ${e.comment}`
    })
    .join('\n\n')

  const prompt = getComprehensiveAnalysisPrompt(evaluationsText)

  console.log('=== 종합 분석 시작 ===')
  console.log(`프롬프트 길이: ${prompt.length}자`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  const apiTime = Date.now() - stepStart
  console.log(`종합 분석 API 응답 시간: ${apiTime}ms`)

  if (!response.ok) {
    const error = await response.text()
    console.error('Comprehensive Analysis Error:', error)
    throw new Error('종합 분석 중 오류가 발생했습니다.')
  }

  const data = await response.json()
  const content = data.content[0]?.text

  console.log(`종합 분석 토큰: 입력=${data.usage?.input_tokens}, 출력=${data.usage?.output_tokens}`)
  console.log(`종합 분석 응답 길이: ${content?.length || 0}자`)

  if (!content) {
    throw new Error('종합 분석 결과를 가져올 수 없습니다.')
  }

  // JSON 파싱 (마크다운 코드 블록 제거)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('종합 분석 응답 형식이 올바르지 않습니다.')
  }

  const totalTime = Date.now() - stepStart
  console.log(`=== 종합 분석 완료: ${totalTime}ms ===\n`)

  return JSON.parse(jsonMatch[0])
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<ComprehensiveResult>>> {
  try {
    const { extractedText } = await request.json()

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        error: '분석할 텍스트가 제공되지 않았습니다.',
      }, { status: 400 })
    }

    // 3개의 API 키 (각 평가위원별로 다른 키 사용하여 병렬 처리 최적화)
    const apiKeys = [
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_API_KEY_2,
      process.env.ANTHROPIC_API_KEY_3,
    ].filter(Boolean) as string[]

    if (apiKeys.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic API 키가 설정되지 않았습니다.',
      }, { status: 500 })
    }

    // API 키가 부족하면 첫 번째 키로 채움
    while (apiKeys.length < 3) {
      apiKeys.push(apiKeys[0])
    }

    const startTime = Date.now()

    console.log('\n' + '='.repeat(60))
    console.log('📊 평가 프로세스 시작')
    console.log('='.repeat(60))
    console.log(`시작 시간: ${new Date().toISOString()}`)
    console.log(`API 키 개수: ${apiKeys.length}개`)

    // Step 1: 구조 분석 (평가 전 사전 분석)
    console.log('\n📌 Step 1: 구조 분석')
    const step1Start = Date.now()
    const structureAnalysis = await analyzeStructure(extractedText, apiKeys[0])
    const step1Time = Date.now() - step1Start
    console.log(`✅ 구조 분석 결과: ${structureAnalysis.detectedField}, 점수: ${structureAnalysis.overallStructureScore}`)
    console.log(`⏱️  Step 1 총 소요시간: ${step1Time}ms`)

    // Step 2: 3명의 평가위원 병렬 평가 (각각 다른 API 키 사용)
    console.log('\n📌 Step 2: 평가위원 병렬 평가')
    const step2Start = Date.now()
    const evaluatorConfigs: { id: EvaluatorType; apiKey: string }[] = [
      { id: 'A', apiKey: apiKeys[0] },
      { id: 'B', apiKey: apiKeys[1] },
      { id: 'C', apiKey: apiKeys[2] },
    ]

    const evaluationPromises = evaluatorConfigs.map(({ id, apiKey }) =>
      evaluateWithAI(id, extractedText, structureAnalysis, apiKey)
    )

    const evaluations = await Promise.all(evaluationPromises)
    const step2Time = Date.now() - step2Start
    console.log(`✅ 평가위원 점수: A=${evaluations[0].score}, B=${evaluations[1].score}, C=${evaluations[2].score}`)
    console.log(`⏱️  Step 2 총 소요시간: ${step2Time}ms (병렬 처리)`)

    // 종합 분석
    console.log('\n📌 Step 3: 종합 분석')
    const step3Start = Date.now()
    const comprehensiveAnalysis = await getComprehensiveAnalysis(
      evaluations,
      apiKeys[0]
    )
    const step3Time = Date.now() - step3Start
    console.log(`⏱️  Step 3 총 소요시간: ${step3Time}ms`)

    const totalTime = Date.now() - startTime
    console.log('\n' + '='.repeat(60))
    console.log('📊 평가 프로세스 완료')
    console.log('='.repeat(60))
    console.log(`Step 1 (구조 분석):    ${step1Time}ms`)
    console.log(`Step 2 (평가위원):     ${step2Time}ms`)
    console.log(`Step 3 (종합 분석):    ${step3Time}ms`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🏁 총 소요시간:         ${totalTime}ms (${(totalTime/1000).toFixed(1)}초)`)
    console.log('='.repeat(60) + '\n')

    const result: ComprehensiveResult = {
      ...comprehensiveAnalysis,
      evaluations,
      structureAnalysis, // 구조 분석 결과 포함
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
