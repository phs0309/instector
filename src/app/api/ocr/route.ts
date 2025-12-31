import { NextRequest, NextResponse } from 'next/server'
import { OCRResult, APIResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<OCRResult>>> {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({
        success: false,
        error: '이미지가 제공되지 않았습니다.',
      }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic API 키가 설정되지 않았습니다.',
      }, { status: 500 })
    }

    // Base64 이미지에서 미디어 타입 추출
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/)
    if (!base64Match) {
      return NextResponse.json({
        success: false,
        error: '올바른 이미지 형식이 아닙니다.',
      }, { status: 400 })
    }

    const mediaType = base64Match[1]
    const base64Data = base64Match[2]

    // Claude Vision API 호출
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
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `당신은 한국어 손글씨 OCR 전문가입니다.
이 기술사 시험 답안지의 손글씨를 정확하게 텍스트로 변환해주세요.

다음 사항을 준수하세요:
1. 손글씨를 최대한 정확하게 텍스트로 변환
2. 흘려 쓴 글씨도 문맥을 고려하여 추론
3. 수식이나 도표가 있으면 텍스트로 상세히 설명
4. 글씨가 정말 판독 불가능한 부분만 [불명확] 표시
5. 단락과 문장 구조를 유지
6. 번호, 기호, 들여쓰기 등 서식도 그대로 유지
7. 기술 용어는 정확하게 인식 (예: API, DB, SQL 등)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "text": "변환된 전체 텍스트",
  "confidence": 0.0-1.0 사이의 신뢰도,
  "hasFormulas": true/false,
  "hasDiagrams": true/false
}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API Error:', error)
      return NextResponse.json({
        success: false,
        error: 'OCR 처리 중 오류가 발생했습니다.',
      }, { status: 500 })
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'OCR 결과를 가져올 수 없습니다.',
      }, { status: 500 })
    }

    // JSON 파싱 (마크다운 코드 블록 제거)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: 'OCR 응답 형식이 올바르지 않습니다.',
      }, { status: 500 })
    }

    const ocrResult: OCRResult = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: ocrResult,
    })
  } catch (error) {
    console.error('OCR Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.',
    }, { status: 500 })
  }
}
