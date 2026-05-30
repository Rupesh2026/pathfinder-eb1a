import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pathfinder — EB-1A Case Builder',
  description: 'Build your extraordinary ability immigration case with AI-powered agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  )
}
