/* Reduce una imagen y la pasa a WebP (o JPEG si el navegador no sabe hacer WebP) */
export function reducirFoto(file: File, max: number): Promise<string> {
  return new Promise((ok, mal) => {
    if (!file || !/^image\//.test(file.type)) return mal(new Error('Ese archivo no es una imagen.'))
    const fr = new FileReader()
    fr.onerror = () => mal(new Error('No pudimos leer esa imagen.'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => mal(new Error('No pudimos leer esa imagen.'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        let url = c.toDataURL('image/webp', 0.8)
        if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.8)
        ok(url)
      }
      img.src = fr.result as string
    }
    fr.readAsDataURL(file)
  })
}

/* Abre el selector de archivos y devuelve la foto ya reducida */
export function pedirFoto(max: number): Promise<string | null> {
  return new Promise((ok, mal) => {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = () => { const f = inp.files?.[0]; if (!f) return ok(null); reducirFoto(f, max).then(ok, mal) }
    inp.click()
  })
}
