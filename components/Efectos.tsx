'use client'

import { useEffect } from 'react'

/* Efectos compartidos: activa las animaciones de aparición, la luz que sigue
   al puntero y quita el splash. Si el JS falla, todo el contenido se ve igual. */
export default function Efectos({ preview = false }: { preview?: boolean }) {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('js')
    if (preview) html.classList.add('is-preview')

    /* Splash: el CSS lo quita a los 4.5 s si esto no corre */
    const splash = document.querySelector('.splash')
    const t1 = setTimeout(() => splash?.classList.add('is-gone'), preview ? 0 : 900)

    /* Luz y brillo en tarjetas, solo con mouse */
    const fino = matchMedia('(hover: hover) and (pointer: fine)').matches
    let raf = 0
    const mover = (e: PointerEvent) => {
      if (!raf) raf = requestAnimationFrame(() => {
        html.style.setProperty('--mx', (e.clientX / innerWidth) * 100 + '%')
        html.style.setProperty('--my', (e.clientY / innerHeight) * 100 + '%')
        raf = 0
      })
      const el = (e.target as Element | null)?.closest?.('[data-spot]') as HTMLElement | null
      if (el) {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--sx', e.clientX - r.left + 'px')
        el.style.setProperty('--sy', e.clientY - r.top + 'px')
      }
    }
    if (fino) document.addEventListener('pointermove', mover, { passive: true })

    /* Aparición al hacer scroll; también para lo que se pinte después */
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target) } })
    }, { threshold: 0.01, rootMargin: '0px 0px -2% 0px' })
    const observar = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed):not([data-obs])').forEach((el, i) => {
        el.dataset.obs = '1'
        if (preview) { el.classList.add('is-revealed'); return }
        el.style.transitionDelay = (i % 4) * 70 + 'ms'
        io.observe(el)
      })
    }
    observar()
    const mo = new MutationObserver(observar)
    mo.observe(document.body, { childList: true, subtree: true })
    const t2 = setTimeout(() => {
      document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-revealed')
      })
    }, 6000)

    return () => {
      clearTimeout(t1); clearTimeout(t2); mo.disconnect(); io.disconnect()
      document.removeEventListener('pointermove', mover)
    }
  }, [preview])

  return null
}
