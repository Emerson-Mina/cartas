import { LOGO_SELUPIN } from '@/lib/datos'

/* eslint-disable @next/next/no-img-element */
export function LogoPartido({ src = LOGO_SELUPIN }: { src?: string }) {
  return (
    <>
      <img className="half half-l" src={src} alt="" />
      <img className="half half-r" src={src} alt="" />
    </>
  )
}

export default function Splash({ texto }: { texto?: string }) {
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-logo"><LogoPartido /></div>
      {texto && <p className="splash-txt">{texto}</p>}
    </div>
  )
}
