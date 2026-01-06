import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
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
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a120a] text-[#E8F0E3] antialiased overflow-hidden selection:bg-[#4A7C59]/30 selection:text-[#E8F0E3]">
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a2818',
              border: '1px solid rgba(74, 124, 89, 0.3)',
              color: '#E8F0E3',
              borderRadius: '16px',
              fontFamily: 'var(--font-inter)',
            },
            className: 'backdrop-blur-xl bg-opacity-90',
          }}
        />
      </body>
    </html>
  )
}
