import type { Metadata, Viewport } from 'next'
import { Epilogue, JetBrains_Mono, Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0A0C10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

import { AppWrapper } from '@/components/AppWrapper'
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider'

const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['400', '700', '900'], // Reduced to only essential weights
  variable: '--font-headline',
  display: 'swap',
  preload: false,
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600'], // Reduced to only essential weights
  variable: '--font-body',
  display: 'swap',
  preload: false,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-label',
  display: 'swap',
  preload: false, // Don't block initial load for labels
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // Don't block initial load for mono text
})

export const metadata: Metadata = {
  title: 'CrisisSync — Rapid Crisis Response Platform',
  description: 'Real-time AI-powered crisis coordination for hotels. Report emergencies, classify threats with Gemini AI, broadcast alerts to staff in under 60 seconds.',
  keywords: 'crisis response, hotel safety, emergency management, AI classification, real-time alerts',
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" />
      </head>
      <body
        className={`${epilogue.variable} ${manrope.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} material-icons-fallback`}
        style={{ background: '#0A0C10' }}
        suppressHydrationWarning
      >
        <GoogleMapsProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </GoogleMapsProvider>
      </body>
    </html>
  )
}
