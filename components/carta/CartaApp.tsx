'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Efectos from '@/components/Efectos'
import Splash, { LogoPartido } from '@/components/Splash'
import { guardarPedido, useAbierto, useCartaGuardada, usePedido } from '@/lib/store'
import { LOGO_SELUPIN, type Categoria, type Plato } from '@/lib/datos'
import { claseEtiqueta, estaAbierto, horaBonita, pesos, sinTildes, soloDigitos } from '@/lib/formato'

/* ---------- Tipos del pedido ---------- */
interface Producto { id: string; name: string; price: number; img: string; desc?: string }

const activos = (c: Categoria) => c.items.filter((i) => i.activo !== false)
const aProducto = (p: Plato): Producto => ({ id: p.id, name: p.nombre, price: Number(p.precio) || 0, img: p.img, desc: p.desc })

/* Foto que vuela al botón del pedido */
function volar(desde: HTMLImageElement | null) {
  if (!desde || !desde.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const barra = document.querySelector<HTMLElement>('[data-cart-bar]')
  const destino = barra && getComputedStyle(barra).display !== 'none' ? barra : document.querySelector<HTMLElement>('.cart-btn')
  if (!destino) return
  const a = desde.getBoundingClientRect(), b = destino.getBoundingClientRect()
  const s = Math.min(a.width, a.height, 120)
  const c = document.createElement('img')
  c.src = desde.currentSrc || desde.src; c.className = 'vuela'; c.alt = ''
  Object.assign(c.style, { left: a.left + a.width / 2 - s / 2 + 'px', top: a.top + a.height / 2 - s / 2 + 'px', width: s + 'px', height: s + 'px' })
  document.body.appendChild(c)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2)
  c.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(.6)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0.4 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.75,0)' }).onfinish = () => c.remove()
}

