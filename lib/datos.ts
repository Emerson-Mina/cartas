/* Tipos y datos de ejemplo de la carta. El panel guarda una copia editada
   en el navegador; si no hay copia, la carta usa estos datos. */

export type RolCombo = 'plato' | 'lado' | 'bebida' | ''

export interface Plato {
  id: string
  nombre: string
  desc: string
  precio: number
  img: string
  etiqueta: string
  activo: boolean
}

export interface Categoria {
  id: string
  nombre: string
  emoji: string
  combo: RolCombo
  descripcion: string
  items: Plato[]
}

export interface Negocio {
  nombre: string
  tipo: string
  logo: string
  whatsapp: string
  telefono: string
  direccion: string
  ciudad: string
  mapa: string
  dias: string
  abre: string
  cierra: string
  domicilio: number
  tiempo: string
  pagos: string
  titulo1: string
  titulo2: string
  texto: string
  portada: string
}

export interface Carta {
  version: number
  negocio: Negocio
  destacado: string
  combo: { activo: boolean; descuento: number }
  categorias: Categoria[]
}

export interface Plan {
  id: string
  nombre: string
  precio: number
  nota: string
  destacado?: boolean
  incluye: string[]
}

export const LOGO_SELUPIN = '/img/selupin-logo.webp'

const p = (id: string, nombre: string, desc: string, precio: number, img: string, etiqueta = ''): Plato =>
  ({ id, nombre, desc, precio, img: `/img/${img}.webp`, etiqueta, activo: true })

export const CARTA_DEMO: Carta = {
  version: 1,
  negocio: {
    nombre: 'Selupin',
    tipo: 'Comidas rápidas',
    logo: '',
    whatsapp: '573000000000',
    telefono: '300 000 0000',
    direccion: 'Calle 00 # 00-00',
    ciudad: 'Tu ciudad',
    mapa: '',
    dias: 'Lunes a domingo',
    abre: '12:00',
    cierra: '22:00',
    domicilio: 4000,
    tiempo: '30–40 min',
    pagos: 'Efectivo, Nequi o tarjeta',
    titulo1: 'Hambre de',
    titulo2: 'lo bueno.',
    texto: 'Hamburguesas a la plancha, perros, papas y alitas. Armas tu pedido aquí y nos llega por WhatsApp.',
    portada: '/img/hero.webp',
  },
  destacado: 'doble',
  combo: { activo: true, descuento: 15 },
  categorias: [
    {
      id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔', combo: 'plato',
      descripcion: 'Carne de res de 120 g a la plancha y pan brioche. Todas vienen con papas a la francesa.',
      items: [
        p('clasica', 'Clásica', 'Carne, queso, lechuga, tomate y salsa de la casa.', 18900, 'hamburguesa-clasica'),
        p('doble', 'Doble queso', 'Dos carnes, doble cheddar y cebolla caramelizada.', 24900, 'hamburguesa-doble', 'Más pedida'),
        p('bbq', 'BBQ tocineta', 'Tocineta crocante, aros de cebolla y salsa BBQ ahumada.', 26900, 'hamburguesa-bbq'),
        p('pollo', 'Pollo crispy', 'Pechuga apanada, pepinillos, repollo y mayonesa de ajo.', 22900, 'hamburguesa-pollo', 'Nueva'),
      ],
    },
    {
      id: 'perros', nombre: 'Perros', emoji: '🌭', combo: 'plato',
      descripcion: 'Salchicha americana en pan suave, con papita triturada encima.',
      items: [
        p('perro', 'Sencillo', 'Salchicha, queso rallado, cebolla, salsas y papita triturada.', 12900, 'perro-sencillo'),
        p('perro-especial', 'Especial', 'Chili con carne, cheddar, jalapeños, pico de gallo y cebolla.', 17900, 'perro-especial', 'Picante'),
      ],
    },
    {
      id: 'papas', nombre: 'Papas', emoji: '🍟', combo: 'lado',
      descripcion: 'Papa a la francesa recién frita, para compartir o no.',
      items: [
        p('salchipapa', 'Salchipapa de la casa', 'Papas, salchicha en salsa de la casa, queso gratinado y tocineta.', 19900, 'salchipapa', 'Para 2'),
        p('papas-cheddar', 'Cheddar y carne', 'Bañadas en cheddar caliente con carne molida y cebollín.', 15900, 'papas-cheddar'),
      ],
    },
    {
      id: 'alitas', nombre: 'Alitas', emoji: '🍗', combo: 'lado',
      descripcion: 'Ocho alitas con palitos de zanahoria y apio. Escribe la salsa en la nota.',
      items: [p('alitas', 'Alitas x8', 'BBQ, miel mostaza o búfalo picante.', 23900, 'alitas', 'Picante')],
    },
    {
      id: 'bebidas', nombre: 'Bebidas', emoji: '🥤', combo: 'bebida', descripcion: 'Bien frías.',
      items: [
        p('gaseosa', 'Gaseosa 400 ml', 'Cola, naranja, uva o limón.', 5000, 'gaseosa'),
        p('limonada', 'Limonada natural', 'Limón recién exprimido, con hielo.', 7900, 'limonada'),
        p('malteada', 'Malteada', 'Vainilla, chocolate o fresa.', 12900, 'malteada'),
      ],
    },
    {
      id: 'postres', nombre: 'Postres', emoji: '🍫', combo: '', descripcion: 'Para cerrar.',
      items: [p('brownie', 'Brownie con helado', 'Brownie tibio, bola de vainilla y salsa de chocolate.', 11900, 'brownie')],
    },
  ],
}

export const PLANES: Plan[] = [
  {
    id: 'basico', nombre: 'Básico', precio: 29900, nota: 'Para empezar',
    incluye: ['Carta digital con enlace y código QR', 'Hasta 30 platos con foto', 'Pedidos por WhatsApp', 'Horario, ubicación y domicilio', 'Cambios ilimitados desde el panel'],
  },
  {
    id: 'pro', nombre: 'Pro', precio: 59900, nota: 'Para vender más', destacado: true,
    incluye: ['Todo lo del Básico', 'Platos ilimitados', 'Arma tu combo con descuento', 'Plato destacado y etiquetas', 'Buscador en la carta', 'Tu logo y tu portada'],
  },
  {
    id: 'negocio', nombre: 'Negocio', precio: 99900, nota: 'Varias sedes',
    incluye: ['Todo lo del Pro', 'Hasta 3 sedes con su carta', 'Dominio propio (tunegocio.com)', 'QR por mesa', 'Soporte prioritario por WhatsApp'],
  },
]

export const WHATSAPP_VENTAS = '573000000000'
