import qrcode from 'qrcode-generator'

/* QR con corrección alta (aguanta el logo encima), módulos de borde suave y ojos azules.
   Probado con un lector de QR: los módulos redondos no se leían. */
export function qrSVG(texto: string): string {
  const qr = qrcode(0, 'H')
  qr.addData(texto); qr.make()
  const n = qr.getModuleCount(), m = 2, size = n + m * 2
  const ojo = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!qr.isDark(r, c) || ojo(r, c)) continue
    d += `<rect x="${c + m + 0.04}" y="${r + m + 0.04}" width=".92" height=".92" rx=".25"/>`
  }
  const eye = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.6" fill="none" stroke="#0141fc" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".8" fill="#08090d"/>`
  const h = n * 0.22, h0 = (size - h) / 2
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><g fill="#08090d">${d}</g>` +
    eye(m, m) + eye(m + n - 7, m) + eye(m, m + n - 7) +
    `<rect x="${h0}" y="${h0}" width="${h}" height="${h}" rx="${h * 0.22}" fill="#08090d"/></svg>`
}

const cargar = (src: string) => new Promise<HTMLImageElement>((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src })

/* PNG para descargar: QR, logo al centro, nombre y frase */
export async function qrPNG(texto: string, logo: string, nombre: string): Promise<string> {
  const W = 1000, H = 1180, pad = 90, q = W - pad * 2
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d')!
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H)
  x.drawImage(await cargar('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSVG(texto))), pad, pad, q, q)
  const L = await cargar(logo)
  const lw = q * 0.19, lh = (lw * L.height) / L.width, caja = lw * 1.4
  x.fillStyle = '#08090d'; x.beginPath()
  if (x.roundRect) x.roundRect(W / 2 - caja / 2, pad + q / 2 - caja / 2, caja, caja, 28); else x.rect(W / 2 - caja / 2, pad + q / 2 - caja / 2, caja, caja)
  x.fill()
  x.drawImage(L, W / 2 - lw / 2, pad + q / 2 - lh / 2, lw, lh)
  const fuente = getComputedStyle(document.body).fontFamily || 'Lato, sans-serif'
  x.fillStyle = '#08090d'; x.textAlign = 'center'
  x.font = `900 58px ${fuente}`; x.fillText(nombre || 'Nuestra carta', W / 2, pad + q + 70)
  x.fillStyle = '#4a5064'; x.font = `400 34px ${fuente}`; x.fillText('Escanea y mira nuestra carta', W / 2, pad + q + 118)
  return cv.toDataURL('image/png')
}
