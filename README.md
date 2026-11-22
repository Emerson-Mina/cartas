# Selupin Cartas (demo)

Carta digital para negocios de comida. Es una demo de portafolio hecha con Next.js 16 (App Router), React 19 y TypeScript.

| Ruta | Qué es |
|---|---|
| `/` | Landing de Selupin con los planes |
| `/panel` | Panel del negocio: platos, fotos, precios, horario, ubicación, WhatsApp, combo, QR |
| `/carta` | Carta pública con pedido por WhatsApp (`/carta?preview=1` es la vista previa del panel) |

## Datos

Esta demo no tiene servidor de datos. La carta editada se guarda en el `localStorage` del navegador (clave `selupin-carta-datos`) y el pedido del cliente en `selupin-pedido`. Si no hay nada guardado, se usa la carta de ejemplo de `lib/datos.ts`.

- `lib/datos.ts`: tipos, carta de ejemplo y planes.
- `lib/store.ts`: lectura y guardado (con `useSyncExternalStore`).
- `lib/qr.ts`: QR con `qrcode-generator`, comprobado con un lector de QR.
- `components/carta/CartaApp.tsx`: carta pública.
- `components/panel/Panel.tsx`: panel (solo se pinta en el navegador).

## Uso

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Las fotos de ejemplo son de Openverse, con licencias Creative Commons. Los créditos están en `lib/creditos-fotos.json`.
