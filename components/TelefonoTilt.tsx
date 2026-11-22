'use client'

import { useRef } from 'react'

/* Celular de la portada con la carta de ejemplo; se inclina un poco con el puntero */
export default function TelefonoTilt() {
  const tel = useRef<HTMLDivElement>(null)

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !tel.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
    tel.current.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`
  }

  return (
    <div className="l-hero-tel" aria-hidden="true" onPointerMove={mover} onPointerLeave={() => { if (tel.current) tel.current.style.transform = '' }}>
      <div className="telefono telefono-hero" ref={tel}>
        <span className="telefono-isla" />
        <iframe src="/carta?preview=1" title="Carta de ejemplo" tabIndex={-1} loading="lazy" />
      </div>
      <span className="l-flota f1">🛵 Pedido nuevo · $45.800</span>
      <span className="l-flota f2">✓ Precio actualizado</span>
      <span className="l-flota f3">🟢 Abierto ahora</span>
    </div>
  )
}
