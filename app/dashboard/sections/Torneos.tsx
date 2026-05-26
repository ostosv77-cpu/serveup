'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Categoria = 'A' | 'B' | 'C' | 'D'

const CAT_META: Record<Categoria, { label: string; desc: string; bg: string; color: string }> = {
  A: { label: 'Categoría A', desc: 'Abierta',      bg: '#fee2e2', color: '#dc2626' },
  B: { label: 'Categoría B', desc: '4a categoría', bg: '#ffedd5', color: '#ea580c' },
  C: { label: 'Categoría C', desc: '5a categoría', bg: '#dbeafe', color: '#2563eb' },
  D: { label: 'Categoría D', desc: '6a categoría', bg: '#dcfce7', color: '#16a34a' },
}

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  borrador:   { label: 'Borrador',   bg: '#f3f4f6', color: '#6b7280' },
  publicado:  { label: 'Publicado',  bg: '#dcfce7', color: '#1A6B3C' },
  en_curso:   { label: 'En curso',   bg: '#fef9c3', color: '#ca8a04' },
  playoffs:   { label: 'Playoffs',   bg: '#dbeafe', color: '#2563eb' },
  finalizado: { label: 'Finalizado', bg: '#e5e7eb', color: '#374151' },
}

type TorneoForm = {
  nombre: string
  ciudad: string
  pais: string
  categoria: Categoria
  li: string
  lf: string
  pi: string
  pf: string
  cupos_maximos: string
  precio_inscripcion: string
  descripcion: string
  estado: string
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
  estado: string | null
  categoria: Categoria
  cupos_maximos: number
  cupos_disponibles: number | null
  precio_inscripcion: number
  created_at: string
}

function initForm(): TorneoForm {
  return {
    nombre: '', ciudad: '', pais: 'Colombia',
    categoria: 'A',
    li: '', lf: '', pi: '', pf: '',
    cupos_maximos: '', precio_inscripcion: '',
    descripcion: '', estado: 'borrador',
  }
}

