'use client'

import type { RoadmapMonth } from '../types'

const TYPE_LABELS: Record<string, string> = {
  judging: 'Judging',
  publication: 'Publication',
  speaking: 'Speaking',
  press: 'Press',
  documentation: 'Documentation',
}

const TYPE_BADGE: Record<string, string> = {
  judging: 'badge-indigo',
  publication: 'badge-green',
  speaking: 'badge-amber',
  press: 'badge-muted',
  documentation: 'badge-muted',
}

interface Props {
  roadmap: RoadmapMonth[]
}

export default function RoadmapTimeline({ roadmap }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          left: 19,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'var(--accent-border)',
          borderRadius: 2,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {roadmap.map((m, i) => (
          <div key={m.month} style={{ display: 'flex', gap: 16 }}>
            {/* Month dot */}
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: '0 0 0 4px var(--bg-page)',
                }}
              >
                {m.month}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: i < roadmap.length - 1 ? 4 : 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                {m.label}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {m.actions.map((action, j) => (
                  <div
                    key={j}
                    className="card"
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <span className={`badge ${TYPE_BADGE[action.type] ?? 'badge-muted'}`} style={{ flexShrink: 0, marginTop: 1 }}>
                      {TYPE_LABELS[action.type] ?? action.type}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {action.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
