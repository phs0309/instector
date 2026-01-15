import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '기술사 답안 평가 서비스 | Instpector',
  description: 'AI 기반 기술사 답안지 평가 및 학습 가이드 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-zinc-900">
          <main className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800 bg-zinc-900/50 mt-auto">
            <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
              PEEX AI - AI 기반 기술사 답안 평가 서비스
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
