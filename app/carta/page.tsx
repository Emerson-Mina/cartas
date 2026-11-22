import type { Metadata } from 'next'
import CartaApp from '@/components/carta/CartaApp'

export const metadata: Metadata = {
  title: 'Carta',
  description: 'Carta de comidas rápidas: hamburguesas, perros, papas, alitas, combos y bebidas. Pide por WhatsApp.',
}

export default async function PaginaCarta({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  return <CartaApp preview={'preview' in sp} />
}
