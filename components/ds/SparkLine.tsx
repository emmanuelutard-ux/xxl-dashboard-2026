type Props = {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function SparkLine({
  data,
  width = 60,
  height = 18,
  color = 'var(--indigo-500)',
}: Props) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      style={{ overflow: 'visible', flexShrink: 0 }}
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default SparkLine
