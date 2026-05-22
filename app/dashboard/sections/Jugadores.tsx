'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const NIVEL_CONFIG = {
  recreativo:  { label: 'Recreativo',  bg: '#dcfce7', color: '#16a34a' },
  intermedio:  { label: 'Intermedio',  bg: '#dbeafe', color: '#2563eb' },
  avanzado:    { label: 'Avanzado',    bg: '#ffedd5', color: '#ea580c' },
  competitivo: { label: 'Competitivo', bg: '#fee2e2', color: '#dc2626' },
} as const

type Nivel = keyof typeof NIVEL_CONFIG

type Jugador = {
  id: string
  nombre: string
  email: string
  ciudad: string
  nivel: string
  telefono: string
  created_at: string
  foto_url: string | null
}

type EditForm = {
  nombre: string
  ciudad: string
  telefono: string
  nivel: Nivel
}

export default function JugadoresSection() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Jugador | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Jugador | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJugadores = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('jugadores')
      .select('*')
      .order('created_at', { ascending: false })
    setJugadores(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchJugadores() }, [fetchJugadores])

  const filtered = jugadores.filter((j) => {
    const q = search.toLowerCase()
    return (
      j.nombre?.toLowerCase().includes(q) ||
      j.email?.toLowerCase().includes(q)
    )
  })

  function openEdit(j: Jugador) {
    setEditTarget(j)
    setEditForm({
      nombre: j.nombre ?? '',
      ciudad: j.ciudad ?? '',
      telefono: j.telefono ?? '',
      nivel: (j.nivel as Nivel) ?? 'recreativo',
    })
    setError(null)
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm) return
    setEditLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('jugadores')
      .update({
        nombre: editForm.nombre,
        ciudad: editForm.ciudad,
        telefono: editForm.telefono,
        nivel: editForm.nivel,
      })
      .eq('id', editTarget.id)
    if (err) {
      setError('Error al guardar los cambios.')
    } else {
      setEditTarget(null)
      setEditForm(null)
      await fetchJugadores()
    }
    setEditLoading(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('jugadores').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleteLoading(false)
    await fetchJugadores()
  }

  function formatDate(iso: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Jugadores</h1>
      <p className="text-gray-500 mb-6">
        {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''} registrado{jugadores.length !== 1 ? 's' : ''}
      </p>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando jugadores…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search ? 'No se encontraron jugadores.' : 'No hay jugadores registrados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Jugador', 'Ciudad', 'Nivel', 'Teléfono', 'Registro', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((j) => {
                  const cfg = NIVEL_CONFIG[j.nivel as Nivel]
                  return (
                    <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{j.nombre || '—'}</div>
                        <div className="text-xs text-gray-400">{j.email}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{j.ciudad || '—'}</td>
                      <td className="px-5 py-4">
                        {cfg ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{j.telefono || '—'}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(j.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(j)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteTarget(j)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && editForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Editar jugador</h2>
            <p className="text-sm text-gray-500 mb-5">{editTarget.email}</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Field label="Nombre completo">
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Ciudad">
                <input
                  type="text"
                  value={editForm.ciudad}
                  onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Nivel">
                <select
                  value={editForm.nivel}
                  onChange={(e) => setEditForm({ ...editForm, nivel: e.target.value as Nivel })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
                >
                  {(Object.entries(NIVEL_CONFIG) as [Nivel, typeof NIVEL_CONFIG[Nivel]][]).map(
                    ([id, cfg]) => (
                      <option key={id} value={id}>{cfg.label}</option>
                    )
                  )}
                </select>
              </Field>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditTarget(null); setEditForm(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#1A6B3C' }}
              >
                {editLoading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl mx-auto mb-4">
              🗑️
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¿Estás seguro?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará permanentemente a{' '}
              <span className="font-semibold text-gray-700">{deleteTarget.nombre || deleteTarget.email}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
