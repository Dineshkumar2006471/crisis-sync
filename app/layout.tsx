import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import { AppWrapper } from '@/components/AppWrapper'
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const interDisplay = Inter({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-data',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CrisisSync — Rapid Crisis Response Platform',
  description:
    'Real-time AI-powered crisis coordination for hotels. Report emergencies, classify threats with Gemini AI, broadcast alerts to staff in under 60 seconds.',
  keywords:
    'crisis response, hotel safety, emergency management, AI classification, real-time alerts',
  authors: [{ name: 'CrisisSync Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CrisisSync',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp"
        />
      </head>
      <body
        className={`${interDisplay.variable} ${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} material-icons-fallback`}
        style={{ background: '#050505' }}
        suppressHydrationWarning
      >
        <GoogleMapsProvider>
          <AppWrapper>{children}</AppWrapper>
        </GoogleMapsProvider>
      </body>
    </html>
  )
}
