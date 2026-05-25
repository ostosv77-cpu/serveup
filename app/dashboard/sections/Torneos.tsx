'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Categoria = 'A' | 'B' | 'C'

const CAT_META: Record<Categoria, { label: string; desc: string }> = {
  A: { label: 'Categoría A', desc: 'Competitivo' },
  B: { label: 'Categoría B', desc: 'Avanzado / Intermedio' },
  C: { label: 'Categoría C', desc: 'Recreativo' },
}

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  inscripciones_abiertas: { label: 'Inscripciones abiertas', bg: '#dcfce7', color: '#16a34a' },
  en_curso:               { label: 'En curso',               bg: '#fef9c3', color: '#ca8a04' },
  finalizado:             { label: 'Finalizado',             bg: '#f3f4f6', color: '#6b7280' },
}

type CatData = { cupos: string; precio: string }

type TorneoForm = {
  nombre: string
  ciudad: string
  pais: string
  li: string
  lf: string
  pi: string
  pf: string
  descripcion: string
  cats: Record<Categoria, boolean>
  catData: Record<Categoria, CatData>
}

type CategoriaDB = {
  id: string
  torneo_id: string
  categoria: Categoria
  cupos_maximos: number
  cupos_disponibles: number
  precio_inscripcion: number
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
  estado: string
  created_at: string
  categorias_torneo: CategoriaDB[]
}

