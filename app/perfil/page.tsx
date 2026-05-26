import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilClient from './PerfilClient'

export const metadata = { title: 'Mi Perfil — ServeUp' }

const NIVEL_CATS: Record<string, string[]> = {
  recreativo:  ['D', 'C'],
  intermedio:  ['C', 'B'],
  avanzado:    ['B', 'A'],
  competitivo: ['A'],
}

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jugador } = await supabase
    .from('jugadores')
    .select('id, nombre, email, ciudad, telefono, nivel, foto_url')
    .eq('id', user.id)
    .single()

  if (!jugador) redirect('/registro')

  const cats = NIVEL_CATS[jugador.nivel] ?? []

  const [{ data: torneos }, { data: inscripciones, count: activasCount }] = await Promise.all([
    supabase
      .from('torneos')
      .select('id, nombre, ciudad, pais, fecha_liga_inicio, fecha_liga_fin, fecha_playoffs_inicio, fecha_playoffs_fin, descripcion, categoria, cupos_maximos, cupos_disponibles, precio_inscripcion')
      .eq('estado', 'publicado')
      .in('categoria', cats.length > 0 ? cats : ['__none__'])
      .order('fecha_liga_inicio', { ascending: true }),
    supabase
      .from('inscripciones')
      .select('torneo_id', { count: 'exact' })
      .eq('jugador_id', user.id)
      .eq('estado', 'activa'),
  ])

  const inscritosIds = (inscripciones ?? []).map((i: { torneo_id: string }) => i.torneo_id)

  return (
    <PerfilClient
      jugador={jugador}
      torneos={(torneos ?? []) as Parameters<typeof PerfilClient>[0]['torneos']}
      inscritosIds={inscritosIds}
      activasCount={activasCount ?? 0}
    />
  )
}