function torneoToForm(t: Torneo): TorneoForm {
  return {
    nombre: t.nombre,
    ciudad: t.ciudad,
    pais: t.pais,
    categoria: t.categoria,
    li: t.fecha_liga_inicio,
    lf: t.fecha_liga_fin,
    pi: t.fecha_playoffs_inicio,
    pf: t.fecha_playoffs_fin,
    cupos_maximos: String(t.cupos_maximos),
    precio_inscripcion: String(t.precio_inscripcion),
    descripcion: t.descripcion ?? '',
    estado: t.estado ?? 'borrador',
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
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

export default function TorneosSection() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Torneo | null>(null)
  const [detailTorneo, setDetailTorneo] = useState<Torneo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Torneo | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [form, setForm] = useState<TorneoForm>(initForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTorneos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('torneos')
      .select('*')
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
    if (!form.cupos_maximos || parseInt(form.cupos_maximos) <= 0)
      return 'Los cupos máximos deben ser mayores que 0.'
    if (!form.precio_inscripcion || isNaN(parseFloat(form.precio_inscripcion)) || parseFloat(form.precio_inscripcion) < 0)
      return 'El precio de inscripción es inválido.'
    return null
  }

  async function handleCreate() {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError(null)
    const supabase = createClient()
    const cupos = parseInt(form.cupos_maximos)

    const { error } = await supabase.from('torneos').insert({
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim(),
      pais: form.pais.trim(),
      categoria: form.categoria,
      fecha_liga_inicio: form.li,
      fecha_liga_fin: form.lf,
      fecha_playoffs_inicio: form.pi,
      fecha_playoffs_fin: form.pf,
      cupos_maximos: cupos,
      cupos_disponibles: cupos,
      precio_inscripcion: parseFloat(form.precio_inscripcion),
      descripcion: form.descripcion.trim() || null,
      estado: 'borrador',
    })

    if (error) {
      setFormError('Error al crear el torneo. Inténtalo de nuevo.')
    } else {
      setForm(initForm())
      setSuccessMsg('Torneo creado en borrador. Publícalo cuando esté listo.')
      setView('list')
      await fetchTorneos()
    }
    setSaving(false)
  }

  async function handleEdit() {
    if (!editTarget) return
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError(null)
    const supabase = createClient()

    const cuposNew = parseInt(form.cupos_maximos)
    const diff = cuposNew - editTarget.cupos_maximos
    const disponiblesNew = Math.max(0, (editTarget.cupos_disponibles ?? editTarget.cupos_maximos) + diff)

    const { error } = await supabase.from('torneos').update({
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim(),
      pais: form.pais.trim(),
      categoria: form.categoria,
      fecha_liga_inicio: form.li,
      fecha_liga_fin: form.lf,
      fecha_playoffs_inicio: form.pi,
      fecha_playoffs_fin: form.pf,
      cupos_maximos: cuposNew,
      cupos_disponibles: disponiblesNew,
      precio_inscripcion: parseFloat(form.precio_inscripcion),
      descripcion: form.descripcion.trim() || null,
      estado: form.estado,
    }).eq('id', editTarget.id)

    if (error) {
      setFormError('Error al guardar los cambios. Inténtalo de nuevo.')
    } else {
      cancelForm()
      await fetchTorneos()
    }
    setSaving(false)
  }

  async function handlePublish(t: Torneo) {
    setActionLoading(t.id)
    const supabase = createClient()
    await supabase.from('torneos').update({ estado: 'publicado' }).eq('id', t.id)
    setActionLoading(null)
    await fetchTorneos()
  }

  async function handleUnpublish(t: Torneo) {
    setActionLoading(t.id)
    const supabase = createClient()
    await supabase.from('torneos').update({ estado: 'borrador' }).eq('id', t.id)
    setActionLoading(null)
    await fetchTorneos()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const disponibles = deleteTarget.cupos_disponibles ?? deleteTarget.cupos_maximos
    if (disponibles < deleteTarget.cupos_maximos) {
      setDeleteError('No se puede eliminar un torneo con jugadores inscritos.')
      return
    }
    setDeleteLoading(true)
    setDeleteError(null)
    const supabase = createClient()
    const { error } = await supabase.from('torneos').delete().eq('id', deleteTarget.id)
    if (error) {
      setDeleteError('Error al eliminar el torneo.')
    } else {
      setDeleteTarget(null)
      await fetchTorneos()
    }
    setDeleteLoading(false)
  }

  function openEdit(t: Torneo) {
    setEditTarget(t)
    setForm(torneoToForm(t))
    setFormError(null)
    setView('edit')
  }

  function cancelForm() {
    setView('list')
    setFormError(null)
    setForm(initForm())
    setEditTarget(null)
  }

  const isEdit = view === 'edit'

  // ── Form view (create or edit) ─────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    const setF = <K extends keyof TorneoForm>(k: K, v: TorneoForm[K]) =>
      setForm(prev => ({ ...prev, [k]: v }))

    return (
      <div>
        <button
          onClick={cancelForm}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A6B3C] transition-colors mb-6"
        >
          <ChevronLeftIcon /> Torneos
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {isEdit ? 'Editar torneo' : 'Crear nuevo torneo'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {isEdit
            ? 'Modifica los datos del torneo y guarda los cambios.'
            : 'El torneo se guardará en borrador. Podrás publicarlo cuando esté listo.'}
        </p>

        <div className="max-w-2xl flex flex-col gap-5">
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

            <Field label="Categoría del torneo">
              <select
                value={form.categoria}
                onChange={e => setF('categoria', e.target.value as Categoria)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
              >
                {(['A', 'B', 'C', 'D'] as Categoria[]).map(c => (
                  <option key={c} value={c}>
                    {CAT_META[c].label} — {CAT_META[c].desc}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cupos máximos">
                <input
                  type="number"
                  min="1"
                  value={form.cupos_maximos}
                  onChange={e => setF('cupos_maximos', e.target.value)}
                  placeholder="Ej. 16"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </Field>
              <Field label="Precio inscripción (COP)">
                <input
                  type="number"
                  min="0"
                  value={form.precio_inscripcion}
                  onChange={e => setF('precio_inscripcion', e.target.value)}
                  placeholder="Ej. 150000"
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

            {isEdit && (
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={e => setF('estado', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="en_curso">En curso</option>
                  <option value="playoffs">Playoffs</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </Field>
            )}
          </div>

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
              onClick={isEdit ? handleEdit : handleCreate}
              disabled={saving}
              className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#1A6B3C' }}
            >
              {saving
                ? (isEdit ? 'Guardando…' : 'Creando torneo…')
                : (isEdit ? 'Guardar cambios' : 'Crear torneo')}
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
          onClick={() => setView('create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1A6B3C' }}
        >
          <PlusIcon /> Crear torneo
        </button>
      </div>

      {successMsg && (
        <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#dcfce7', color: '#1A6B3C' }}
        >
          <span>✓ {successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando torneos…</div>
      ) : torneos.length === 0 ? (
        <EmptyState onCreateClick={() => setView('create')} />
      ) : (
        <div className="flex flex-col gap-4">
          {torneos.map(t => {
            const estadoKey = (t.estado ?? 'borrador') as string
            const estado = ESTADO_META[estadoKey] ?? ESTADO_META.borrador
            const cat = CAT_META[t.categoria] ?? CAT_META.A
            const isActioning = actionLoading === t.id
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h2 className="font-semibold text-gray-900 text-base">{t.nombre}</h2>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
                    >
                      {cat.label} · {cat.desc}
                    </span>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: estado.bg, color: estado.color }}
                    >
                      {estado.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{t.ciudad}, {t.pais}</p>

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

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>
                      <span className="font-medium text-gray-700">Cupos: </span>
                      {t.cupos_disponibles ?? t.cupos_maximos} disponibles / {t.cupos_maximos} máx.
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>
                      <span className="font-medium text-gray-700">Inscripción: </span>
                      {fmtCOP(t.precio_inscripcion)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-col gap-2 min-w-[130px]">
                  {estadoKey === 'borrador' && (
                    <>
                      <button
                        onClick={() => handlePublish(t)}
                        disabled={isActioning}
                        className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: '#1A6B3C' }}
                      >
                        {isActioning ? '…' : 'Publicar'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(t); setDeleteError(null) }}
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}

                  {estadoKey === 'publicado' && (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnpublish(t)}
                          disabled={isActioning}
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-60"
                        >
                          {isActioning ? '…' : 'Despublicar'}
                        </button>
                        <button
                          onClick={() => openEdit(t)}
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                      <button
                        onClick={() => { setDeleteTarget(t); setDeleteError(null) }}
                        className="w-full px-4 py-2 rounded-xl text-sm font-medium border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </>
                  )}

                  {estadoKey === 'en_curso' && (
                    <button className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      Ver partidos
                    </button>
                  )}

                  {estadoKey === 'playoffs' && (
                    <button className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      Ver bracket
                    </button>
                  )}

                  {estadoKey === 'finalizado' && (
                    <button className="w-full px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      Ver historial
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailTorneo && (
        <DetailModal torneo={detailTorneo} onClose={() => setDetailTorneo(null)} />
      )}

      {deleteTarget && (
        <DeleteModal
          torneo={deleteTarget}
          error={deleteError}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
        />
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
  const estado = ESTADO_META[torneo.estado ?? 'borrador'] ?? ESTADO_META.borrador
  const cat = CAT_META[torneo.categoria] ?? CAT_META.A

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

        <div className="flex flex-wrap gap-2 mb-5">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cat.bg, color: cat.color }}
          >
            {cat.label} · {cat.desc}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: estado.bg, color: estado.color }}
          >
            {estado.label}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock label="Liga — inicio"     value={fmtDate(torneo.fecha_liga_inicio)} />
            <DetailBlock label="Liga — fin"        value={fmtDate(torneo.fecha_liga_fin)} />
            <DetailBlock label="Playoffs — inicio" value={fmtDate(torneo.fecha_playoffs_inicio)} />
            <DetailBlock label="Playoffs — fin"    value={fmtDate(torneo.fecha_playoffs_fin)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock
              label="Cupos disponibles"
              value={`${torneo.cupos_disponibles} / ${torneo.cupos_maximos}`}
            />
            <DetailBlock
              label="Precio inscripción"
              value={fmtCOP(torneo.precio_inscripcion)}
            />
          </div>
          {torneo.descripcion && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Descripción
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{torneo.descripcion}</p>
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

function DeleteModal({
  torneo, error, loading, onConfirm, onCancel,
}: {
  torneo: Torneo
  error: string | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const hasInscribed = (torneo.cupos_disponibles ?? torneo.cupos_maximos) < torneo.cupos_maximos

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl mx-auto mb-4">
          🗑️
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar torneo?</h2>
        <p className="text-sm text-gray-500 mb-5">
          ¿Estás seguro que deseas eliminar{' '}
          <span className="font-semibold text-gray-700">{torneo.nombre}</span>?
          Esta acción no se puede deshacer.
        </p>

        {(error || hasInscribed) && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error ?? 'No se puede eliminar un torneo con jugadores inscritos.'}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || hasInscribed}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
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
