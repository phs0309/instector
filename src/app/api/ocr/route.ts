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

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Google API 키가 설정되지 않았습니다.',
      }, { status: 500 })
    }

    // Base64 이미지에서 데이터 추출
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/)
    if (!base64Match) {
      return NextResponse.json({
        success: false,
        error: '올바른 이미지 형식이 아닙니다.',
      }, { status: 400 })
    }

    const base64Data = base64Match[2]

    // Google Vision API 호출
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                },
              ],
              imageContext: {
                languageHints: ['ko', 'en'],
              },
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Vision API Error:', error)
      return NextResponse.json({
        success: false,
        error: 'OCR 처리 중 오류가 발생했습니다.',
      }, { status: 500 })
    }

    const data = await response.json()
    const textAnnotations = data.responses?.[0]?.textAnnotations

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({
        success: false,
        error: '텍스트를 추출할 수 없습니다.',
      }, { status: 500 })
    }

    // 첫 번째 annotation이 전체 텍스트
    const extractedText = textAnnotations[0].description || ''

    // 신뢰도 계산 (평균)
    const confidenceSum = textAnnotations.reduce((sum: number, annotation: any) => {
      return sum + (annotation.confidence || 0)
    }, 0)
    const averageConfidence = textAnnotations.length > 0
      ? confidenceSum / textAnnotations.length
      : 0.85 // Google Vision은 confidence를 항상 제공하지 않으므로 기본값 사용

    const ocrResult: OCRResult = {
      text: extractedText,
      confidence: averageConfidence,
      hasFormulas: false,
      hasDiagrams: false,
    }

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
