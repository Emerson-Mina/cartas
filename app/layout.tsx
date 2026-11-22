import type { Metadata, Viewport } from 'next'
import { Lato } from 'next/font/google'
import './globals.css'

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Selupin Cartas', template: '%s · Selupin' },
  description: 'Carta digital para restaurantes y negocios de comida: fotos, precios, horario y pedidos por WhatsApp.',
  icons: { icon: '/img/selupin-logo.webp' },
}

export const viewport: Viewport = {
  themeColor: '#08090d',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={lato.variable}>
      <body>{children}</body>
    </html>
  )
}
