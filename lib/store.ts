'use client'

import { useSyncExternalStore } from 'react'
import { CARTA_DEMO, type Carta } from './datos'

/* Guardado de la carta y del pedido en el navegador (demo). Carta, panel y vista
   previa comparten la misma clave; los cambios se avisan entre pestañas y al iframe. */

export const CLAVE = 'selupin-carta-datos'
export const CLAVE_PEDIDO = 'selupin-pedido'
export const AVISO = 'selupin:refresh'

export const copiar = <T,>(o: T): T => JSON.parse(JSON.stringify(o))

const leerRaw = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }

function parsearCarta(raw: string | null): Carta {
  if (raw) {
    try {
      const d = JSON.parse(raw)
      if (d && d.negocio && Array.isArray(d.categorias)) return d as Carta
    } catch {}
  }
  return copiar(CARTA_DEMO)
}

export const leerCarta = () => parsearCarta(leerRaw(CLAVE))

export function guardarCarta(d: Carta): boolean {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)); return true } catch { return false }
}

export function borrarCarta(): Carta {
  try { localStorage.removeItem(CLAVE) } catch {}
  return copiar(CARTA_DEMO)
}

export const esPropia = () => !!leerRaw(CLAVE)
export const pesoGuardado = () => (leerRaw(CLAVE) || '').length * 2

/* ---------- Carta guardada como fuente externa (useSyncExternalStore) ---------- */
let cacheRaw: string | null | undefined
let cacheCarta: Carta = CARTA_DEMO

function suscribirCarta(avisar: () => void) {
  const alGuardar = (e: StorageEvent) => { if (e.key === CLAVE || e.key === null) avisar() }
  const alMensaje = (e: MessageEvent) => { if (e.data === AVISO) avisar() }
  window.addEventListener('storage', alGuardar)
  window.addEventListener('message', alMensaje)
  return () => { window.removeEventListener('storage', alGuardar); window.removeEventListener('message', alMensaje) }
}
function fotoCarta(): Carta {
  const raw = leerRaw(CLAVE)
  if (raw !== cacheRaw) { cacheRaw = raw; cacheCarta = raw ? parsearCarta(raw) : CARTA_DEMO }
  return cacheCarta
}

/** Carta para mostrar: en el servidor es la de ejemplo; en el navegador, la guardada. */
export function useCartaGuardada(): Carta {
  return useSyncExternalStore(suscribirCarta, fotoCarta, () => CARTA_DEMO)
}

/* ---------- Pedido del cliente ---------- */
export interface Linea { key: string; id: string; name: string; price: number; img: string; qty: number; nota: string }

const oyentesPedido = new Set<() => void>()
let cachePedidoRaw: string | null | undefined
let cachePedido: Linea[] = []
const VACIO: Linea[] = []

function fotoPedido(): Linea[] {
  const raw = leerRaw(CLAVE_PEDIDO)
  if (raw !== cachePedidoRaw) {
    cachePedidoRaw = raw
    try { cachePedido = raw ? JSON.parse(raw) || [] : [] } catch { cachePedido = [] }
  }
  return cachePedido
}
function suscribirPedido(avisar: () => void) {
  oyentesPedido.add(avisar)
  const alGuardar = (e: StorageEvent) => { if (e.key === CLAVE_PEDIDO || e.key === null) avisar() }
  window.addEventListener('storage', alGuardar)
  return () => { oyentesPedido.delete(avisar); window.removeEventListener('storage', alGuardar) }
}

export function guardarPedido(cambio: (ls: Linea[]) => Linea[]) {
  const nuevo = cambio(fotoPedido())
  try { localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(nuevo)) } catch {}
  cachePedidoRaw = undefined
  oyentesPedido.forEach((f) => f())
}

export function usePedido(): Linea[] {
  return useSyncExternalStore(suscribirPedido, fotoPedido, () => VACIO)
}

/* ---------- Valores que solo existen en el navegador ---------- */
const nada = () => () => {}
export function useOrigen(): string {
  return useSyncExternalStore(nada, () => location.origin, () => '')
}

/** Devuelve true/false según la hora actual (se revisa cada minuto); null en el servidor. */
export function useAbierto(calc: () => boolean | null): boolean | null {
  return useSyncExternalStore(
    (avisar) => { const t = setInterval(avisar, 60_000); return () => clearInterval(t) },
    calc,
    () => null,
  )
}
