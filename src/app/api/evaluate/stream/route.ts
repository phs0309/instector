import { NextRequest } from 'next/server'
import { EvaluatorType, StructureAnalysis } from '@/types'
import { evaluators, getEvaluatorPrompt, getComprehensiveAnalysisPrompt, getStructureAnalysisPrompt } from '@/lib/evaluators'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StreamEvent {
  type: 'structure_start' | 'structure_complete' | 'evaluator_start' | 'evaluator_chunk' | 'evaluator_complete' | 'comprehensive_start' | 'comprehensive_chunk' | 'complete' | 'error'
  evaluatorId?: EvaluatorType
  content?: string
  data?: unknown
}

function createSSEMessage(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

// Step 1: 구조 분석 (스트리밍 없이 완료 후 결과 반환)
async function analyzeStructure(
  extractedText: string,
  apiKey: string
): Promise<StructureAnalysis> {
  const prompt = getStructureAnalysisPrompt(extractedText)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
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

  const data = await response.json()
  const content = data.content[0]?.text

  if (!content) {
    throw new Error('구조 분석 결과를 가져올 수 없습니다.')
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('구조 분석 응답 형식이 올바르지 않습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

// Step 2: 평가위원 스트리밍 평가 (구조 분석 결과 포함)
async function* streamEvaluator(
  evaluatorId: EvaluatorType,
  extractedText: string,
  structureAnalysis: StructureAnalysis,
  apiKey: string
): AsyncGenerator<StreamEvent> {
  const evaluator = evaluators[evaluatorId]
  const prompt = getEvaluatorPrompt(evaluator, extractedText, structureAnalysis)

  yield { type: 'evaluator_start', evaluatorId }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      stream: true,
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
    console.error(`Evaluator ${evaluatorId} Error:`, error)
    throw new Error(`평가위원 ${evaluatorId} 평가 중 오류가 발생했습니다.`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        if (line === 'data: [DONE]') continue

        try {
          const data = JSON.parse(line.slice(6))

          if (data.type === 'content_block_delta' && data.delta?.text) {
            const text = data.delta.text
            fullContent += text
            yield { type: 'evaluator_chunk', evaluatorId, content: text }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  // Parse the complete response
  const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`평가위원 ${evaluatorId}의 응답 형식이 올바르지 않습니다.`)
  }

  const result = JSON.parse(jsonMatch[0])

  yield {
    type: 'evaluator_complete',
    evaluatorId,
    data: {
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
    },
  }
}

async function* streamComprehensiveAnalysis(
  evaluationsText: string,
  apiKey: string
): AsyncGenerator<StreamEvent> {
  const prompt = getComprehensiveAnalysisPrompt(evaluationsText)

  yield { type: 'comprehensive_start' }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error('종합 분석 중 오류가 발생했습니다.')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        if (line === 'data: [DONE]') continue

        try {
          const data = JSON.parse(line.slice(6))

          if (data.type === 'content_block_delta' && data.delta?.text) {
            const text = data.delta.text
            fullContent += text
            yield { type: 'comprehensive_chunk', content: text }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('종합 분석 응답 형식이 올바르지 않습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  try {
    const { extractedText } = await request.json()

    if (!extractedText) {
      return new Response(
        createSSEMessage({ type: 'error', content: '분석할 텍스트가 제공되지 않았습니다.' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(
        createSSEMessage({ type: 'error', content: 'Anthropic API 키가 설정되지 않았습니다.' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    }

    const encoder = new TextEncoder()
    const evaluatorIds: EvaluatorType[] = ['A', 'B', 'C']
    const evaluations: Record<string, unknown> = {}

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: 구조 분석
          controller.enqueue(encoder.encode(createSSEMessage({ type: 'structure_start' })))
          const structureAnalysis = await analyzeStructure(extractedText, apiKey)
          controller.enqueue(encoder.encode(createSSEMessage({
            type: 'structure_complete',
            data: structureAnalysis
          })))

          // Step 2: Stream each evaluator sequentially (with structure analysis)
          for (const evaluatorId of evaluatorIds) {
            for await (const event of streamEvaluator(evaluatorId, extractedText, structureAnalysis, apiKey)) {
              controller.enqueue(encoder.encode(createSSEMessage(event)))

              if (event.type === 'evaluator_complete' && event.data) {
                evaluations[evaluatorId] = event.data
              }
            }
          }

          // Build evaluations text for comprehensive analysis
          const evaluationsText = Object.values(evaluations)
            .map((e: unknown) => {
              const eval_ = e as { evaluatorId: string; score: number; strengths: string[]; weaknesses: string[]; comment: string }
              return `[평가위원 ${eval_.evaluatorId}]
점수: ${eval_.score}/100
강점: ${eval_.strengths.join(', ')}
약점: ${eval_.weaknesses.join(', ')}
코멘트: ${eval_.comment}`
            })
            .join('\n\n')

          // Stream comprehensive analysis
          let comprehensiveResult = null
          for await (const event of streamComprehensiveAnalysis(evaluationsText, apiKey)) {
            controller.enqueue(encoder.encode(createSSEMessage(event)))
          }

          // Parse final comprehensive result
          const prompt = getComprehensiveAnalysisPrompt(evaluationsText)
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-opus-4-20250514',
              max_tokens: 2048,
              messages: [{ role: 'user', content: prompt }],
            }),
          })

          const data = await response.json()
          const content = data.content[0]?.text
          const jsonMatch = content?.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            comprehensiveResult = JSON.parse(jsonMatch[0])
          }

          // Send complete event with all data
          const completeEvent: StreamEvent = {
            type: 'complete',
            data: {
              ...comprehensiveResult,
              evaluations: Object.values(evaluations),
            },
          }
          controller.enqueue(encoder.encode(createSSEMessage(completeEvent)))
          controller.close()
        } catch (error) {
          const errorEvent: StreamEvent = {
            type: 'error',
            content: error instanceof Error ? error.message : '평가 중 오류가 발생했습니다.',
          }
          controller.enqueue(encoder.encode(createSSEMessage(errorEvent)))
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
  } catch (error) {
    console.error('Streaming Error:', error)
    return new Response(
      createSSEMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '평가 중 오류가 발생했습니다.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    )
  }
}
