'use client'

import Image from 'next/image'
import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

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

type Player = {
  id: string
  nombre: string
  ciudad: string
  nivel: string
  telefono: string | null
  foto_url: string | null
}

type PlayerRow = Player & {
  pj: number; pg: number; pp: number
  sg: number; sp: number; ds: number; pts: number
}

// ── Constants ─────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; bg: string; color: string }> = {
  A: { label: 'Categoría A', bg: '#fee2e2', color: '#dc2626' },
  B: { label: 'Categoría B', bg: '#ffedd5', color: '#ea580c' },
  C: { label: 'Categoría C', bg: '#dbeafe', color: '#2563eb' },
  D: { label: 'Categoría D', bg: '#dcfce7', color: '#16a34a' },
}

const ESTADO_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  publicado:  { label: 'Inscripciones abiertas', bg: '#dcfce7', color: '#1A6B3C' },
  en_curso:   { label: 'Liga en curso',           bg: '#fef9c3', color: '#ca8a04' },
  playoffs:   { label: 'Playoffs',                bg: '#dbeafe', color: '#2563eb' },
  finalizado: { label: 'Finalizado',              bg: '#e5e7eb', color: '#374151' },
  borrador:   { label: 'Borrador',                bg: '#f3f4f6', color: '#6b7280' },
}

