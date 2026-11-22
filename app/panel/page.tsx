import type { Metadata } from 'next'
import PanelCliente from '@/components/panel/PanelCliente'

export const metadata: Metadata = {
  title: 'Panel',
  description: 'Edita tu carta: platos, fotos, precios, horario, ubicación y WhatsApp.',
  robots: { index: false },
}

export default async function PaginaPanel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { plan } = await searchParams
  return <PanelCliente planId={typeof plan === 'string' ? plan : 'pro'} />
}
