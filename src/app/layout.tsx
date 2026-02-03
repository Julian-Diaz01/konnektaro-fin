import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap'
})

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: 'Konnektaro Finance',
    template: '%s | Konnektaro Finance'
  },
  description: 'A personal finance app for tracking expenses, budgets, and financial goals.',
  keywords: ['finance', 'budget', 'personal', 'expenses', 'money management', 'savings'],
  authors: [{ name: 'Konnektaro' }],
  creator: 'Konnektaro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Konnektaro Finance',
    title: 'Konnektaro Finance',
    description: 'A personal finance app for tracking expenses, budgets, and financial goals.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Konnektaro Finance',
    description: 'A personal finance app for tracking expenses, budgets, and financial goals.'
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f8f7' },
    { media: '(prefers-color-scheme: dark)', color: '#141210' }
  ],
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${jetbrains.variable} font-sans min-h-screen`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
