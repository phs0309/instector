// 기술사 분야 타입
export type EngineerField =
  | '정보관리기술사'
  | '컴퓨터시스템응용기술사'
  | '정보통신기술사'
  | '전자응용기술사'
  | '기타'

// 평가위원 타입
export type EvaluatorType = 'A' | 'B' | 'C'

// 평가위원 정보
export interface Evaluator {
  id: EvaluatorType
  name: string
  persona: string
  focus: string[]
  style: string
}

// 인용 및 상세 평가
export interface QuotedFeedback {
  quote: string // 답안에서 인용한 부분
  evaluation: string // 해당 부분에 대한 평가
  isPositive: boolean // 긍정적/부정적 평가
}

// 세부 항목 평가
export interface DetailedScore {
  score: number // 0-20
  comment: string
  quotes: QuotedFeedback[] // 인용과 함께 평가
}

// 개별 평가 결과
export interface EvaluationResult {
  evaluatorId: EvaluatorType
  score: number // 0-100
  strengths: string[]
  weaknesses: string[]
  comment: string
  detailedFeedback: {
    theory: DetailedScore // 이론적 정확성 (20점)
    practical: DetailedScore // 실무 적용성 (20점)
    structure: DetailedScore // 답안 구조 (20점)
    expression: DetailedScore // 표현력 (20점)
    completeness: DetailedScore // 완성도 (20점)
  }
  keyPoints: string[] // 핵심 포인트 (강조 표시용)
}

// 종합 평가 결과
export interface ComprehensiveResult {
  averageScore: number
  predictedGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'
  passStatus: '합격권' | '경계선' | '미달'
  evaluations: EvaluationResult[]
  overallStrengths: string[]
  overallWeaknesses: string[]
  improvements: string[]
  studyGuide: {
    priority: string[]
    resources: string[]
    tips: string[]
  }
  modelAnswer?: string // AI 모범 답안
  structureAnalysis?: StructureAnalysis // 구조 분석 결과
}

// 구조 분석 결과 (평가 전 사전 분석)
export interface StructureAnalysis {
  structure: {
    hasOutline: boolean // 개요도 포함 여부
    hasIntro: boolean // 서론 포함 여부
    hasBody: boolean // 본론 포함 여부
    hasConclusion: boolean // 결론 포함 여부
    structureComment: string // 구조에 대한 한 줄 평가
  }
  diagrams: {
    hasDiagram: boolean // 도식 포함 여부
    diagramTypes: string[] // 도식 종류 (표, 그림, 개요도 등)
    diagramComment: string // 도식 활용에 대한 한 줄 평가
  }
  keywords: {
    found: string[] // 발견된 핵심 키워드
    missing: string[] // 누락 추정 키워드
    keywordComment: string // 키워드에 대한 한 줄 평가
  }
  format: {
    estimatedPages: number // 예상 분량 (페이지)
    readability: '상' | '중' | '하' // 가독성
    formatComment: string // 분량 및 가독성에 대한 한 줄 평가
  }
  detectedField: EngineerField // 감지된 기술사 분야
  overallStructureScore: number // 구조 점수 (0-100, 참고용)
  structureSummary: string // 전체 구조 분석 요약
}

// OCR 결과
export interface OCRResult {
  text: string
  confidence: number
  hasFormulas: boolean
  hasDiagrams: boolean
}

// 업로드된 이미지
export interface UploadedImage {
  id: string
  file: File
  preview: string
  ocrResult?: OCRResult
}

// 평가 요청
export interface EvaluationRequest {
  images: string[] // base64 encoded images
  field: EngineerField
  questionNumber?: string
  questionTitle?: string
}

// API 응답
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
