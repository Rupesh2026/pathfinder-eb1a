import type { ReflectionItem } from '@/lib/types'

type Props = {
  reflections: ReflectionItem[]
}

const TYPE_CONFIG: Record<ReflectionItem['type'], { label: string; color: string }> = {
  win:     { label: 'Win',     color: 'bg-green-100 text-green-700' },
  loss:    { label: 'Loss',    color: 'bg-red-100 text-red-700' },
  insight: { label: 'Insight', color: 'bg-blue-100 text-blue-700' },
  change:  { label: 'Change',  color: 'bg-amber-100 text-amber-700' },
}

export default function ReflectionFeed({ reflections }: Props) {
  if (reflections.length === 0) {
    return (
      <p className="text-sm text-gray-400">No reflections yet. Check back after the first Sunday run.</p>
    )
  }

  return (
    <div className="space-y-3">
      {reflections.map((item, i) => {
        const config = TYPE_CONFIG[item.type]
        return (
          <div key={i} className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            <p className="text-sm text-gray-700">{item.text}</p>
          </div>
        )
      })}
    </div>
  )
}
