import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LigaClient from './LigaClient'

export const metadata = { title: 'Tabla de Liga — ServeUp' }

type Torneo = {
  id: string
  nombre: string
  ciudad: string
  pais: string
  fecha_liga_inicio: string
  fecha_liga_fin: string
  fecha_playoffs_inicio: string
  fecha_playoffs_fin: string
  descripcion: string | null
  estado: string | null
  categoria: string
  cupos_maximos: number
  cupos_disponibles: number | null
}

type JugadorRow = {
  id: string
  nombre: string
  ciudad: string
  nivel: string
  telefono: string | null
  foto_url: string | null
}

export default async function LigaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ inscrito?: string }>
}) {
  const { id } = await params
  const { inscrito } = await searchParams

  const supabase = await createClient()

  // Usuario actual (opcional — página pública)
  const { data: { user } } = await supabase.auth.getUser()

  // Torneo
  const { data: torneo, error: torneoErr } = await supabase
    .from('torneos')
    .select('id, nombre, ciudad, pais, fecha_liga_inicio, fecha_liga_fin, fecha_playoffs_inicio, fecha_playoffs_fin, descripcion, estado, categoria, cupos_maximos, cupos_disponibles')
    .eq('id', id)
    .single()

  if (torneoErr || !torneo) notFound()

  // Inscripciones activas del torneo
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select('jugador_id')
    .eq('torneo_id', id)
    .eq('estado', 'activa')

  const jugadorIds = (inscripciones ?? []).map((i: { jugador_id: string }) => i.jugador_id)

  // Jugadores inscritos
  const { data: jugadores } =
    jugadorIds.length > 0
      ? await supabase
          .from('jugadores')
          .select('id, nombre, ciudad, nivel, telefono, foto_url')
          .in('id', jugadorIds)
      : { data: [] as JugadorRow[] }

  const isUserInscrito = user ? jugadorIds.includes(user.id) : false

  return (
    <LigaClient
      torneo={torneo as Torneo}
      players={(jugadores ?? []) as JugadorRow[]}
      isUserInscrito={isUserInscrito}
      currentUserId={user?.id ?? null}
      inscritoSuccess={inscrito === '1'}
    />
  )
}
