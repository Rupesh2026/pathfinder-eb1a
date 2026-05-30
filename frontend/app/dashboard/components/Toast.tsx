'use client'

import { useEffect } from 'react'

type Props = {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg"
      style={{
        background: 'var(--criterion-red)',
        color: '#fff',
        maxWidth: 360,
      }}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-auto shrink-0 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}
