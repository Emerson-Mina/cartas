'use client'

import dynamic from 'next/dynamic'

/* El panel vive en el navegador (lee y guarda en localStorage), así que no se pinta en el servidor */
const Panel = dynamic(() => import('./Panel'), {
  ssr: false,
  loading: () => <p className="p-cargando">Abriendo tu panel…</p>,
})

export default function PanelCliente({ planId }: { planId: string }) {
  return <Panel planId={planId} />
}
