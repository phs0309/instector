// 기술사 분야 타입 - 한국 국가기술자격 기술사 84개 종목
export type EngineerField =
  // 건설 및 건축 분야 - 건축 (5개)
  | '건축구조기술사'
  | '건축기계설비기술사'
  | '건축시공기술사'
  | '건축전기설비기술사'
  | '건축품질시험기술사'
  // 건설 및 건축 분야 - 토목 (11개)
  | '토목시공기술사'
  | '토질및기초기술사'
  | '토목구조기술사'
  | '도로및공항기술사'
  | '상하수도기술사'
  | '수자원개발기술사'
  | '지적기술사'
  | '측량및지형공간정보기술사'
  | '항만및해안기술사'
  | '철도기술사'
  | '농어업토목기술사'
  // 건설 및 건축 분야 - 도시/교통 (3개)
  | '도시계획기술사'
  | '조경기술사'
  | '교통기술사'
  // 안전관리 및 환경 분야 - 안전 (7개)
  | '소방기술사'
  | '건설안전기술사'
  | '기계안전기술사'
  | '전기안전기술사'
  | '화공안전기술사'
  | '가스기술사'
  | '인간공학기술사'
  // 안전관리 및 환경 분야 - 환경 (6개)
  | '수질관리기술사'
  | '대기관리기술사'
  | '소음진동기술사'
  | '폐기물처리기술사'
  | '자연환경관리기술사'
  | '토양환경기술사'
  // 안전관리 및 환경 분야 - 비파괴 (1개)
  | '비파괴검사기술사'
  // 기계 및 금속 분야 - 기계 (5개)
  | '기계기술사'
  | '공조냉동기계기술사'
  | '건설기계기술사'
  | '산업기계설비기술사'
  | '금형기술사'
  // 기계 및 금속 분야 - 자동차/항공/조선 (4개)
  | '차량기술사'
  | '항공기관기술사'
  | '항공기체기술사'
  | '조선기술사'
  // 기계 및 금속 분야 - 금속/재료 (4개)
  | '금속제련기술사'
  | '금속재료기술사'
  | '표면처리기술사'
  | '세라믹기술사'
  // 전기, 전자 및 정보통신 분야 - 전기 (4개)
  | '발송배전기술사'
  | '전기응용기술사'
  | '철도신호기술사'
  // 전기, 전자 및 정보통신 분야 - 전자 (2개)
  | '산업계측제어기술사'
  | '전자응용기술사'
  // 전기, 전자 및 정보통신 분야 - 정보통신/IT (3개)
  | '정보관리기술사'
  | '컴퓨터시스템응용기술사'
  | '정보통신기술사'
  // 화공, 에너지 및 기타 분야 - 화공 (1개)
  | '화공기술사'
  // 화공, 에너지 및 기타 분야 - 에너지 (2개)
  | '원자력발전기술사'
  | '방사선관리기술사'
  // 화공, 에너지 및 기타 분야 - 농림/수산 (5개)
  | '산림기술사'
  | '종자기술사'
  | '시설원예기술사'
  | '수산제조기술사'
  | '해양기술사'
  // 화공, 에너지 및 기타 분야 - 기타 (4개)
  | '포장기술사'
  | '기상예보기술사'
  | '식품기술사'
  | '품질관리기술사'
  // 기타
  | '기타'

// 기술사 분야 카테고리
export type FieldCategory =
  | '건설 및 건축'
  | '안전관리 및 환경'
  | '기계 및 금속'
  | '전기·전자·정보통신'
  | '화공·에너지·기타'

// AI 모델 타입
export type AIModel = 'gpt-4o' | 'gemini'

// AI 모델 옵션
export interface AIModelOption {
  id: AIModel
  name: string
  description: string
}

// 평가위원 타입 (1명 통합 평가위원)
export type EvaluatorType = 'A'

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
  aiModel?: AIModel // 사용된 AI 모델
}

// 구조 분석 결과 (평가 전 사전 분석)
export interface StructureAnalysis {
  // 기술사 종목 판별 정보
  detectedField: EngineerField // 감지된 기술사 종목
  fieldCategory: FieldCategory // 분야 카테고리
  confidence: number // 판별 신뢰도 (0-100)
  detectionReason: string // 판별 근거

  // 키워드 분석
  keywords: {
    found: string[] // 발견된 핵심 키워드
    fieldSpecific: string[] // 해당 기술사 분야 특화 키워드
    missing: string[] // 누락 추정 키워드
  }

  // 답안 구조 분석
  structure: {
    hasOutline: boolean // 개요도 포함 여부
    hasIntro: boolean // 서론 포함 여부
    hasBody: boolean // 본론 포함 여부
    hasConclusion: boolean // 결론 포함 여부
    structureComment: string // 구조에 대한 평가
  }

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
  aiModel?: AIModel // 선택된 AI 모델
}

// API 응답
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
