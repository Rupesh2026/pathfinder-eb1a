'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
  size?: number
}

function gaugeColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#b45309'
  return '#dc2626'
}

export default function RadialGauge({ score, size = 200 }: Props) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1500

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [score])

  const radius = 80
  const circumference = 2 * Math.PI * radius       // ≈ 502.65
  const arcLength = circumference * (270 / 360)    // ≈ 376.99 (270° arc)
  const offset = arcLength * (1 - displayed / 100)
  const color = gaugeColor(displayed)
  const center = size / 2

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        style={{ display: 'block' }}
      >
        {/* Background arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        {/* Colored progress arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
          style={{ transition: 'stroke 0.3s ease' }}
        />
        {/* Score number */}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="42"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
          fill={color}
          style={{ transition: 'fill 0.3s ease' }}
        >
          {displayed}
        </text>
        {/* Label */}
        <text
          x="100"
          y="122"
          textAnchor="middle"
          fontSize="11"
          fontFamily="Inter, sans-serif"
          fill="#8b8ba8"
          fontWeight="500"
          letterSpacing="0.05em"
        >
          READINESS SCORE
        </text>
      </svg>
    </div>
  )
}
