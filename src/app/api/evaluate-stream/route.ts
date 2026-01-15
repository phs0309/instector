import { NextRequest } from 'next/server'
import { EvaluationResult, EvaluatorType, EngineerField, AIModel } from '@/types'
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

// OpenAI API 호출 함수 (GPT-5.2 사용)
async function callOpenAI(prompt: string, systemPrompt: string, maxTokens: number = 8192): Promise<string> {
  const apiKey = process.env.CHATGPT_API_KEY

  console.log('\n🤖 OpenAI API 호출 시작 (evaluate-stream)')
  console.log(`   API Key 존재: ${apiKey ? '✓ (길이: ' + apiKey.length + ')' : '✗ 없음'}`)
  console.log(`   모델: gpt-5.2`)

  if (!apiKey) {
    throw new Error('ChatGPT API 키가 설정되지 않았습니다. (CHATGPT_API_KEY)')
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`OpenAI API Error (attempt ${attempt}/3):`, error)
        console.error('OpenAI API Status:', response.status)

        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          continue
        }
        throw new Error(`OpenAI API 호출 중 오류가 발생했습니다: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.error('OpenAI API 응답 구조:', JSON.stringify(data, null, 2))
        throw new Error('OpenAI API 응답을 가져올 수 없습니다.')
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

  throw lastError || new Error('OpenAI API 호출 실패')
}

// Gemini API 호출 함수 (Gemini 2.5 Flash 사용, 재시도 로직 포함)
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
        console.error('Gemini API Status:', response.status)

        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          continue
        }
        throw new Error(`Gemini API 호출 중 오류가 발생했습니다: ${response.status}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        console.error('Gemini API 응답 구조:', JSON.stringify(data, null, 2))
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
  const systemPrompt = '당신은 기술사 시험 답안 평가 전문가입니다. 요청된 형식에 맞게 정확히 응답하세요.'

  if (aiModel === 'gpt-4o') {
    return await callOpenAI(prompt, systemPrompt, maxTokens)
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

// 종합 분석
async function getComprehensiveAnalysis(
  evaluation: EvaluationResult,
  aiModel: AIModel
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
  const content = await callAI(prompt, aiModel, 4096)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('종합 분석 응답 형식이 올바르지 않습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  const { extractedText, selectedField, aiModel = 'gpt-4o' } = await request.json()

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

  // API 키 확인
  if (aiModel === 'gpt-4o' && !process.env.CHATGPT_API_KEY) {
    return new Response(JSON.stringify({ error: 'ChatGPT API 키가 설정되지 않았습니다. (CHATGPT_API_KEY)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (aiModel === 'gemini' && !process.env.GOOGLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Google API 키가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 시작 이벤트
        sendSSE(controller, { type: 'start', data: { aiModel } })

        // 1명의 통합 평가위원 평가
        const evaluatorId: EvaluatorType = 'A'
        sendSSE(controller, { type: 'evaluator-start', evaluatorId })

        const evaluation = await evaluateWithAI(evaluatorId, extractedText, selectedField, aiModel as AIModel)
        sendSSE(controller, { type: 'evaluator-complete', evaluatorId, data: evaluation })

        // 종합 분석
        sendSSE(controller, { type: 'comprehensive-start' })
        const comprehensiveAnalysis = await getComprehensiveAnalysis(evaluation, aiModel as AIModel)
        sendSSE(controller, { type: 'comprehensive-complete', data: comprehensiveAnalysis })

        // 최종 결과
        const result = {
          ...comprehensiveAnalysis,
          evaluations: [evaluation],
          selectedField,
          aiModel,
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
