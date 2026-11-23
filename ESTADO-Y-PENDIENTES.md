# Selupin Cartas: estado y pendientes

Última actualización: 2026-11-23

## La idea

Selupin es una plataforma de **cartas digitales para negocios de comida** (restaurantes, comidas rápidas, pizzerías…):

1. El negocio ve los **planes** en la landing y se registra.
2. Entra con **login** a su **panel** y carga todo: platos, fotos, precios, horario, ubicación y WhatsApp.
3. Cada negocio tiene **su propia página pública**, por ejemplo `selupin.co/c/la-esquina-burger`.
4. El cliente ve la carta, arma su pedido y lo envía por **WhatsApp** al negocio.

---

## Lo que ya está hecho

### Carpetas

| Carpeta | Qué es | Estado |
|---|---|---|
| `~/selupin-carta-next` | **Versión principal**, en Next.js | Funciona como demo |
| `~/selupin-carta` | Versión anterior en HTML/CSS/JS puro | Se deja de referencia |
| `~/referencias/auntoque` | Copia de auntoque.club, solo para inspirarse | No copiar código de ahí |

Las dos carpetas de proyecto tienen su propio repositorio git local, sin subir a ningún remoto.

### Tecnología (`~/selupin-carta-next`)

- **Next.js 16.4.6** con App Router, **React 19** y **TypeScript**. No usa Tailwind: el CSS propio está en `app/globals.css`.
- Fuente: **solo Lato**, servida con `next/font` (lo pidió el usuario).
- Colores de marca: negro `#08090d` y azul del logo `#0141FC`.
- QR: paquete `qrcode-generator` 1.4.4.
- `tsc`, ESLint y `next build` pasan sin errores, y `npm audit` da 0 vulnerabilidades.

### Rutas

| Ruta | Qué hace |
|---|---|
| `/` | Landing: celular con una carta de ejemplo en vivo, "Cómo funciona", "Qué puedes cambiar", **planes**, preguntas frecuentes |
| `/panel` | Panel del negocio con 5 pestañas y vista previa en vivo (detalle abajo) |
| `/carta` | Carta pública: destacado, buscador, categorías, modal del plato, "Arma tu combo", pedido y envío por WhatsApp |
| `/carta?preview=1` | La misma carta, sin splash ni enlaces, para la vista previa del panel |

Las pestañas del panel son:

- **Negocio:** nombre, tipo, logo, portada y textos.
- **Platos y precios:** categorías y platos con foto, precio, descripción, etiqueta, agotado, destacado y orden.
- **Horario y ubicación:** días, horas, dirección, mapa, WhatsApp, domicilio y formas de pago.
- **Combo y respaldo:** combo con descuento y copia en JSON.
- **Compartir y QR:** enlace, QR descargable en PNG y hoja imprimible para mesas.

### Archivos clave

- `lib/datos.ts`: tipos (`Carta`, `Negocio`, `Categoria`, `Plato`, `Plan`), la carta de ejemplo y los **planes**.
- `lib/store.ts`: guardado en `localStorage` con `useSyncExternalStore` (carta y pedido).
- `lib/qr.ts`: SVG y PNG del QR. **Los módulos redondos no se leían**, por eso son cuadrados de borde suave (comprobado con un lector de QR).
- `lib/fotos.ts`: reduce las fotos y las pasa a WebP antes de guardarlas.
- `components/carta/CartaApp.tsx`: la carta pública.
- `components/panel/Panel.tsx`: el panel, que solo se pinta en el navegador (`ssr: false`).

### Planes propuestos (en `lib/datos.ts`)

| Plan | Precio | Incluye |
|---|---|---|
| Básico | $29.900/mes | Hasta 30 platos, QR, pedidos por WhatsApp |
| Pro (destacado) | $59.900/mes | Platos ilimitados, combos, destacado, buscador, logo propio |
| Negocio | $99.900/mes | Hasta 3 sedes, dominio propio, QR por mesa |

Todos con 14 días gratis. Son una propuesta mía: hay que confirmarlos.

### Límite actual

Hoy **todo se guarda en el navegador** (`localStorage`). No hay login real, la carta solo la ve quien la editó y caben unas 40 a 50 fotos (unos 5 MB).

---

## Pendiente

### 1. Decidir dónde va la base de datos ⚠️ (bloquea todo lo demás)