export default function CartaApp({ preview = false }: { preview?: boolean }) {
  const carta = useCartaGuardada()
  const n = carta.negocio
  const logo = n.logo || LOGO_SELUPIN
  const whatsapp = soloDigitos(n.whatsapp)
  const cats = useMemo(() => carta.categorias.filter((c) => activos(c).length), [carta])
  const destacado = useMemo(() => cats.flatMap(activos).find((i) => i.id === carta.destacado) || null, [cats, carta.destacado])

  /* ---------- Pedido ---------- */
  const pedido = usePedido()

  const [aviso, setAviso] = useState('')
  const avisoT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const avisar = useCallback((m: string) => {
    setAviso(m); clearTimeout(avisoT.current); avisoT.current = setTimeout(() => setAviso(''), 2200)
  }, [])

  const [bump, setBump] = useState(0)
  const agregar = useCallback((p: Producto, qty = 1, nota = '') => {
    const nt = nota.trim(), key = p.id + '|' + nt
    guardarPedido((ls) => {
      const i = ls.findIndex((l) => l.key === key)
      if (i > -1) return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + qty } : l))
      return [...ls, { id: p.id, name: p.name, price: p.price, img: p.img, key, qty, nota: nt }]
    })
    setBump((b) => b + 1)
    avisar(`${qty} × ${p.name} al pedido`)
  }, [avisar])

  const [entrega, setEntrega] = useState('Domicilio')
  const cantidad = pedido.reduce((s, l) => s + l.qty, 0)
  const subtotal = pedido.reduce((s, l) => s + l.price * l.qty, 0)
  const domicilio = entrega === 'Domicilio' && cantidad ? Number(n.domicilio) || 0 : 0
  const total = subtotal + domicilio

  /* ---------- Buscador ---------- */
  const [q, setQ] = useState('')
  const nq = sinTildes(q.trim())
  const coincide = (p: Plato) => !nq || sinTildes(`${p.nombre} ${p.desc} ${p.etiqueta}`).includes(nq)
  const hayResultados = !nq || cats.some((c) => activos(c).some(coincide))

  /* ---------- Pestañas activas ---------- */
  const comboOn = !!carta.combo?.activo
  const [tabActiva, setTabActiva] = useState('')
  const tabsRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const ids = [...cats.map((c) => c.id), ...(comboOn ? ['combo'] : [])]
    let raf = 0
    const calc = () => {
      raf = 0
      const linea = innerHeight * 0.4
      let cur = ids[0]
      ids.forEach((id) => { const el = document.getElementById(id); if (el && el.offsetParent !== null && el.getBoundingClientRect().top <= linea) cur = id })
      setTabActiva(cur)
    }
    const alScroll = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    addEventListener('scroll', alScroll, { passive: true })
    return () => removeEventListener('scroll', alScroll)
  }, [cats, comboOn])
  useEffect(() => {
    const nav = tabsRef.current, a = nav?.querySelector<HTMLElement>('.is-active')
    if (nav && a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' })
  }, [tabActiva])

  /* ---------- Estado abierto/cerrado (se calcula en el navegador) ---------- */
  const abierto = useAbierto(() => estaAbierto(n.abre, n.cierra))

  /* ---------- Modal de plato ---------- */
  const modalRef = useRef<HTMLDialogElement>(null)
  const modalImg = useRef<HTMLImageElement>(null)
  const [plato, setPlato] = useState<Producto | null>(null)
  const [qty, setQty] = useState(1)
  const [nota, setNota] = useState('')
  const abrirPlato = (p: Plato) => { setPlato(aProducto(p)); setQty(1); setNota(''); modalRef.current?.showModal() }
  const confirmarPlato = (e: React.FormEvent) => {
    e.preventDefault()
    if (plato) { agregar(plato, qty, nota); volar(modalImg.current) }
    modalRef.current?.close()
  }

  /* ---------- Panel del pedido ---------- */
  const cajonRef = useRef<HTMLDialogElement>(null)
  const [nombre, setNombre] = useState('')
  const [dir, setDir] = useState('')
  const [pago, setPago] = useState('Efectivo')
  const [error, setError] = useState('')
  const cambiarQty = (i: number, d: number) => guardarPedido((ls) => ls.flatMap((l, j) => (j !== i ? [l] : l.qty + d < 1 ? [] : [{ ...l, qty: l.qty + d }])))
  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const falta = !nombre.trim() ? 'Escribe tu nombre.' : entrega === 'Domicilio' && !dir.trim() ? 'Escribe la dirección para el domicilio.' : !whatsapp ? 'Este negocio aún no configuró su WhatsApp.' : ''
    setError(falta)
    if (falta) return
    const lineas = [`*Pedido para ${n.nombre}*`, '']
    pedido.forEach((l) => lineas.push(`• ${l.qty} × ${l.name} — ${pesos(l.price * l.qty)}${l.nota ? `\n   _${l.nota}_` : ''}`))
    lineas.push('', `Subtotal: ${pesos(subtotal)}`)
    if (domicilio) lineas.push(`Domicilio: ${pesos(domicilio)}`)
    lineas.push(`*Total: ${pesos(total)}*`, '', `Nombre: ${nombre.trim()}`, `Entrega: ${entrega}`)
    if (entrega === 'Domicilio') lineas.push(`Dirección: ${dir.trim()}`)
    lineas.push(`Pago: ${pago}`)
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank', 'noopener')
  }

  /* ---------- Combo ---------- */
  const roles = useMemo(() => {
    const r: Record<'plato' | 'lado' | 'bebida', Plato[]> = { plato: [], lado: [], bebida: [] }
    cats.forEach((c) => { if (c.combo) r[c.combo] = r[c.combo].concat(activos(c)) })
    return r
  }, [cats])
  const opciones = useMemo(() => ({
    plato: roles.plato,
    lado: [...roles.lado, { id: '', nombre: 'Sin acompañante', precio: 0 } as Plato],
    bebida: [...roles.bebida, { id: '', nombre: 'Sin bebida', precio: 0 } as Plato],
  }), [roles])
  const [eleccion, setEleccion] = useState<Record<string, number>>({ plato: 0, lado: 0, bebida: 0 })
  const elegido = (k: 'plato' | 'lado' | 'bebida') => opciones[k][Math.min(eleccion[k] || 0, opciones[k].length - 1)]
  const comboLleno = (['plato', 'lado', 'bebida'] as const).reduce((s, k) => s + (Number(elegido(k)?.precio) || 0), 0)
  const descuento = (Number(carta.combo?.descuento) || 0) / 100
  const comboPrecio = Math.round((comboLleno * (1 - descuento)) / 100) * 100
  const comboImg = useRef<HTMLImageElement>(null)
  const mostrarCombo = comboOn && roles.plato.length > 0 && !nq
  const agregarCombo = (e: React.FormEvent) => {
    e.preventDefault()
    const partes = (['plato', 'lado', 'bebida'] as const).map(elegido).filter((p) => p && Number(p.precio) > 0).map((p) => p.nombre)
    agregar({ id: 'combo-' + partes.join('-').toLowerCase().replace(/\s+/g, '-'), name: 'Combo ' + partes.join(' + '), price: comboPrecio, img: '/img/combo.webp' })
    volar(comboImg.current)
  }

  const chips = [
    ...(Number(n.domicilio) || n.tiempo ? [`🛵 Domicilio ${n.tiempo || ''}`] : []),
    '📍 Recoge en el local',
    ...(n.pagos ? [`💳 ${n.pagos}`] : []),
  ]

  useEffect(() => { document.title = `Carta ${n.nombre}` }, [n.nombre])

  return (
    <>
      <a className="skip-link" href="#carta">Saltar a la carta</a>
      <Splash texto="Encendiendo la plancha…" />
      <div className="glow" aria-hidden="true" />

      <header className="top">
        <a className="brand" href="#inicio" aria-label={`${n.nombre}, inicio`}>
          <img src={logo} alt="" width={389} height={274} />
          <span>{n.nombre}<small>{n.tipo}</small></span>
        </a>
        <p className="estado">
          <span className={'dot' + (abierto === false ? ' is-off' : '')} />
          {abierto === null ? `Abierto de ${horaBonita(n.abre)} a ${horaBonita(n.cierra)}`
            : abierto ? `Abierto ahora · cierra a las ${horaBonita(n.cierra)}` : `Cerrado · abrimos a las ${horaBonita(n.abre)}`}
        </p>
        <button className="btn btn-sm cart-btn" type="button" onClick={() => cajonRef.current?.showModal()} aria-label="Ver tu pedido">
          Pedido <b key={bump} className={'cart-count' + (bump ? ' is-bump' : '')}>{cantidad}</b>
        </button>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <img src={n.portada || '/img/hero.webp'} alt="" fetchPriority="high" width={1600} height={900} />
          </div>
          <div className="hero-copy">
            <div className="hero-logo" aria-hidden="true"><LogoPartido src={logo} /></div>
            <h1 className="hero-title"><span className="line">{n.titulo1}</span><span className="line"><em>{n.titulo2}</em></span></h1>
            <p className="hero-sub">{n.texto}</p>
            <ul className="hero-info">{chips.map((c) => <li key={c}>{c}</li>)}</ul>
            <div className="hero-cta">
              <a className="btn" href="#carta">Ver la carta</a>
              {mostrarCombo && <a className="btn btn-ghost" href="#combo">Arma tu combo →</a>}
            </div>
          </div>
        </section>

        <div className="cinta" aria-hidden="true">
          <div className="cinta-track">
            {Array.from({ length: 2 }).flatMap((_, k) => ['Hecho al momento', 'Pan artesanal', 'Carne 100 % res', 'Salsas de la casa', 'Pide por WhatsApp'].map((t) => (
              <span key={k + t} style={{ display: 'contents' }}><span>{t}</span><i>✦</i></span>
            )))}
          </div>
        </div>

        {destacado && !nq && (
          <section className="destacado">
            <article className="dest-card item" data-reveal>
              <div className="dest-img">{destacado.img ? <img src={destacado.img} alt={destacado.nombre} loading="lazy" decoding="async" /> : <div className="sin-foto">🍽</div>}</div>
              <div className="dest-copy">
                <p className="eyebrow">El más pedido de la semana</p>
                <h2>{destacado.nombre}</h2>
                <p className="desc">{destacado.desc}</p>
                <div className="dest-foot">
                  <p className="precio">{pesos(destacado.precio)}</p>
                  <button className="btn" type="button" onClick={(e) => { agregar(aProducto(destacado)); volar(e.currentTarget.closest('.dest-card')?.querySelector('img') || null) }}>Agregar al pedido</button>
                </div>
              </div>
              <span className="sello" aria-hidden="true">Top<br />#1</span>
            </article>
          </section>
        )}

        <div className="carta-bar" id="carta">
          <label className="buscar">
            <span className="sr-only">Buscar en la carta</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input type="search" placeholder="Busca: alitas, queso, malteada…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <nav className="tabs" aria-label="Categorías" ref={tabsRef}>
            {cats.map((c, i) => <a key={c.id} href={`#${c.id}`} className={(tabActiva ? tabActiva === c.id : i === 0) ? 'is-active' : ''}>{c.emoji ? `${c.emoji} ` : ''}{c.nombre}</a>)}
            {comboOn && <a href="#combo" className={tabActiva === 'combo' ? 'is-active' : ''}>⭐ Combos</a>}
          </nav>
        </div>
        {!hayResultados && <p className="sin-resultados">No encontramos eso en la carta. Prueba con otra palabra.</p>}

        {cats.map((c, ci) => {
          const items = activos(c).filter(coincide)
          if (!items.length) return null
          return (
            <section className="cat" id={c.id} key={c.id}>
              <header className="cat-head" data-reveal>
                <p className="cat-num">{String(ci + 1).padStart(2, '0')}</p>
                <h2>{c.nombre}</h2>
                {c.descripcion && <p>{c.descripcion}</p>}
              </header>
              <div className="grid">
                {items.map((p) => (
                  <article key={p.id} className="item card" data-reveal data-spot tabIndex={0}
                    onClick={() => abrirPlato(p)}
                    onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirPlato(p) } }}>
                    <div className="card-img">
                      {p.img ? <img src={p.img} alt={p.nombre} loading="lazy" decoding="async" /> : <div className="sin-foto" aria-hidden="true">🍽</div>}
                      {p.etiqueta && <span className={`badge ${claseEtiqueta(p.etiqueta)}`}>{p.etiqueta}</span>}
                    </div>
                    <div className="card-body">
                      <h3>{p.nombre}</h3>
                      <p className="desc">{p.desc}</p>
                      <div className="card-foot">
                        <p className="precio">{pesos(p.precio)}</p>
                        <button className="add-mini" type="button" aria-label={`Agregar ${p.nombre}`}
                          onClick={(e) => { e.stopPropagation(); agregar(aProducto(p)); volar(e.currentTarget.closest('.card')?.querySelector('img') || null) }}>+</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        {mostrarCombo && (
          <section className="cat" id="combo">
            <header className="cat-head" data-reveal><p className="cat-num">{String(cats.length + 1).padStart(2, '0')}</p><h2>Arma tu combo</h2><p>Escoge un plato, un acompañante y una bebida. El combo sale con {carta.combo.descuento} % menos.</p></header>
            <div className="combo" data-reveal>
              <div className="combo-img"><img ref={comboImg} src="/img/combo.webp" alt="Combo de hamburguesa, papas y bebida" loading="lazy" decoding="async" /><span className="combo-ahorro">−{carta.combo.descuento} %</span></div>
              <form className="combo-form" noValidate onSubmit={agregarCombo}>
                {([['plato', '1 · Plato'], ['lado', '2 · Acompañante'], ['bebida', '3 · Bebida']] as const).map(([k, leyenda]) => (
                  opciones[k].length > (k === 'plato' ? 0 : 1) && (
                    <fieldset key={k}>
                      <legend>{leyenda}</legend>
                      <div className="pills">
                        {opciones[k].map((o, i) => (
                          <label className="pill" key={k + i}>
                            <input type="radio" name={k} checked={(eleccion[k] || 0) === i} onChange={() => setEleccion((s) => ({ ...s, [k]: i }))} />
                            <span>{o.nombre}{o.id && <> <small>{pesos(o.precio)}</small></>}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )
                ))}
                <div className="combo-total">
                  <div><p className="combo-antes">{pesos(comboLleno)}</p><p className="combo-precio">{pesos(comboPrecio)}</p></div>
                  <button className="btn" type="submit">Agregar combo</button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="info" id="info">
          <div className="info-card" data-reveal><h3>Horario</h3><p>{n.dias}<br /><b>{horaBonita(n.abre)} a {horaBonita(n.cierra)}</b></p></div>
          <div className="info-card" data-reveal>
            <h3>Dónde estamos</h3>
            <p>{n.direccion}{n.ciudad && <><br />{n.ciudad}</>}{n.mapa && <><br /><a className="link" href={n.mapa} target="_blank" rel="noopener noreferrer">Ver en el mapa →</a></>}</p>
          </div>
          <div className="info-card" data-reveal>
            <h3>Pedidos</h3>
            <p>WhatsApp<br />{whatsapp ? <a className="link" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><b>{n.telefono || whatsapp}</b></a> : <b>{n.telefono}</b>}</p>
          </div>
        </section>
      </main>

      <footer className="pie">
        <img src={logo} alt="" width={389} height={274} loading="lazy" decoding="async" />
        <p>{n.nombre}{n.tipo ? ` · ${n.tipo}` : ''}</p>
        <p className="pie-nota">Precios en COP con IVA incluido.</p>
        {!preview && <Link className="hecho" href="/">Carta hecha con <b>Selupin</b> · Crea la tuya →</Link>}
      </footer>

      {cantidad > 0 && (
        <button className="cart-bar" type="button" data-cart-bar onClick={() => cajonRef.current?.showModal()}>
          <span><b>{cantidad}</b> en tu pedido</span>
          <span>Ver pedido · <b>{pesos(total)}</b></span>
        </button>
      )}

      {/* Detalle de plato */}
      <dialog className="modal" ref={modalRef} aria-labelledby="modal-titulo" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
        <form className="modal-in" onSubmit={confirmarPlato}>
          <button className="modal-x" type="button" aria-label="Cerrar" onClick={() => modalRef.current?.close()}>×</button>
          <img className="modal-img" ref={modalImg} src={plato?.img || logo} alt={plato?.name || ''} />
          <div className="modal-body">
            <h2 id="modal-titulo">{plato?.name}</h2>
            <p className="modal-desc">{plato?.desc}</p>
            <label className="campo"><span>¿Alguna indicación?</span>
              <textarea rows={2} placeholder="Sin cebolla, salsa aparte…" value={nota} onChange={(e) => setNota(e.target.value)} />
            </label>
            <div className="modal-foot">
              <div className="qty">
                <button type="button" aria-label="Quitar uno" onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
                <output>{qty}</output>
                <button type="button" aria-label="Agregar uno" onClick={() => setQty((v) => Math.min(20, v + 1))}>+</button>
              </div>
              <button className="btn" type="submit">Agregar {pesos((plato?.price || 0) * qty)}</button>
            </div>
          </div>
        </form>
      </dialog>

      {/* Pedido */}
      <dialog className="drawer" ref={cajonRef} aria-labelledby="drawer-titulo" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
        <div className="drawer-in">
          <header className="drawer-head">
            <h2 id="drawer-titulo">Tu <em>pedido</em></h2>
            <button className="modal-x" type="button" aria-label="Cerrar" onClick={() => cajonRef.current?.close()}>×</button>
          </header>
          {cantidad === 0 ? <p className="vacio">Tu pedido está vacío. Agrega algo rico de la carta.</p> : (
            <>
              <ul className="lineas">
                {pedido.map((l, i) => (
                  <li className="linea" key={l.key}>
                    {l.img ? <img src={l.img} alt="" width={56} height={56} /> : <span className="sin-foto mini">🍽</span>}
                    <div><h3>{l.name}</h3>{l.nota && <p className="nota-linea">{l.nota}</p>}<p className="precio">{pesos(l.price * l.qty)}</p></div>
                    <div className="qty">
                      <button type="button" aria-label="Quitar uno" onClick={() => cambiarQty(i, -1)}>−</button>
                      <output>{l.qty}</output>
                      <button type="button" aria-label="Agregar uno" onClick={() => cambiarQty(i, 1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="checkout" noValidate onSubmit={enviar}>
                <div className="pills">
                  {['Domicilio', 'Recoger en el local'].map((v) => (
                    <label className="pill" key={v}><input type="radio" name="entrega" checked={entrega === v} onChange={() => setEntrega(v)} /><span>{v === 'Domicilio' ? '🛵 Domicilio' : '📍 Recoger'}</span></label>
                  ))}
                </div>
                <label className="campo"><span>Tu nombre</span><input name="nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
                {entrega === 'Domicilio' && <label className="campo"><span>Dirección y barrio</span><input name="direccion" autoComplete="street-address" value={dir} onChange={(e) => setDir(e.target.value)} /></label>}
                <div className="pills">
                  {['Efectivo', 'Nequi', 'Tarjeta'].map((v) => (
                    <label className="pill" key={v}><input type="radio" name="pago" checked={pago === v} onChange={() => setPago(v)} /><span>{v}</span></label>
                  ))}
                </div>
                <div className="totales">
                  <p><span>Subtotal</span><b>{pesos(subtotal)}</b></p>
                  {entrega === 'Domicilio' && <p><span>Domicilio</span><b>{pesos(domicilio)}</b></p>}
                  <p className="total"><span>Total</span><b>{pesos(total)}</b></p>
                </div>
                {error && <p className="error">{error}</p>}
                <button className="btn btn-wa btn-block" type="submit">Enviar pedido por WhatsApp</button>
              </form>
            </>
          )}
        </div>
      </dialog>

      <div className={'toast' + (aviso ? ' is-on' : '')} role="status" aria-live="polite">{aviso}</div>
      <Efectos preview={preview} />
    </>
  )
}
