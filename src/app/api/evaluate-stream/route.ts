import { NextRequest } from 'next/server'
import { EvaluationResult, EvaluatorType, EngineerField } from '@/types'
import { evaluators, getEvaluatorPromptWithField, getComprehensiveAnalysisPrompt } from '@/lib/evaluators'

// SSE 이벤트 타입 정의
type SSEEventType =
  | 'start'
  | 'evaluator-start'
  | 'evaluator-complete'
  | 'comprehensive-start'
  | 'comprehensive-complete'
  | 'complete'
  | 'error'

interface SSEEvent {
  type: SSEEventType
  data?: unknown
  evaluatorId?: string
}

function sendSSE(controller: ReadableStreamDefaultController, event: SSEEvent) {
  const data = JSON.stringify(event)
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
}

// Gemini API 호출 함수 (Gemini 2.5 Flash 사용)
async function callGemini(prompt: string, apiKey: string, maxTokens: number = 8192): Promise<string> {
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
    console.error('Gemini API Error Response:', error)
    console.error('Gemini API Status:', response.status)
    throw new Error(`Gemini API 호출 중 오류가 발생했습니다: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    console.error('Gemini API 응답 구조:', JSON.stringify(data, null, 2))
    throw new Error('Gemini API 응답을 가져올 수 없습니다.')
  }

  return content
}

// 평가위원 평가 (선택된 기술사 종목 사용)
async function evaluateWithAI(
  evaluatorId: EvaluatorType,
  extractedText: string,
  selectedField: EngineerField,
  apiKey: string
): Promise<EvaluationResult> {
  const evaluator = evaluators[evaluatorId]
  // 선택된 기술사 종목을 포함하여 프롬프트 생성
  const prompt = getEvaluatorPromptWithField(evaluator, extractedText, selectedField)
  const content = await callGemini(prompt, apiKey, 8192)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`평가위원 ${evaluatorId}의 응답 형식이 올바르지 않습니다.`)
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

// 종합 분석
async function getComprehensiveAnalysis(
  evaluations: EvaluationResult[],
  apiKey: string
) {
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
  const content = await callGemini(prompt, apiKey, 4096)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('종합 분석 응답 형식이 올바르지 않습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  const { extractedText, selectedField } = await request.json()

  if (!extractedText) {
    return new Response(JSON.stringify({ error: '분석할 텍스트가 제공되지 않았습니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!selectedField) {
    return new Response(JSON.stringify({ error: '기술사 종목이 선택되지 않았습니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Google Gemini API 키 사용
  const apiKeys = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_2,
    process.env.GOOGLE_API_KEY_3,
  ].filter(Boolean) as string[]

  if (apiKeys.length === 0) {
    return new Response(JSON.stringify({ error: 'Google API 키가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  while (apiKeys.length < 3) {
    apiKeys.push(apiKeys[0])
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 시작 이벤트
        sendSSE(controller, { type: 'start' })

        // 평가위원 병렬 평가 (선택된 기술사 종목 사용)
        const evaluatorConfigs: { id: EvaluatorType; apiKey: string }[] = [
          { id: 'A', apiKey: apiKeys[0] },
          { id: 'B', apiKey: apiKeys[1] },
          { id: 'C', apiKey: apiKeys[2] },
        ]

        // 모든 평가위원 시작 알림
        evaluatorConfigs.forEach(({ id }) => {
          sendSSE(controller, { type: 'evaluator-start', evaluatorId: id })
        })

        // 병렬로 실행하되 각각 완료 시 이벤트 전송
        const evaluations: EvaluationResult[] = []
        const promises = evaluatorConfigs.map(async ({ id, apiKey }) => {
          const result = await evaluateWithAI(id, extractedText, selectedField, apiKey)
          evaluations.push(result)
          sendSSE(controller, { type: 'evaluator-complete', evaluatorId: id, data: result })
          return result
        })

        await Promise.all(promises)

        // 평가 결과 정렬 (A, B, C 순서)
        evaluations.sort((a, b) => a.evaluatorId.localeCompare(b.evaluatorId))

        // 종합 분석
        sendSSE(controller, { type: 'comprehensive-start' })
        const comprehensiveAnalysis = await getComprehensiveAnalysis(evaluations, apiKeys[0])
        sendSSE(controller, { type: 'comprehensive-complete', data: comprehensiveAnalysis })

        // 최종 결과
        const result = {
          ...comprehensiveAnalysis,
          evaluations,
          selectedField,
        }

        sendSSE(controller, { type: 'complete', data: result })
        controller.close()
      } catch (error) {
        sendSSE(controller, {
          type: 'error',
          data: { message: error instanceof Error ? error.message : '평가 중 오류가 발생했습니다.' }
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