const NIVEL_SHORT: Record<string, string> = {
  recreativo:  '🟢 Rec.',
  intermedio:  '🔵 Inter.',
  avanzado:    '🟠 Avanz.',
  competitivo: '🔴 Comp.',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

function initials(nombre: string) {
  const parts = nombre.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nombre.slice(0, 2).toUpperCase()
}

function buildWaLink(telefono: string, nombre: string, torneoNombre: string) {
  const phone = telefono.replace(/\D/g, '')
  const text = `Hola ${nombre}, te escribo desde ServeUp para coordinar nuestro partido en ${torneoNombre}.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LigaClient({
  torneo,
  players,
  isUserInscrito,
  currentUserId,
  inscritoSuccess,
}: {
  torneo: Torneo
  players: Player[]
  isUserInscrito: boolean
  currentUserId: string | null
  inscritoSuccess: boolean
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showBanner, setShowBanner] = useState(inscritoSuccess)

  const cat = CAT_META[torneo.categoria] ?? { label: `Cat. ${torneo.categoria}`, bg: '#f3f4f6', color: '#6b7280' }
  const estadoMeta = ESTADO_LABEL[torneo.estado ?? 'borrador'] ?? ESTADO_LABEL.borrador

  // Build sorted rows (all stats 0 for now)
  const rows: PlayerRow[] = players
    .map(p => ({ ...p, pj: 0, pg: 0, pp: 0, sg: 0, sp: 0, ds: 0, pts: 0 }))
    .sort((a, b) => b.pts - a.pts || b.ds - a.ds || a.nombre.localeCompare(b.nombre))

  const inscritos = players.length

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <TennisBallIcon />
          <span className="text-xl font-bold tracking-tight" style={{ color: '#1A6B3C' }}>ServeUp</span>
        </a>
        <a
          href="/perfil"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
        >
          <ChevronLeftIcon /> Mis torneos
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Success banner */}
        {showBanner && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: '#dcfce7', color: '#1A6B3C' }}
          >
            <span>🎾 ¡Inscripción exitosa! Revisa tu correo con los detalles del torneo.</span>
            <button onClick={() => setShowBanner(false)} className="opacity-60 hover:opacity-100 flex-shrink-0">
              <XIcon />
            </button>
          </div>
        )}

        {/* Tournament header */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-extrabold text-gray-900">{torneo.nombre}</h1>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: cat.bg, color: cat.color }}
                >
                  {cat.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">{torneo.ciudad}, {torneo.pais}</p>
            </div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: estadoMeta.bg, color: estadoMeta.color }}
            >
              {estadoMeta.label}
            </span>
          </div>

          {/* Fases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <PhaseBlock
              label="Fase Liga"
              icon="📅"
              from={fmtDate(torneo.fecha_liga_inicio)}
              to={fmtDate(torneo.fecha_liga_fin)}
            />
            <PhaseBlock
              label="Fase Playoffs"
              icon="⚡"
              from={fmtDate(torneo.fecha_playoffs_inicio)}
              to={fmtDate(torneo.fecha_playoffs_fin)}
            />
          </div>

          {/* Cupos */}
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{inscritos}</span> jugador{inscritos !== 1 ? 'es' : ''} inscrito{inscritos !== 1 ? 's' : ''} de{' '}
            <span className="font-semibold text-gray-900">{torneo.cupos_maximos}</span> cupos máximos
          </p>
        </section>

        {/* League table */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Tabla de posiciones</h2>
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-14 text-center text-gray-400 text-sm">
              Aún no hay jugadores inscritos en este torneo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-10">#</th>
                    <th className="px-4 py-3 text-left min-w-[160px]">Jugador</th>
                    <th className="px-4 py-3 text-left min-w-[100px]">Ciudad</th>
                    <th className="px-4 py-3 text-center min-w-[80px]">Nivel</th>
                    <th className="px-4 py-3 text-center w-12">PJ</th>
                    <th className="px-4 py-3 text-center w-12">PG</th>
                    <th className="px-4 py-3 text-center w-12">PP</th>
                    <th className="px-4 py-3 text-center w-12">SG</th>
                    <th className="px-4 py-3 text-center w-12">SP</th>
                    <th className="px-4 py-3 text-center w-12">DS</th>
                    <th className="px-4 py-3 text-center w-14 font-bold text-gray-700">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((p, idx) => {
                    const isMe = p.id === currentUserId
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlayer(p)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        style={isMe ? { backgroundColor: '#f0faf4' } : undefined}
                      >
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar nombre={p.nombre} fotoUrl={p.foto_url} size={32} />
                            <span className="font-medium text-gray-900 truncate max-w-[120px]">
                              {p.nombre}
                              {isMe && (
                                <span className="ml-1.5 text-xs font-semibold" style={{ color: '#1A6B3C' }}>
                                  (tú)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[100px]">{p.ciudad}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
                          {NIVEL_SHORT[p.nivel] ?? p.nivel}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.pj}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.pg}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.pp}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.sg}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.sp}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.ds}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{p.pts}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Back button */}
        <div className="flex justify-center pb-4">
          <a
            href="/perfil"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
          >
            ← Volver a mis torneos
          </a>
        </div>
      </main>

      {/* Player modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          torneo={torneo}
          isUserInscrito={isUserInscrito}
          isMe={selectedPlayer.id === currentUserId}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ nombre, fotoUrl, size = 36 }: { nombre: string; fotoUrl: string | null; size?: number }) {
  if (fotoUrl) {
    return (
      <div
        className="relative rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image src={fotoUrl} alt={nombre} fill className="object-cover" />
      </div>
    )
  }
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ width: size, height: size, backgroundColor: '#1A6B3C', fontSize: size * 0.35 }}
    >
      {initials(nombre)}
    </div>
  )
}

function PlayerModal({
  player,
  torneo,
  isUserInscrito,
  isMe,
  onClose,
}: {
  player: Player
  torneo: Torneo
  isUserInscrito: boolean
  isMe: boolean
  onClose: () => void
}) {
  const nivel = NIVEL_SHORT[player.nivel] ?? player.nivel

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <Avatar nombre={player.nombre} fotoUrl={player.foto_url} size={72} />
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{player.nombre}</h3>
            {isMe && (
              <span className="text-xs font-semibold" style={{ color: '#1A6B3C' }}>Este eres tú</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2 mb-5">
          <DetailRow label="Ciudad" value={player.ciudad} />
          <DetailRow label="Nivel" value={nivel} />
        </div>

        {/* WhatsApp — solo si el viewer está inscrito Y no es su propio perfil */}
        {isUserInscrito && !isMe && player.telefono && (
          <a
            href={buildWaLink(player.telefono, player.nombre, torneo.nombre)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold mb-3 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <WhatsAppIcon /> Contactar por WhatsApp
          </a>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

function PhaseBlock({ label, icon, from, to }: { label: string; icon: string; from: string; to: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{from} → {to}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

function TennisBallIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#1A6B3C" strokeWidth="2" />
      <path d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.536 4.07 1.481 5.794L0 24l6.372-1.461A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.36-.214-3.727.854.87-3.64-.236-.376A9.818 9.818 0 0112 2.182c5.422 0 9.818 4.396 9.818 9.818S17.422 21.818 12 21.818z" />
    </svg>
  )
}