Se intentó crear el proyecto de Supabase **"Selupin Cartas"** (organización "Emerson-Mina's Org", región `us-east-1`) y Supabase lo **rechazó**: el usuario ya tiene **2 proyectos gratis activos**, que es el límite. Hay que elegir una opción:

- **A. Usar el proyecto "Reservas"** (`uqqdbczgufodgrickqzj`) con las tablas en un esquema aparte, `cartas`. Sin costo.
- **B. Pausar un proyecto gratis** que no se use y crear "Selupin Cartas".
- **C. Pasar la organización al plan Pro de Supabase** (desde US$25/mes).

### 2. Login y una página por negocio (con Supabase)

Plan de trabajo, una vez decidido el punto 1:

1. **Tablas**, todas con RLS activado:
   - `negocios`: id, `owner` (usuario), `slug` único, nombre, tipo, logo, portada, textos, WhatsApp, teléfono, dirección, ciudad, mapa, días, abre, cierra, domicilio, tiempo, pagos, plan, `publicado`, fechas.
   - `categorias`: id, `negocio_id`, nombre, emoji, descripción, rol en el combo, orden.
   - `platos`: id, `categoria_id`, nombre, descripción, precio, foto, etiqueta, activo, destacado, orden.
   - `combos`: `negocio_id`, activo, descuento.
2. **Reglas (RLS)**:
   - Cada dueño lee y escribe **solo su negocio**.
   - El público lee solo los negocios con `publicado = true`.
3. **Fotos**: bucket de Storage `cartas`, con carpeta por negocio (`{negocio_id}/...`). Escribe solo el dueño y lee cualquiera. Se reduce y convierte a WebP en el navegador antes de subir (eso ya existe en `lib/fotos.ts`).
4. **Login**: Supabase Auth con correo y contraseña, o enlace mágico. Usar `@supabase/ssr`, igual que la app Selupin.
   - Rutas: `/registro`, `/ingresar` y `/panel` (protegida).
   - Al registrarse se crea el negocio y se elige el `slug`, por ejemplo `la-esquina-burger`, validando que no esté repetido.
5. **Página pública por negocio**: `app/c/[slug]/page.tsx`.
   - Renderizada en el servidor (buena para Google y para compartir).
   - Con metadatos y una imagen para compartir propias de cada negocio.
   - Error 404 si el negocio no existe o no está publicado.
6. **Panel**: cambiar `localStorage` por Supabase en `Panel.tsx`, manteniendo la misma interfaz. Ya está separada en `setNeg`, `setCat`, `setItem` y `setCats`.
7. **QR y enlace**: que apunten a `/c/{slug}` y no a `localhost`.
8. **Claves**: en `.env.local` solo van `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **Nunca** la `service_role`.
9. **Revisar seguridad** con los asesores de Supabase (`get_advisors`) después de crear las tablas.

### 3. Después del login (cuando haya clientes)

- [ ] Hacer cumplir los límites de cada plan (por ejemplo, 30 platos en Básico).
- [ ] Cobro de los planes (Wompi, Mercado Pago o similar) y la prueba de 14 días.
- [ ] Publicar en un hosting (Vercel u otro) con dominio, por ejemplo `selupin.co`.
- [ ] Varias sedes (plan Negocio) y QR por mesa.
- [ ] Estadísticas de visitas de la carta.

### 4. Datos de ejemplo que hay que cambiar

- WhatsApp `573000000000`, teléfono, dirección y ciudad: son de relleno (en `lib/datos.ts` y en la landing).
- El correo y el WhatsApp de ventas de Selupin (`WHATSAPP_VENTAS`) son de relleno.
- Los precios de los planes son una propuesta.
- Las fotos de ejemplo son de Openverse (Creative Commons). Sirven para la demo, pero cada negocio debe subir las suyas. Los créditos están en `lib/creditos-fotos.json`.

### 5. Seguridad en la app Selupin (otro proyecto)

`~/Documentos/Selupin` usa **Next 16.4.3**, que tiene 7 avisos de seguridad de severidad moderada (`npm audit`). Se corrige subiendo a **16.4.6**, como ya se hizo en este proyecto. **No se ha tocado esa app**: falta que el usuario lo apruebe.

---

## Cómo correr el proyecto

```bash
cd ~/selupin-carta-next
npm install
npm run dev                  # desarrollo: http://localhost:3000
npm run build && npx next start -p 3100   # producción local
```
