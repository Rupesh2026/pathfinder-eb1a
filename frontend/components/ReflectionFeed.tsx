import type { ReflectionItem } from '@/lib/types'
import { Trophy, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react'

type Props = { reflections: ReflectionItem[] }

const TYPE_CONFIG: Record<ReflectionItem['type'], { label: string; icon: React.ReactNode; className: string }> = {
  win:     { label: 'Win',     icon: <Trophy size={10} />,      className: 'badge-green' },
  loss:    { label: 'Loss',    icon: <AlertCircle size={10} />, className: 'badge-red' },
  insight: { label: 'Insight', icon: <Lightbulb size={10} />,   className: 'badge-indigo' },
  change:  { label: 'Change',  icon: <ArrowRight size={10} />,  className: 'badge-amber' },
}

export default function ReflectionFeed({ reflections }: Props) {
  if (reflections.length === 0) {
    return (
      <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
        No reflections yet — available after the first Sunday agent run.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {reflections.map((item, i) => {
        const cfg = TYPE_CONFIG[item.type]
        return (
          <div key={i} className="flex items-start gap-3">
            <span className={`badge ${cfg.className} flex-shrink-0 mt-0.5`}>
              {cfg.icon} {cfg.label}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
          </div>
        )
      })}
    </div>
  )
}
