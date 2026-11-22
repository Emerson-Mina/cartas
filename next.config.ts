import type { NextConfig } from 'next'

/** Encabezados de seguridad. SAMEORIGIN deja que el panel muestre la carta en su vista previa. */
const SEGURIDAD = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SEGURIDAD }]
  },
}

export default nextConfig
