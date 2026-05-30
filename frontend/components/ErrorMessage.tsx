import { AlertCircle } from 'lucide-react'

type Props = { message: string | null | undefined }

export default function ErrorMessage({ message }: Props) {
  if (!message) return null

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
      style={{ background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
    >
      <AlertCircle size={13} className="flex-shrink-0" />
      {message}
    </div>
  )
}
