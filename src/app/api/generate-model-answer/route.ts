import { NextRequest, NextResponse } from 'next/server'
import { EvaluationResult, EngineerField } from '@/types'

// Gemini API 호출 함수
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

// 모범답안 생성 프롬프트
function getModelAnswerPrompt(
  extractedText: string,
  selectedField: EngineerField,
  evaluations: EvaluationResult[],
  overallStrengths: string[],
  overallWeaknesses: string[],
  improvements: string[]
): string {
  // 평가위원별 피드백 정리
  const feedbackSummary = evaluations.map(e => {
    const detailComments = [
      e.detailedFeedback.theory?.comment,
      e.detailedFeedback.practical?.comment,
      e.detailedFeedback.structure?.comment,
      e.detailedFeedback.expression?.comment,
      e.detailedFeedback.completeness?.comment,
    ].filter(Boolean).join('\n- ')

    return `[평가위원 ${e.evaluatorId} - ${e.score}점]
강점: ${e.strengths.join(', ')}
보완점: ${e.weaknesses.join(', ')}
상세 피드백:
- ${detailComments}
코멘트: ${e.comment}`
  }).join('\n\n')

  return `당신은 ${selectedField} 분야의 기술사 시험 전문가입니다.
아래 원본 답안과 3명의 평가위원 피드백을 바탕으로 **수정된 모범 답안**을 작성해주세요.

[기술사 종목]
${selectedField}

[원본 답안]
${extractedText}

[평가위원 피드백]
${feedbackSummary}

[종합 강점]
${overallStrengths.join('\n- ')}

[종합 보완점]
${overallWeaknesses.join('\n- ')}

[개선 권고사항]
${improvements.join('\n- ')}

[모범 답안 작성 지침]
1. **원본 답안의 강점은 유지**하면서 작성하세요.
2. **평가위원들이 지적한 보완점을 모두 반영**하여 개선하세요.
3. 기술사 시험 답안 형식에 맞게 작성하세요:
   - 서론: 주제의 정의, 중요성, 배경
   - 본론: 핵심 개념, 기술적 내용, 구체적 사례
   - 결론: 요약, 향후 전망, 제언
4. 핵심 키워드와 전문 용어를 적절히 사용하세요.
5. 실무 적용 사례나 경험을 반영하세요.
6. 논리적이고 체계적인 구조로 작성하세요.
7. **답안은 4페이지(약 2,000자) 분량**에 맞게 작성하세요.
8. 불필요한 서론이나 마무리 문구 없이 바로 답안 내용만 작성하세요.

[응답 형식]
- JSON 형식이 아닌 **순수 텍스트**로 답안만 작성하세요.
- "모범 답안입니다" 같은 설명 없이 바로 답안 내용을 시작하세요.
- 답안의 각 섹션은 적절한 제목과 번호를 사용하여 구분하세요.`
}

export async function POST(request: NextRequest) {
  try {
    const {
      extractedText,
      selectedField,
      evaluations,
      overallStrengths,
      overallWeaknesses,
      improvements,
    } = await request.json()

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: '원본 답안이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (!selectedField) {
      return NextResponse.json(
        { success: false, error: '기술사 종목이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { success: false, error: '평가 결과가 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('=== 모범답안 생성 시작 ===')
    console.log('기술사 종목:', selectedField)
    console.log('원본 답안 길이:', extractedText.length, '자')

    const prompt = getModelAnswerPrompt(
      extractedText,
      selectedField,
      evaluations,
      overallStrengths || [],
      overallWeaknesses || [],
      improvements || []
    )

    console.log('프롬프트 길이:', prompt.length, '자')

    const startTime = Date.now()
    const modelAnswer = await callGemini(prompt, apiKey, 8192)
    const endTime = Date.now()

    console.log('모범답안 생성 완료:', (endTime - startTime), 'ms')
    console.log('모범답안 길이:', modelAnswer.length, '자')
    console.log('=== 모범답안 생성 완료 ===')

    return NextResponse.json({
      success: true,
      data: {
        modelAnswer: modelAnswer.trim(),
      },
    })
  } catch (error) {
    console.error('모범답안 생성 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '모범답안 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
