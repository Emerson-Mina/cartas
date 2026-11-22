'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Efectos from '@/components/Efectos'
import { AVISO, borrarCarta, esPropia, guardarCarta, leerCarta, pesoGuardado } from '@/lib/store'
import { CARTA_DEMO, LOGO_SELUPIN, PLANES, type Carta, type Categoria, type Negocio, type Plato, type RolCombo } from '@/lib/datos'
import { pedirFoto } from '@/lib/fotos'
import { qrPNG, qrSVG } from '@/lib/qr'
import { nuevoId, pesos, slug, soloDigitos } from '@/lib/formato'

type Pestana = 'negocio' | 'carta' | 'contacto' | 'extras' | 'compartir'
const PESTANAS: [Pestana, string][] = [
  ['negocio', 'Negocio'], ['carta', 'Platos y precios'], ['contacto', 'Horario y ubicación'], ['extras', 'Combo y respaldo'], ['compartir', 'Compartir y QR'],
]
const ROLES: [RolCombo, string][] = [['plato', 'Plato del combo'], ['lado', 'Acompañante'], ['bebida', 'Bebida'], ['', 'Fuera del combo']]

const mover = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const c = arr.slice(); [c[i], c[j]] = [c[j], c[i]]; return c
}

export default function Panel({ planId = 'pro' }: { planId?: string }) {
  /* El panel solo se pinta en el navegador (ssr: false), así que puede leer el guardado al iniciar */
  const [carta, setCarta] = useState<Carta>(leerCarta)
  const [estado, setEstado] = useState(() => ({ txt: esPropia() ? 'Tus cambios están guardados en este navegador' : 'Editando la carta de ejemplo', mal: false }))
  const [uso, setUso] = useState(pesoGuardado)
  const [tab, setTab] = useState<Pestana>(() => {
    try { return (sessionStorage.getItem('selupin-panel-tab') as Pestana) || 'negocio' } catch { return 'negocio' }
  })
  const [verPreview, setVerPreview] = useState(false)
  const [aviso, setAviso] = useState('')
  const preview = useRef<HTMLIFrameElement>(null)
  const plan = PLANES.find((p) => p.id === planId) || PLANES[1]

  /* ---------- Cargar y guardar ---------- */
  useEffect(() => { try { sessionStorage.setItem('selupin-panel-tab', tab) } catch {} }, [tab])

  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) { primera.current = false; return }
    setEstado({ txt: 'Guardando…', mal: false })
    const t = setTimeout(() => {
      if (guardarCarta(carta)) {
        setEstado({ txt: 'Guardado ✓', mal: false }); setUso(pesoGuardado())
        preview.current?.contentWindow?.postMessage(AVISO, '*')
      } else setEstado({ txt: 'No hay espacio: usa fotos más livianas o quita algunas', mal: true })
    }, 350)
    return () => clearTimeout(t)
  }, [carta])

  const avisoT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const avisar = useCallback((m: string) => { setAviso(m); clearTimeout(avisoT.current); avisoT.current = setTimeout(() => setAviso(''), 2400) }, [])

  /* ---------- Editores ---------- */
  const setNeg = <K extends keyof Negocio>(k: K, v: Negocio[K]) => setCarta((c) => ({ ...c, negocio: { ...c.negocio, [k]: v } }))
  const setCats = (f: (cs: Categoria[]) => Categoria[]) => setCarta((c) => ({ ...c, categorias: f(c.categorias) }))
  const setCat = (ci: number, cambio: Partial<Categoria>) => setCats((cs) => cs.map((c, i) => (i === ci ? { ...c, ...cambio } : c)))
  const setItems = (ci: number, f: (it: Plato[]) => Plato[]) => setCats((cs) => cs.map((c, i) => (i === ci ? { ...c, items: f(c.items) } : c)))
  const setItem = (ci: number, ii: number, cambio: Partial<Plato>) => setItems(ci, (its) => its.map((p, j) => (j === ii ? { ...p, ...cambio } : p)))

  const subirFoto = async (max: number, alListo: (url: string) => void, msg: string) => {
    try { const url = await pedirFoto(max); if (url) { alListo(url); avisar(msg) } } catch (e) { avisar((e as Error).message) }
  }

  const campo = (k: keyof Negocio, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="campo"><span>{etiqueta}</span>
      <input {...extra} value={String(carta.negocio[k] ?? '')} onChange={(e) => setNeg(k, e.target.value as never)} />
    </label>
  )

  /* ---------- Compartir ---------- */
  const origen = location.origin
  const enlace = origen + '/carta'
  const logo = carta.negocio.logo || LOGO_SELUPIN
  const [copiado, setCopiado] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  useEffect(() => {
    if (!imprimiendo) return
    const t = setTimeout(() => { window.print(); setImprimiendo(false) }, 150)
    return () => clearTimeout(t)
  }, [imprimiendo])

  const descargarQR = async () => {
    try {
      const a = document.createElement('a')
      a.href = await qrPNG(enlace, logo, carta.negocio.nombre)
      a.download = `qr-${slug(carta.negocio.nombre)}.png`; a.click(); avisar('QR descargado')
    } catch { avisar('No se pudo crear el PNG del QR') }
  }
  const copiarEnlace = async () => {
    try { await navigator.clipboard.writeText(enlace); setCopiado(true); setTimeout(() => setCopiado(false), 1600) } catch { avisar('Copia el enlace a mano') }
  }

  /* ---------- Respaldo ---------- */
  const bajar = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(carta, null, 1)], { type: 'application/json' }))
    a.download = `carta-${slug(carta.negocio.nombre)}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const subir = (f?: File) => {
    if (!f) return
    f.text().then((t) => {
      const d = JSON.parse(t)
      if (!d.negocio || !Array.isArray(d.categorias)) throw new Error()
      setCarta(d); avisar('Carta cargada')
    }).catch(() => avisar('Ese archivo no es una carta de Selupin.'))
  }
  const restablecer = () => {
    if (!confirm('Se borran tus cambios y vuelve la carta de ejemplo. ¿Seguir?')) return
    primera.current = true
    setCarta(borrarCarta()); setUso(0)
    preview.current?.contentWindow?.postMessage(AVISO, '*')
    setEstado({ txt: 'Carta de ejemplo restaurada', mal: false }); avisar('Carta de ejemplo restaurada')
  }

  const n = carta.negocio
  const totalPlatos = carta.categorias.reduce((s, c) => s + c.items.length, 0)
  const ultimoNuevo = useRef<string | null>(null)
  useEffect(() => {
    if (!ultimoNuevo.current) return
    const el = document.querySelector<HTMLInputElement>(`[data-nuevo="${ultimoNuevo.current}"]`)
    if (el) { el.focus(); el.select?.(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
    ultimoNuevo.current = null
  }, [carta])

  return (
    <div className={'panel' + (verPreview ? ' ver-preview' : '')}>
      <a className="skip-link" href="#editor">Saltar al editor</a>
      <div className="glow" aria-hidden="true" />

      <header className="top">
        <Link className="brand" href="/" aria-label="Selupin, inicio">
          <img src={LOGO_SELUPIN} alt="" width={389} height={274} />
          <span>Selupin<small>Panel del negocio</small></span>
        </Link>
        <p className="p-plan">Plan {plan.nombre} · {pesos(plan.precio)}/mes · prueba gratis</p>
        <div className="p-top-acc">
          <button className="btn btn-ghost btn-sm p-solo-movil" type="button" onClick={() => setVerPreview((v) => !v)}>{verPreview ? 'Editar' : 'Vista previa'}</button>
          <a className="btn btn-sm" href="/carta" target="_blank" rel="noopener noreferrer">Ver mi carta ↗</a>
        </div>
      </header>

      <div className="p-layout">
        <main className="p-editor" id="editor">
          <div className="p-head">
            <h1>Tu <em>carta</em></h1>
            <p className={'p-guardado' + (estado.mal ? ' is-mal' : '')} aria-live="polite">{estado.txt}</p>
          </div>

          <div className="p-tabs" role="tablist" aria-label="Secciones del panel">
            {PESTANAS.map(([id, t]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{t}</button>
            ))}
          </div>

          {/* ============ NEGOCIO ============ */}
          {tab === 'negocio' && (
            <section className="p-pane">
              <div className="p-box">
                <h2>Identidad</h2>
                <div className="p-grid2">
                  {campo('nombre', 'Nombre del negocio', { maxLength: 40 })}
                  {campo('tipo', 'Tipo de comida', { maxLength: 40, placeholder: 'Comidas rápidas, pizzería, asadero…' })}
                </div>
                <div className="p-fotos">
                  <div className="p-foto p-foto-logo">
                    <img src={logo} alt="Logo actual" />
                    <div>
                      <p className="p-foto-tit">Logo</p>
                      <p className="p-ayuda">PNG o WebP con fondo transparente.</p>
                      <div className="p-foto-acc">
                        <button type="button" className="p-chip on" onClick={() => subirFoto(320, (u) => setNeg('logo', u), 'Logo actualizado')}>Subir logo</button>
                        <button type="button" className="p-chip" onClick={() => setNeg('logo', '')}>Usar el de Selupin</button>
                      </div>
                    </div>
                  </div>
                  <div className="p-foto">
                    <img src={n.portada || CARTA_DEMO.negocio.portada} alt="Portada actual" />
                    <div>
                      <p className="p-foto-tit">Foto de portada</p>
                      <p className="p-ayuda">Horizontal, la mejor foto de tu comida.</p>
                      <div className="p-foto-acc">
                        <button type="button" className="p-chip on" onClick={() => subirFoto(1600, (u) => setNeg('portada', u), 'Portada actualizada')}>Cambiar portada</button>
                        <button type="button" className="p-chip" onClick={() => setNeg('portada', CARTA_DEMO.negocio.portada)}>Volver a la de ejemplo</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-box">
                <h2>Portada</h2>
                <div className="p-grid2">
                  {campo('titulo1', 'Título, primera línea', { maxLength: 24 })}
                  {campo('titulo2', 'Título, segunda línea (en azul)', { maxLength: 24 })}
                </div>
                <label className="campo"><span>Texto de bienvenida</span>
                  <textarea rows={3} maxLength={200} value={n.texto} onChange={(e) => setNeg('texto', e.target.value)} />
                </label>
              </div>
            </section>
          )}

          {/* ============ PLATOS ============ */}
          {tab === 'carta' && (
            <section className="p-pane">
              <div className="p-carta-top">
                <p className="p-ayuda">{totalPlatos} platos en {carta.categorias.length} categorías</p>
                <p className="p-ayuda">Toca la foto de un plato para cambiarla. Los cambios se ven al instante en la vista previa.</p>
              </div>
              {carta.categorias.map((c, ci) => (
                <section className="p-cat" key={c.id}>
                  <header className="p-cat-head">
                    <input className="p-in p-emoji" value={c.emoji} maxLength={4} aria-label="Emoji de la categoría" onChange={(e) => setCat(ci, { emoji: e.target.value })} />
                    <input className="p-in p-cat-nombre" data-nuevo={c.id} value={c.nombre} placeholder="Nombre de la categoría" aria-label="Nombre de la categoría" onChange={(e) => setCat(ci, { nombre: e.target.value })} />
                    <span className="p-cuenta">{c.items.length} {c.items.length === 1 ? 'plato' : 'platos'}</span>
                    <div className="p-mover">
                      <button type="button" aria-label="Subir categoría" disabled={!ci} onClick={() => setCats((cs) => mover(cs, ci, -1))}>↑</button>
                      <button type="button" aria-label="Bajar categoría" disabled={ci === carta.categorias.length - 1} onClick={() => setCats((cs) => mover(cs, ci, 1))}>↓</button>
                      <button type="button" className="borrar" aria-label="Borrar categoría" onClick={() => {
                        if (confirm(`¿Borrar la categoría «${c.nombre || 'sin nombre'}» y sus ${c.items.length} platos?`)) setCats((cs) => cs.filter((_, i) => i !== ci))
                      }}>✕</button>
                    </div>
                  </header>
                  <input className="p-in p-cat-desc" value={c.descripcion} placeholder="Texto bajo el título (opcional)" aria-label="Descripción de la categoría" onChange={(e) => setCat(ci, { descripcion: e.target.value })} />
                  <div className="p-roles" role="group" aria-label="Papel en el combo">
                    {ROLES.map(([r, t]) => <button key={t} type="button" className={'p-chip' + (c.combo === r ? ' on' : '')} onClick={() => setCat(ci, { combo: r })}>{t}</button>)}
                  </div>
                  <ul className="p-items">
                    {c.items.map((p, ii) => {
                      const dest = carta.destacado === p.id
                      return (
                        <li className={'p-item' + (p.activo === false ? ' is-off' : '')} key={p.id}>
                          <button type="button" className={'p-thumb' + (p.img ? '' : ' vacia')} aria-label={`Cambiar foto de ${p.nombre}`}
                            onClick={() => subirFoto(900, (u) => setItem(ci, ii, { img: u }), 'Foto actualizada')}>
                            {p.img ? <img src={p.img} alt="" /> : <span>＋ Foto</span>}
                          </button>
                          <div className="p-item-campos">
                            <div className="p-fila">
                              <input className="p-in p-nombre" data-nuevo={p.id} value={p.nombre} placeholder="Nombre del plato" aria-label="Nombre del plato" onChange={(e) => setItem(ci, ii, { nombre: e.target.value })} />
                              <label className="p-precio"><span>$</span>
                                <input className="p-in" inputMode="numeric" aria-label="Precio" value={p.precio ? p.precio.toLocaleString('es-CO') : ''} placeholder="0"
                                  onChange={(e) => setItem(ci, ii, { precio: Number(soloDigitos(e.target.value)) || 0 })} />
                              </label>
                            </div>
                            <textarea className="p-in p-desc" rows={2} placeholder="Descripción corta" aria-label="Descripción" value={p.desc} onChange={(e) => setItem(ci, ii, { desc: e.target.value })} />
                            <div className="p-fila p-fila-mini">
                              <input className="p-in p-etq" value={p.etiqueta} placeholder="Etiqueta: Nueva, Picante…" aria-label="Etiqueta" onChange={(e) => setItem(ci, ii, { etiqueta: e.target.value })} />
                              <button type="button" className={'p-chip' + (p.activo === false ? '' : ' on')} onClick={() => setItem(ci, ii, { activo: p.activo === false })}>{p.activo === false ? 'Agotado' : 'Disponible'}</button>
                              <button type="button" className={'p-chip estrella' + (dest ? ' on' : '')} title="Mostrar como plato destacado"
                                onClick={() => setCarta((cc) => ({ ...cc, destacado: dest ? '' : p.id }))}>★ {dest ? 'Destacado' : 'Destacar'}</button>
                            </div>
                          </div>
                          <div className="p-mover">
                            <button type="button" aria-label="Subir" disabled={!ii} onClick={() => setItems(ci, (its) => mover(its, ii, -1))}>↑</button>
                            <button type="button" aria-label="Bajar" disabled={ii === c.items.length - 1} onClick={() => setItems(ci, (its) => mover(its, ii, 1))}>↓</button>
                            <button type="button" className="borrar" aria-label="Borrar plato" onClick={() => {
                              if (confirm(`¿Borrar «${p.nombre || 'este plato'}»?`)) setItems(ci, (its) => its.filter((_, j) => j !== ii))
                            }}>✕</button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <button type="button" className="p-add" onClick={() => {
                    const id = nuevoId('plato'); ultimoNuevo.current = id
                    setItems(ci, (its) => [...its, { id, nombre: '', desc: '', precio: 0, img: '', etiqueta: '', activo: true }])
                  }}>＋ Agregar plato a {c.nombre || 'esta categoría'}</button>
                </section>
              ))}
              <button type="button" className="p-add p-add-cat" onClick={() => {
                const id = nuevoId('cat'); ultimoNuevo.current = id
                setCats((cs) => [...cs, { id, nombre: 'Nueva categoría', emoji: '🍽', combo: '', descripcion: '', items: [] }])
              }}>＋ Agregar categoría</button>
            </section>
          )}

          {/* ============ HORARIO Y UBICACIÓN ============ */}
          {tab === 'contacto' && (
            <section className="p-pane">
              <div className="p-box">
                <h2>Horario</h2>
                {campo('dias', 'Días de atención', { placeholder: 'Lunes a domingo' })}
                <div className="p-grid2">
                  {campo('abre', 'Abre', { type: 'time' })}
                  {campo('cierra', 'Cierra', { type: 'time' })}
                </div>
                <p className="p-ayuda">La carta muestra «Abierto ahora» o «Cerrado» según esta hora.</p>
              </div>
              <div className="p-box">
                <h2>Ubicación</h2>
                <div className="p-grid2">
                  {campo('direccion', 'Dirección')}
                  {campo('ciudad', 'Ciudad o barrio')}
                </div>
                {campo('mapa', 'Enlace de Google Maps (opcional)', { type: 'url', placeholder: 'https://maps.app.goo.gl/…' })}
              </div>
              <div className="p-box">
                <h2>Pedidos</h2>
                <div className="p-grid2">
                  <label className="campo"><span>WhatsApp que recibe los pedidos</span>
                    <input inputMode="tel" placeholder="573001234567" value={n.whatsapp} onChange={(e) => setNeg('whatsapp', soloDigitos(e.target.value))} />
                  </label>
                  {campo('telefono', 'Teléfono que se muestra', { inputMode: 'tel', placeholder: '300 123 4567' })}
                </div>
                <p className="p-ayuda">El WhatsApp va con el indicativo del país, sin + ni espacios (Colombia: 57).</p>
                <div className="p-grid3">
                  <label className="campo"><span>Costo del domicilio</span>
                    <input inputMode="numeric" value={n.domicilio ? n.domicilio.toLocaleString('es-CO') : ''} placeholder="0" onChange={(e) => setNeg('domicilio', Number(soloDigitos(e.target.value)) || 0)} />
                  </label>
                  {campo('tiempo', 'Tiempo de entrega', { placeholder: '30–40 min' })}
                  {campo('pagos', 'Formas de pago')}
                </div>
              </div>
            </section>
          )}

          {/* ============ COMBO Y RESPALDO ============ */}
          {tab === 'extras' && (
            <section className="p-pane">
              <div className="p-box">
                <h2>Arma tu combo</h2>
                <label className="p-switch">
                  <input type="checkbox" checked={carta.combo.activo} onChange={(e) => setCarta((c) => ({ ...c, combo: { ...c.combo, activo: e.target.checked } }))} />
                  <span /> Mostrar «Arma tu combo» en la carta
                </label>
                <label className="campo p-corto"><span>Descuento del combo (%)</span>
                  <input inputMode="numeric" maxLength={2} value={carta.combo.descuento} onChange={(e) => setCarta((c) => ({ ...c, combo: { ...c.combo, descuento: Math.min(90, Number(soloDigitos(e.target.value)) || 0) } }))} />
                </label>
                <p className="p-ayuda">Las opciones salen de las categorías marcadas como «Plato del combo», «Acompañante» y «Bebida» en Platos y precios.</p>
              </div>
              <div className="p-box">
                <h2>Respaldo</h2>
                <p className="p-ayuda">Esta demo guarda la carta solo en este navegador. Descarga una copia para no perderla o para pasarla a otro equipo.</p>
                <div className="p-uso">
                  <div className="p-uso-bar"><span style={{ width: Math.min(100, (uso / 1024 / 5120) * 100) + '%' }} /></div>
                  <p className="p-ayuda">{Math.round(uso / 1024).toLocaleString('es-CO')} KB de unos 5.000 KB</p>
                </div>
                <div className="p-acciones">
                  <button type="button" className="btn btn-sm" onClick={bajar}>Descargar copia</button>
                  <label className="btn btn-ghost btn-sm p-subir">Cargar copia<input type="file" accept="application/json,.json" hidden onChange={(e) => { subir(e.target.files?.[0]); e.target.value = '' }} /></label>
                  <button type="button" className="btn btn-ghost btn-sm p-peligro" onClick={restablecer}>Restablecer ejemplo</button>
                </div>
              </div>
            </section>
          )}

          {/* ============ COMPARTIR ============ */}
          {tab === 'compartir' && (
            <section className="p-pane">
              <div className="p-box">
                <h2>El enlace de tu carta</h2>
                <div className="p-enlace">
                  <input className="p-in" readOnly value={enlace} aria-label="Enlace de tu carta" onFocus={(e) => e.target.select()} />
                  <button type="button" className="btn btn-sm" onClick={copiarEnlace}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
                </div>
                <div className="p-acciones">
                  <a className="btn btn-ghost btn-sm" href="/carta" target="_blank" rel="noopener noreferrer">Abrir carta ↗</a>
                  <a className="btn btn-sm btn-wa" target="_blank" rel="noopener noreferrer"
                    href={`https://wa.me/?text=${encodeURIComponent(`Mira la carta de ${n.nombre || 'nuestro negocio'} y pide por WhatsApp: ${enlace}`)}`}>Enviar por WhatsApp</a>
                </div>
                <p className="p-ayuda">En esta demo el enlace es el de este equipo. Con un plan activo sería algo como <b>selupin.co/{slug(n.nombre)}</b>.</p>
              </div>
              <div className="p-box">
                <h2>Código QR</h2>
                <div className="p-qr-wrap">
                  {origen && (
                    <div className="p-qr" role="img" aria-label="Código QR de tu carta">
                      <span dangerouslySetInnerHTML={{ __html: qrSVG(enlace) }} style={{ display: 'contents' }} />
                      <img className="qr-logo" src={logo} alt="" />
                    </div>
                  )}
                  <div className="p-qr-txt">
                    <p>Ponlo en las mesas, en la caja, en el empaque de los domicilios o en tus redes. Al escanearlo, el cliente abre tu carta.</p>
                    <div className="p-acciones">
                      <button type="button" className="btn btn-sm" onClick={descargarQR}>Descargar QR (PNG)</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImprimiendo(true)}>Imprimir hoja para mesas</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <aside className="p-preview" aria-label="Vista previa de la carta">
          <div className="telefono">
            <span className="telefono-isla" aria-hidden="true" />
            <iframe ref={preview} src="/carta?preview=1" title="Vista previa de tu carta" />
          </div>
          <p className="p-ayuda">Vista previa en vivo</p>
        </aside>
      </div>

      {/* Hoja imprimible (solo se ve al imprimir) */}
      <div className="hoja" aria-hidden="true">
        <img className="hoja-logo" src={logo} alt="" />
        <p className="hoja-nombre">{n.nombre}</p>
        <p className="hoja-tit">Escanea y mira<br />nuestra carta</p>
        {origen && (
          <div className="hoja-qr">
            <span dangerouslySetInnerHTML={{ __html: qrSVG(enlace) }} style={{ display: 'contents' }} />
            <img className="qr-logo" src={logo} alt="" />
          </div>
        )}
        <p className="hoja-pie">Pide por WhatsApp desde tu celular · {n.telefono}</p>
      </div>

      <div className={'toast' + (aviso ? ' is-on' : '')} role="status" aria-live="polite">{aviso}</div>
      <Efectos />
    </div>
  )
}
