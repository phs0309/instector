'use client'

interface RadarChartProps {
  scores: {
    theory: number
    practical: number
    structure: number
    expression: number
    completeness: number
  }
  maxScore?: number
  size?: number
  color?: string
}

export default function RadarChart({
  scores,
  maxScore = 20,
  size = 200,
  color = '#8b5cf6'
}: RadarChartProps) {
  const center = size / 2
  const radius = (size / 2) * 0.8

  // 5각형 꼭지점 각도 (상단부터 시작, 시계방향)
  const angles = [
    -90,  // 이론적 정확성 (상단)
    -18,  // 실무 적용성 (우상단)
    54,   // 답안 구조 (우하단)
    126,  // 표현력 (좌하단)
    198,  // 완성도 (좌상단)
  ]

  const labels = ['이론', '실무', '구조', '표현', '완성도']
  const scoreValues = [
    scores.theory,
    scores.practical,
    scores.structure,
    scores.expression,
    scores.completeness,
  ]

  // 각도를 라디안으로 변환
  const toRad = (deg: number) => (deg * Math.PI) / 180

  // 꼭지점 좌표 계산
  const getPoint = (index: number, value: number) => {
    const angle = toRad(angles[index])
    const r = (value / maxScore) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // 배경 그리드 생성 (5단계)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 배경 그리드 */}
      {gridLevels.map((level, i) => {
        const points = angles
          .map((_, idx) => {
            const angle = toRad(angles[idx])
            const r = radius * level
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
          })
          .join(' ')
        return (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            opacity={0.5}
          />
        )
      })}

      {/* 축선 */}
      {angles.map((_, idx) => {
        const angle = toRad(angles[idx])
        return (
          <line
            key={idx}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="#374151"
            strokeWidth="1"
            opacity={0.5}
          />
        )
      })}

      {/* 데이터 영역 */}
      <polygon
        points={scoreValues
          .map((score, idx) => {
            const point = getPoint(idx, score)
            return `${point.x},${point.y}`
          })
          .join(' ')}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth="2"
      />

      {/* 데이터 포인트 */}
      {scoreValues.map((score, idx) => {
        const point = getPoint(idx, score)
        return (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        )
      })}

      {/* 레이블 */}
      {labels.map((label, idx) => {
        const angle = toRad(angles[idx])
        const labelRadius = radius + 25
        const x = center + labelRadius * Math.cos(angle)
        const y = center + labelRadius * Math.sin(angle)
        return (
          <text
            key={idx}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#9ca3af"
            fontSize="11"
            fontWeight="500"
          >
            {label}
          </text>
        )
      })}

      {/* 점수 표시 */}
      {scoreValues.map((score, idx) => {
        const point = getPoint(idx, score)
        const angle = toRad(angles[idx])
        const offsetX = 15 * Math.cos(angle)
        const offsetY = 15 * Math.sin(angle)
        return (
          <text
            key={`score-${idx}`}
            x={point.x + offsetX}
            y={point.y + offsetY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="10"
            fontWeight="bold"
          >
            {score}
          </text>
        )
      })}
    </svg>
  )
}
