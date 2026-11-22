/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import Efectos from '@/components/Efectos'
import Splash from '@/components/Splash'
import TelefonoTilt from '@/components/TelefonoTilt'
import { LOGO_SELUPIN, PLANES, WHATSAPP_VENTAS } from '@/lib/datos'
import { pesos } from '@/lib/formato'

const PASOS = [
  ['Sube tu carta', 'Escribe tus platos, precios y descripciones. Toma la foto con el celular y súbela.'],
  ['Comparte el enlace', 'Ponlo en tu Instagram y en tu estado de WhatsApp, o imprime el código QR para las mesas.'],
  ['Recibe pedidos', 'El cliente arma su pedido y te llega por WhatsApp con el total y la dirección.'],
]

const FUNCIONES = [
  ['📸', 'Platos y fotos', 'Agrega, ordena o marca como agotado.'],
  ['💲', 'Precios', '¿Subió el queso? Cambias el precio en segundos.'],
  ['🕑', 'Horario', 'Se muestra «Abierto ahora» o «Cerrado» solo.'],
  ['📍', 'Ubicación', 'Dirección y enlace directo a Google Maps.'],
  ['💬', 'WhatsApp', 'El número que recibe los pedidos.'],
  ['🛵', 'Domicilio', 'Costo, tiempo de entrega y formas de pago.'],
  ['⭐', 'Combos y destacado', 'Combo con descuento y tu plato estrella arriba.'],
  ['🎨', 'Tu marca', 'Tu logo, tu portada y tus textos.'],
]

const PREGUNTAS = [
  ['¿Necesito saber de tecnología?', 'No. Si sabes usar WhatsApp, sabes usar el panel. Escribes, subes la foto y listo.'],
  ['¿Cobran comisión por cada pedido?', 'No. Pagas solo el plan mensual. Los pedidos llegan directo a tu WhatsApp.'],
  ['¿Mis clientes tienen que descargar algo?', 'No. Abren el enlace o escanean el QR y la carta se ve en el navegador del celular.'],
  ['¿Puedo cambiar los precios cuando quiera?', 'Sí, todas las veces que quieras. El cambio se ve en la carta al momento.'],
]

const NEGOCIOS = ['Comidas rápidas', 'Restaurantes', 'Pizzerías', 'Asaderos', 'Cafeterías', 'Heladerías']

export default function Inicio() {
  return (
    <>
      <a className="skip-link" href="#planes">Saltar a los planes</a>
      <Splash />
      <div className="glow" aria-hidden="true" />

      <header className="top">
        <Link className="brand" href="/" aria-label="Selupin, inicio">
          <img src={LOGO_SELUPIN} alt="" width={389} height={274} />
          <span>Selupin<small>Cartas digitales</small></span>
        </Link>
        <nav className="l-nav" aria-label="Principal">
          <a href="#como">Cómo funciona</a>
          <a href="#editas">Qué puedes cambiar</a>
          <a href="#planes">Planes</a>
        </nav>
        <Link className="btn btn-sm l-cta-top" href="/panel">Crear mi carta</Link>
      </header>

      <main id="inicio">
        <section className="l-hero">
          <div className="l-hero-copy">
            <p className="eyebrow">Para restaurantes y negocios de comida</p>
            <h1 className="l-title"><span className="line">Tu carta digital,</span><span className="line"><em>lista hoy.</em></span></h1>
            <p className="l-sub">Tus clientes ven los platos con foto, arman el pedido y te llega por WhatsApp. Tú cambias precios, fotos y horario desde el celular, cuando quieras.</p>
            <div className="hero-cta">
              <Link className="btn" href="/panel">Crear mi carta gratis</Link>
              <Link className="btn btn-ghost" href="/carta">Ver una carta de ejemplo →</Link>
            </div>
            <ul className="l-checks"><li>14 días gratis</li><li>Sin comisión por pedido</li><li>Sin descargar apps</li></ul>
          </div>
          <TelefonoTilt />
        </section>

        <div className="cinta" aria-hidden="true">
          <div className="cinta-track">
            {[...NEGOCIOS, ...NEGOCIOS].map((n, i) => <span key={i} style={{ display: 'contents' }}><span>{n}</span><i>✦</i></span>)}
          </div>
        </div>

        <section className="l-sec" id="como">
          <header className="cat-head" data-reveal><p className="cat-num">01</p><h2>Así de <em>fácil</em></h2><p>En una tarde tienes tu carta funcionando.</p></header>
          <ol className="l-pasos">
            {PASOS.map(([t, d], i) => (
              <li className="l-paso" key={t} data-reveal data-spot><span className="l-paso-n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
        </section>

        <section className="l-sec" id="editas">
          <header className="cat-head" data-reveal><p className="cat-num">02</p><h2>Tú tienes <em>el control</em></h2><p>Todo se cambia desde tu panel y se ve al instante en la carta.</p></header>
          <ul className="l-feats">
            {FUNCIONES.map(([ico, t, d]) => (
              <li className="l-feat" key={t} data-reveal data-spot><span className="l-ico" aria-hidden="true">{ico}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ul>
          <div className="l-demo" data-reveal>
            <p>Pruébalo ahora: el panel de ejemplo está abierto, sin registrarte.</p>
            <Link className="btn" href="/panel">Abrir el panel de ejemplo →</Link>
          </div>
        </section>

        <section className="l-sec" id="planes">
          <header className="cat-head" data-reveal><p className="cat-num">03</p><h2>Planes <em>claros</em></h2><p>Precio mensual en pesos colombianos. 14 días gratis en cualquier plan y cancelas cuando quieras.</p></header>
          <div className="l-planes">
            {PLANES.map((p) => (
              <article key={p.id} className={'l-plan' + (p.destacado ? ' l-plan-star' : '')} data-reveal data-spot>
                {p.destacado && <span className="l-plan-sello">El más elegido</span>}
                <h3>{p.nombre}</h3>
                <p className="l-plan-nota">{p.nota}</p>
                <p className="l-plan-precio">{pesos(p.precio)}<small>/mes</small></p>
                <ul className="l-incluye">{p.incluye.map((x) => <li key={x}>{x}</li>)}</ul>
                <Link className={'btn btn-block' + (p.destacado ? '' : ' btn-ghost')} href={`/panel?plan=${p.id}`}>Empezar con {p.nombre}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="l-sec" id="preguntas">
          <header className="cat-head" data-reveal><p className="cat-num">04</p><h2>Preguntas</h2></header>
          <div className="l-faq">
            {PREGUNTAS.map(([q, a]) => <details key={q} data-reveal><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>

        <section className="contacto">
          <p className="eyebrow">Empieza hoy</p>
          <h2 className="l-final">Tu carta, <em>tu negocio.</em></h2>
          <div className="hero-cta l-final-cta">
            <Link className="btn" href="/panel">Crear mi carta gratis</Link>
            <a className="btn btn-ghost" href={`https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent('Hola, quiero una carta digital con Selupin')}`} target="_blank" rel="noopener noreferrer">Hablar por WhatsApp</a>
          </div>
        </section>
      </main>

      <footer className="pie">
        <img src={LOGO_SELUPIN} alt="Selupin" width={389} height={274} loading="lazy" decoding="async" />
        <p>Selupin · Cartas digitales para negocios de comida</p>
        <p className="pie-nota">Precios en COP. Demo de portafolio.</p>
      </footer>
      <Efectos />
    </>
  )
}