function initForm(): TorneoForm {
  return {
    nombre: '', ciudad: '', pais: 'Colombia',
    li: '', lf: '', pi: '', pf: '',
    descripcion: '',
    cats: { A: false, B: false, C: false },
    catData: {
      A: { cupos: '', precio: '' },
      B: { cupos: '', precio: '' },
      C: { cupos: '', precio: '' },
    },
  }
}

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function TorneosSection() {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [detailTorneo, setDetailTorneo] = useState<Torneo | null>(null)
  const [form, setForm] = useState<TorneoForm>(initForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchTorneos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('torneos')
      .select('*, categorias_torneo(*)')
      .order('created_at', { ascending: false })
    setTorneos((data as Torneo[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTorneos() }, [fetchTorneos])

  function validate(): string | null {
    if (!form.nombre.trim()) return 'El nombre del torneo es obligatorio.'
    if (!form.ciudad.trim()) return 'La ciudad es obligatoria.'
    if (!form.pais.trim()) return 'El país es obligatorio.'
    if (!form.li) return 'Introduce la fecha de inicio de la fase liga.'
    if (!form.lf) return 'Introduce la fecha de fin de la fase liga.'
    if (!form.pi) return 'Introduce la fecha de inicio de la fase playoffs.'
    if (!form.pf) return 'Introduce la fecha de fin de la fase playoffs.'

    if (form.li >= form.lf) return 'Inicio de liga debe ser anterior al fin de liga.'
    if (form.lf >= form.pi) return 'Fin de liga debe ser anterior al inicio de playoffs.'
    if (form.pi >= form.pf) return 'Inicio de playoffs debe ser anterior al fin de playoffs.'

    const active = (['A', 'B', 'C'] as Categoria[]).filter(c => form.cats[c])
    if (!active.length) return 'Selecciona al menos una categoría.'

    for (const c of active) {
      const cupos = parseInt(form.catData[c].cupos)
      const precio = parseFloat(form.catData[c].precio)
      if (!form.catData[c].cupos || cupos <= 0) return `Categoría ${c}: los cupos deben ser mayores que 0.`
      if (!form.catData[c].precio || isNaN(precio) || precio < 0) return `Categoría ${c}: el precio de inscripción es inválido.`
    }
    return null
  }

  async function handleCreate() {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError(null)
    const supabase = createClient()

    const { data: torneo, error: e1 } = await supabase
      .from('torneos')
      .insert({
        nombre: form.nombre.trim(),
        ciudad: form.ciudad.trim(),
        pais: form.pais.trim(),
        fecha_liga_inicio: form.li,
        fecha_liga_fin: form.lf,
        fecha_playoffs_inicio: form.pi,
        fecha_playoffs_fin: form.pf,
        descripcion: form.descripcion.trim() || null,
      })
      .select()
      .single()

    if (e1 || !torneo) {
      setFormError('Error al crear el torneo. Inténtalo de nuevo.')
      setSaving(false)
      return
    }

    const active = (['A', 'B', 'C'] as Categoria[]).filter(c => form.cats[c])
    const { error: e2 } = await supabase.from('categorias_torneo').insert(
      active.map(c => ({
        torneo_id: torneo.id,
        categoria: c,
        cupos_maximos: parseInt(form.catData[c].cupos),
        cupos_disponibles: parseInt(form.catData[c].cupos),
        precio_inscripcion: parseFloat(form.catData[c].precio),
      }))
    )

    if (e2) {
      setFormError('Torneo creado, pero hubo un error al guardar las categorías.')
    } else {
      setForm(initForm())
      setView('list')
      await fetchTorneos()
    }
    setSaving(false)
  }

  function cancelForm() {
    setView('list')
    setFormError(null)
    setForm(initForm())
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  if (view === 'form') {
    const setF = <K extends keyof TorneoForm>(k: K, v: TorneoForm[K]) =>
      setForm(prev => ({ ...prev, [k]: v }))

    const toggleCat = (c: Categoria) =>
      setForm(prev => ({ ...prev, cats: { ...prev.cats, [c]: !prev.cats[c] } }))

    const setCatField = (c: Categoria, k: keyof CatData, v: string) =>
      setForm(prev => ({
        ...prev,
        catData: { ...prev.catData, [c]: { ...prev.catData[c], [k]: v } },
      }))

    return (
      <div>
        <button
          onClick={cancelForm}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A6B3C] transition-colors mb-6"
        >
          <ChevronLeftIcon /> Torneos
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear nuevo torneo</h1>
        <p className="text-gray-500 text-sm mb-8">Completa la información para publicar el torneo.</p>

        <div className="max-w-2xl flex flex-col gap-5">
          {/* Información general */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900">Información general</h2>
            <Field label="Nombre del torneo">
              <input
                type="text"
                value={form.nombre}
                onChange={e => setF('nombre', e.target.value)}
                placeholder="Ej. Copa ServeUp Bogotá 2025"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ciudad">
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={e => setF('ciudad', e.target.value)}
                  placeholder="Ej. Bogotá"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="País">
                <input
                  type="text"
                  value={form.pais}
                  onChange={e => setF('pais', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
            </div>
            <Field label="Descripción (opcional)">
              <textarea
                value={form.descripcion}
                onChange={e => setF('descripcion', e.target.value)}
                rows={3}
                placeholder="Describe el torneo, reglas especiales, premios…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors resize-none"
              />
            </Field>
          </div>

          {/* Fase Liga */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Fase Liga</h2>
              <p className="text-xs text-gray-400 mt-0.5">Todos los jugadores compiten entre sí</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Inicio de liga">
                <input
                  type="date"
                  value={form.li}
                  onChange={e => setF('li', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Fin de liga">
                <input
                  type="date"
                  value={form.lf}
                  onChange={e => setF('lf', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
            </div>
          </div>

          {/* Fase Playoffs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Fase Playoffs</h2>
              <p className="text-xs text-gray-400 mt-0.5">Eliminación directa de los mejores clasificados</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Inicio de playoffs">
                <input
                  type="date"
                  value={form.pi}
                  onChange={e => setF('pi', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Fin de playoffs">
                <input
                  type="date"
                  value={form.pf}
                  onChange={e => setF('pf', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-semibold text-gray-900">Categorías</h2>
              <p className="text-xs text-gray-400 mt-0.5">Activa las categorías y configura cupos y precio</p>
            </div>

            {(['A', 'B', 'C'] as Categoria[]).map(c => (
              <div key={c}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.cats[c]}
                    onChange={() => toggleCat(c)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                      form.cats[c] ? 'border-[#1A6B3C] bg-[#1A6B3C]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {form.cats[c] && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{CAT_META[c].label}</span>
                    <span className="text-xs text-gray-400 ml-2">{CAT_META[c].desc}</span>
                  </div>
                </label>

                {form.cats[c] && (
                  <div className="mt-3 ml-8 grid grid-cols-2 gap-4">
                    <Field label="Cupos máximos">
                      <input
                        type="number"
                        min="1"
                        value={form.catData[c].cupos}
                        onChange={e => setCatField(c, 'cupos', e.target.value)}
                        placeholder="Ej. 16"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                      />
                    </Field>
                    <Field label="Precio inscripción (COP)">
                      <input
                        type="number"
                        min="0"
                        value={form.catData[c].precio}
                        onChange={e => setCatField(c, 'precio', e.target.value)}
                        placeholder="Ej. 150000"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </div>

          {formError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button
              onClick={cancelForm}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#1A6B3C' }}
            >
              {saving ? 'Creando torneo…' : 'Crear torneo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Torneos</h1>
          <p className="text-gray-500 text-sm">
            {loading
              ? 'Cargando…'
              : `${torneos.length} torneo${torneos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setView('form')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1A6B3C' }}
        >
          <PlusIcon /> Crear torneo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando torneos…</div>
      ) : torneos.length === 0 ? (
        <EmptyState onCreateClick={() => setView('form')} />
      ) : (
        <div className="flex flex-col gap-4">
          {torneos.map(t => {
            const estado = ESTADO_META[t.estado] ?? ESTADO_META.inscripciones_abiertas
            const cats = (t.categorias_torneo ?? []).sort((a, b) =>
              a.categoria.localeCompare(b.categoria)
            )
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h2 className="font-semibold text-gray-900 text-base">{t.nombre}</h2>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: estado.bg, color: estado.color }}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {t.ciudad}, {t.pais}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                    <span>
                      <span className="font-medium text-gray-700">Liga: </span>
                      {fmtDate(t.fecha_liga_inicio)} – {fmtDate(t.fecha_liga_fin)}
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">Playoffs: </span>
                      {fmtDate(t.fecha_playoffs_inicio)} – {fmtDate(t.fecha_playoffs_fin)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cats.map(cat => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#f0faf4', color: '#1A6B3C' }}
                      >
                        Cat. {cat.categoria} · {cat.cupos_disponibles}/{cat.cupos_maximos} cupos
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setDetailTorneo(t)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                >
                  Ver detalles
                </button>
              </div>
            )
          })}
        </div>
      )}

      {detailTorneo && (
        <DetailModal torneo={detailTorneo} onClose={() => setDetailTorneo(null)} />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ backgroundColor: '#f0faf4' }}
      >
        🏆
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">No hay torneos creados</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Crea el primer torneo para que los jugadores puedan inscribirse.
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1A6B3C' }}
      >
        + Crear nuevo torneo
      </button>
    </div>
  )
}

function DetailModal({ torneo, onClose }: { torneo: Torneo; onClose: () => void }) {
  const estado = ESTADO_META[torneo.estado] ?? ESTADO_META.inscripciones_abiertas
  const cats = (torneo.categorias_torneo ?? []).sort((a, b) =>
    a.categoria.localeCompare(b.categoria)
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{torneo.nombre}</h2>
            <p className="text-sm text-gray-500">{torneo.ciudad}, {torneo.pais}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-5"
          style={{ backgroundColor: estado.bg, color: estado.color }}
        >
          {estado.label}
        </span>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock label="Liga — inicio" value={fmtDate(torneo.fecha_liga_inicio)} />
            <DetailBlock label="Liga — fin" value={fmtDate(torneo.fecha_liga_fin)} />
            <DetailBlock label="Playoffs — inicio" value={fmtDate(torneo.fecha_playoffs_inicio)} />
            <DetailBlock label="Playoffs — fin" value={fmtDate(torneo.fecha_playoffs_fin)} />
          </div>

          {torneo.descripcion && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</p>
              <p className="text-sm text-gray-700 leading-relaxed">{torneo.descripcion}</p>
            </div>
          )}

          {cats.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categorías</p>
              <div className="flex flex-col gap-2">
                {cats.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Categoría {cat.categoria}
                        <span className="font-normal text-gray-500 ml-1.5">
                          — {CAT_META[cat.categoria]?.desc}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cat.cupos_disponibles} / {cat.cupos_maximos} cupos disponibles
                      </p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#1A6B3C' }}>
                      {fmtCOP(cat.precio_inscripcion)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
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

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
