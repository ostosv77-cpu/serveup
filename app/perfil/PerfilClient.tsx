'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

type Nivel = 'recreativo' | 'intermedio' | 'avanzado' | 'competitivo'

type Jugador = {
  id: string
  nombre: string
  email: string
  ciudad: string
  telefono: string
  nivel: string
  foto_url: string | null
}

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
  categoria: string
  cupos_maximos: number
  cupos_disponibles: number | null
  precio_inscripcion: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const NIVEL_META: Record<Nivel, { emoji: string; label: string; cats: string }> = {
  recreativo:  { emoji: '🟢', label: 'Recreativo',  cats: 'Categorías D y C' },
  intermedio:  { emoji: '🔵', label: 'Intermedio',  cats: 'Categorías C y B' },
  avanzado:    { emoji: '🟠', label: 'Avanzado',    cats: 'Categorías B y A' },
  competitivo: { emoji: '🔴', label: 'Competitivo', cats: 'Solo Categoría A' },
}
const NIVEL_OPTIONS: Nivel[] = ['recreativo', 'intermedio', 'avanzado', 'competitivo']

const CAT_META: Record<string, { label: string; bg: string; color: string }> = {
  A: { label: 'Categoría A', bg: '#fee2e2', color: '#dc2626' },
  B: { label: 'Categoría B', bg: '#ffedd5', color: '#ea580c' },
  C: { label: 'Categoría C', bg: '#dbeafe', color: '#2563eb' },
  D: { label: 'Categoría D', bg: '#dcfce7', color: '#16a34a' },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PerfilClient({
  jugador: jugadorInit,
  torneos,
  inscritosIds: inscritosIdsProp,
  activasCount: activasCountProp,
}: {
  jugador: Jugador
  torneos: Torneo[]
  inscritosIds: string[]
  activasCount: number
}) {
  // Profile state
  const [jugador, setJugador] = useState<Jugador>(jugadorInit)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: jugadorInit.nombre,
    ciudad: jugadorInit.ciudad,
    telefono: jugadorInit.telefono,
    nivel: jugadorInit.nivel as Nivel,
  })
  const [newFoto, setNewFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Inscription state
  const [inscritosIds, setInscritosIds] = useState<Set<string>>(new Set(inscritosIdsProp))
  const [cuposMap, setCuposMap] = useState<Record<string, number | null>>(
    Object.fromEntries(torneos.map(t => [t.id, t.cupos_disponibles]))
  )
  const [activasCount, setActivasCount] = useState(activasCountProp)
  const [modal, setModal] = useState<Torneo | null>(null)
  const [inscribing, setInscribing] = useState(false)
  const [inscribirError, setInscribirError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Profile handlers ──────────────────────────────────────────────────────

  function startEdit() {
    setEditForm({
      nombre: jugador.nombre,
      ciudad: jugador.ciudad,
      telefono: jugador.telefono,
      nivel: jugador.nivel as Nivel,
    })
    setNewFoto(null)
    setFotoPreview(null)
    setProfileError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setNewFoto(null)
    setFotoPreview(null)
    setProfileError(null)
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNewFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function saveProfile() {
    if (!editForm.nombre.trim() || !editForm.ciudad.trim()) {
      setProfileError('Nombre y ciudad son obligatorios.')
      return
    }
    setSavingProfile(true)
    setProfileError(null)
    const supabase = createClient()

    let foto_url = jugador.foto_url
    if (newFoto) {
      const ext = newFoto.name.split('.').pop()
      const path = `${jugador.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatares')
        .upload(path, newFoto, { upsert: true })

      if (uploadErr) {
        setProfileError('Error al subir la foto. Intenta de nuevo.')
        setSavingProfile(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path)
      foto_url = urlData.publicUrl
    }

    const { error: dbErr } = await supabase
      .from('jugadores')
      .update({
        nombre: editForm.nombre.trim(),
        ciudad: editForm.ciudad.trim(),
        telefono: editForm.telefono.trim(),
        nivel: editForm.nivel,
        foto_url,
      })
      .eq('id', jugador.id)

    if (dbErr) {
      setProfileError('Error al guardar los cambios. Intenta de nuevo.')
      setSavingProfile(false)
      return
    }

    setJugador(prev => ({
      ...prev,
      nombre: editForm.nombre.trim(),
      ciudad: editForm.ciudad.trim(),
      telefono: editForm.telefono.trim(),
      nivel: editForm.nivel,
      foto_url,
    }))
    setEditing(false)
    setNewFoto(null)
    setFotoPreview(null)
    setSavingProfile(false)
  }

  // ── Inscription handler ───────────────────────────────────────────────────

  async function handleInscribir() {
    if (!modal) return
    setInscribing(true)
    setInscribirError(null)

    const res = await fetch('/api/inscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneo_id: modal.id }),
    })

    const json = await res.json()

    if (!res.ok) {
      setInscribirError(json.error ?? 'Error al inscribirse. Inténtalo de nuevo.')
      setInscribing(false)
      return
    }

    const torneoNombre = modal.nombre
    setInscritosIds(prev => new Set([...prev, modal.id]))
    setCuposMap(prev => ({ ...prev, [modal.id]: Math.max(0, (prev[modal.id] ?? 1) - 1) }))
    setActivasCount(prev => prev + 1)
    setModal(null)
    setInscribing(false)
    setSuccessMsg(`¡Inscripción exitosa en ${torneoNombre}! Revisa tu correo con los detalles.`)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const nivelInfo = NIVEL_META[jugador.nivel as Nivel]
  const reachedLimit = activasCount >= 2

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <TennisBallIcon />
          <span className="text-xl font-bold tracking-tight" style={{ color: '#1A6B3C' }}>
            ServeUp
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{jugador.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* Success banner */}
        {successMsg && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: '#dcfce7', color: '#1A6B3C' }}
          >
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="opacity-60 hover:opacity-100 flex-shrink-0">
              <XIcon />
            </button>
          </div>
        )}

        {/* ── Profile card ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Mi perfil</h2>
            {!editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
              >
                <PencilIcon /> Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-5">
              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#1A6B3C] shrink-0 bg-gray-100 flex items-center justify-center">
                  {fotoPreview || jugador.foto_url ? (
                    <Image
                      src={fotoPreview ?? jugador.foto_url!}
                      alt="Foto"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {newFoto ? newFoto.name : 'Cambiar foto'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre completo">
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                  />
                </Field>
                <Field label="Ciudad">
                  <input
                    type="text"
                    value={editForm.ciudad}
                    onChange={e => setEditForm(p => ({ ...p, ciudad: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel"
                    value={editForm.telefono}
                    onChange={e => setEditForm(p => ({ ...p, telefono: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                  />
                </Field>
                <Field label="Nivel de juego">
                  <select
                    value={editForm.nivel}
                    onChange={e => setEditForm(p => ({ ...p, nivel: e.target.value as Nivel }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
                  >
                    {NIVEL_OPTIONS.map(n => (
                      <option key={n} value={n}>
                        {NIVEL_META[n].emoji} {NIVEL_META[n].label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {profileError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  {profileError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: '#1A6B3C' }}
                >
                  {savingProfile ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shrink-0 bg-gray-100 flex items-center justify-center">
                {jugador.foto_url ? (
                  <Image src={jugador.foto_url} alt={jugador.nombre} fill className="object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">{jugador.nombre}</h3>
                <p className="text-sm text-gray-400 mb-4">{jugador.email}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoChip label="Ciudad" value={jugador.ciudad || '—'} />
                  <InfoChip label="Teléfono" value={jugador.telefono || '—'} />
                  <InfoChip
                    label="Nivel"
                    value={nivelInfo ? `${nivelInfo.emoji} ${nivelInfo.label}` : jugador.nivel}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Torneos disponibles ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Torneos disponibles para mí</h2>
            {nivelInfo && (
              <p className="text-sm text-gray-500 mt-0.5">
                {nivelInfo.cats} · {torneos.length} torneo{torneos.length !== 1 ? 's' : ''} abierto{torneos.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {reachedLimit && (
            <div className="mb-4 flex items-start gap-3 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <span>
                <span className="font-semibold">Ya tienes 2 torneos activos</span> — debes finalizar uno para inscribirte a otro.
              </span>
            </div>
          )}

          {torneos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center gap-3">
              <div className="text-4xl">🎾</div>
              <h3 className="font-semibold text-gray-700">Sin torneos disponibles para tu nivel</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Cuando haya torneos en {nivelInfo?.cats ?? 'tu categoría'} aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {torneos.map(t => {
                const inscrito = inscritosIds.has(t.id)
                const cupos = cuposMap[t.id] ?? t.cupos_disponibles ?? 0
                const sinCupos = cupos <= 0
                const cat = CAT_META[t.categoria] ?? { label: `Cat. ${t.categoria}`, bg: '#f3f4f6', color: '#6b7280' }
                const disabled = inscrito || sinCupos || reachedLimit

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{t.nombre}</h3>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: cat.bg, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        {inscrito && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: '#dcfce7', color: '#1A6B3C' }}
                          >
                            ✓ Inscrito
                          </span>
                        )}
                        {sinCupos && !inscrito && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 bg-red-50 text-red-500">
                            Sin cupos
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mb-3">{t.ciudad}, {t.pais}</p>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-2">
                        <span>
                          <span className="font-medium text-gray-700">Liga: </span>
                          {fmtDate(t.fecha_liga_inicio)} – {fmtDate(t.fecha_liga_fin)}
                        </span>
                        <span>
                          <span className="font-medium text-gray-700">Playoffs: </span>
                          {fmtDate(t.fecha_playoffs_inicio)} – {fmtDate(t.fecha_playoffs_fin)}
                        </span>
                      </div>

                      {/* Cupos + precio */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>
                          <span className="font-medium text-gray-700">Cupos: </span>
                          <span
                            className="font-semibold"
                            style={{ color: sinCupos ? '#dc2626' : '#1A6B3C' }}
                          >
                            {cupos}
                          </span>
                          {' '}/ {t.cupos_maximos} máx.
                        </span>
                        <span className="text-gray-200">·</span>
                        <span>
                          <span className="font-medium text-gray-700">Precio: </span>
                          {fmtCOP(t.precio_inscripcion)}
                        </span>
                      </div>

                      {t.descripcion && (
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                          {t.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 flex items-start pt-0.5">
                      {inscrito ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: '#dcfce7', color: '#1A6B3C' }}
                        >
                          ✓ Inscrito
                        </span>
                      ) : (
                        <button
                          onClick={() => { setModal(t); setInscribirError(null) }}
                          disabled={disabled}
                          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#1A6B3C' }}
                        >
                          Inscribirse
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── Inscription modal ── */}
      {modal && (
        <InscribirModal
          torneo={modal}
          currentCupos={cuposMap[modal.id] ?? modal.cupos_disponibles ?? 0}
          error={inscribirError}
          loading={inscribing}
          onConfirm={handleInscribir}
          onCancel={() => { setModal(null); setInscribirError(null) }}
        />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InscribirModal({
  torneo,
  currentCupos,
  error,
  loading,
  onConfirm,
  onCancel,
}: {
  torneo: Torneo
  currentCupos: number
  error: string | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cat = CAT_META[torneo.categoria] ?? { label: `Cat. ${torneo.categoria}`, bg: '#f3f4f6', color: '#6b7280' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Confirmar inscripción</h2>
        <p className="text-sm text-gray-500 mb-5">
          Revisa los detalles antes de confirmar.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{torneo.nombre}</h3>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: cat.bg, color: cat.color }}
            >
              {cat.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{torneo.ciudad}, {torneo.pais}</p>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <ModalDetail label="Fase Liga" value={`${fmtDate(torneo.fecha_liga_inicio)} – ${fmtDate(torneo.fecha_liga_fin)}`} />
            <ModalDetail label="Fase Playoffs" value={`${fmtDate(torneo.fecha_playoffs_inicio)} – ${fmtDate(torneo.fecha_playoffs_fin)}`} />
            <ModalDetail label="Cupos disponibles" value={`${currentCupos} / ${torneo.cupos_maximos}`} />
            <ModalDetail
              label="Precio inscripción"
              value={fmtCOP(torneo.precio_inscripcion)}
              highlight
            />
          </div>

          {torneo.descripcion && (
            <p className="text-xs text-gray-500 border-t border-gray-200 pt-3 leading-relaxed">
              {torneo.descripcion}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#1A6B3C' }}
          >
            {loading ? 'Inscribiendo…' : 'Confirmar inscripción'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
    >
      {loading ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function ModalDetail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p
        className="text-sm font-semibold"
        style={{ color: highlight ? '#1A6B3C' : '#111827' }}
      >
        {value}
      </p>
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

function PencilIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
