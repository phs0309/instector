'use client'

import { EngineerField } from '@/types'

interface FieldSelectorProps {
  value: EngineerField
  onChange: (field: EngineerField) => void
}

const fields: { value: EngineerField; label: string; description: string }[] = [
  {
    value: '정보관리기술사',
    label: '정보관리기술사',
    description: 'IT 기획, 정보전략, 데이터 관리',
  },
  {
    value: '컴퓨터시스템응용기술사',
    label: '컴퓨터시스템응용기술사',
    description: '소프트웨어 개발, 시스템 설계',
  },
  {
    value: '정보통신기술사',
    label: '정보통신기술사',
    description: '네트워크, 통신, 보안',
  },
  {
    value: '전자응용기술사',
    label: '전자응용기술사',
    description: '전자회로, 임베디드 시스템',
  },
  {
    value: '기타',
    label: '기타 기술사',
    description: '그 외 기술사 분야',
  },
]

export default function FieldSelector({ value, onChange }: FieldSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        기술사 분야 선택
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((field) => (
          <button
            key={field.value}
            type="button"
            onClick={() => onChange(field.value)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${value === field.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="font-medium text-gray-900">{field.label}</div>
            <div className="text-sm text-gray-500 mt-1">{field.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
