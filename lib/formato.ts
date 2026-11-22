export const pesos = (n: number) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO')

export function horaBonita(t: string) {
  const [h = '0', m = '00'] = String(t || '').split(':')
  const hh = Number(h)
  if (hh === 12) return `12:${m} m.`
  if (hh === 0 || hh === 24) return `12:${m} a. m.`
  return `${hh > 12 ? hh - 12 : hh}:${m} ${hh > 12 ? 'p. m.' : 'a. m.'}`
}

const aHoras = (t: string) => { const [h = '0', m = '0'] = String(t || '').split(':'); return Number(h) + Number(m) / 60 }

export function estaAbierto(abre: string, cierra: string, ahora = new Date()) {
  if (!abre || !cierra) return null
  const a = aHoras(abre), c = aHoras(cierra), hr = ahora.getHours() + ahora.getMinutes() / 60
  return c > a ? hr >= a && hr < c : hr >= a || hr < c
}

export function claseEtiqueta(t: string) {
  const s = String(t || '').toLowerCase()
  return /pic|🌶/.test(s) ? 'badge-hot' : /nuev|new/.test(s) ? 'badge-new' : 'badge-top'
}

export const sinTildes = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export const slug = (t: string) => sinTildes(t || 'tu-negocio').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tu-negocio'

export const soloDigitos = (s: string) => String(s || '').replace(/\D/g, '')

export const nuevoId = (prefijo: string) => `${prefijo}-${Math.random().toString(36).slice(2, 8)}`
