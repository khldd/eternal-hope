import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Eternal Hope',
  description: 'A private place journal for Khaled & Amal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Eternal Hope',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a120a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(inter.variable, playfair.variable)}>
      <body className="antialiased overflow-hidden">
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--shadow)',
              border: '1px solid rgba(74, 124, 89, 0.3)',
              color: 'var(--mist)',
              borderRadius: '16px',
              fontFamily: 'var(--font-sans)',
            },
            className: 'backdrop-blur-xl bg-opacity-90',
          }}
        />
      </body>
    </html>
  )
}
