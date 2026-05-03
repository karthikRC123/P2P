import { useEffect, useState } from 'react'

export default function ScoreGauge({ score = 0, label = 'Score' }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (s) => {
    if (s >= 70) return 'var(--accent-emerald)'
    if (s >= 40) return 'var(--accent-amber)'
    return 'var(--accent-rose)'
  }

  return (
    <div className="score-gauge">
      <div
        className="score-gauge-ring"
        style={{
          '--gauge-percent': animated,
          '--gauge-color': getColor(score),
        }}
      />
      <span className="score-gauge-value" style={{ color: getColor(score) }}>
        {Math.round(score)}
      </span>
      <span className="score-gauge-label">{label}</span>
    </div>
  )
}
