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

    const apiKey = process.env.CLOVA_OCR_SECRET_KEY || 'd05KZnlxbXRHTWVvTmZpZlpHaFB2cUFLTnpOcWxvQkQ='
    const apiUrl = process.env.CLOVA_OCR_API_URL || 'https://49104-peekai.apigw.ntruss.com/custom/v1/49104/peekai/general'

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Clova OCR API 키가 설정되지 않았습니다.',
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

    // Base64를 Buffer로 변환
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Clova OCR API 요청 바디 구성
    const requestBody = {
      images: [
        {
          format: 'jpg',
          name: 'answer_sheet',
          data: base64Data
        }
      ],
      requestId: `ocr-${Date.now()}`,
      version: 'V2',
      timestamp: Date.now()
    }

    // Clova OCR API 호출
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Clova OCR API Error:', error)
      return NextResponse.json({
        success: false,
        error: 'OCR 처리 중 오류가 발생했습니다.',
      }, { status: 500 })
    }

    const data = await response.json()

    // Clova OCR 응답에서 텍스트 추출
    if (!data.images || data.images.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'OCR 결과를 가져올 수 없습니다.',
      }, { status: 500 })
    }

    const fields = data.images[0].fields || []

    // 모든 필드의 텍스트를 결합
    const extractedText = fields
      .map((field: any) => field.inferText)
      .filter(Boolean)
      .join(' ')

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        error: '텍스트를 추출할 수 없습니다.',
      }, { status: 500 })
    }

    // 신뢰도 계산 (평균)
    const confidenceSum = fields.reduce((sum: number, field: any) => {
      return sum + (field.inferConfidence || 0)
    }, 0)
    const averageConfidence = fields.length > 0 ? confidenceSum / fields.length : 0

    const ocrResult: OCRResult = {
      text: extractedText,
      confidence: averageConfidence,
      hasFormulas: false, // Clova OCR에서는 직접 감지하지 않음
      hasDiagrams: false, // Clova OCR에서는 직접 감지하지 않음
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
