'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/*
  Required Supabase table (run once in SQL editor):

  CREATE TABLE IF NOT EXISTS noticias (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo text NOT NULL,
    contenido text NOT NULL,
    imagen_url text,
    categoria text NOT NULL,
    fecha date NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public_read" ON noticias FOR SELECT USING (true);
  CREATE POLICY "admin_all"   ON noticias USING (true) WITH CHECK (true);
*/

const CATEGORIAS = ['Tenis mundial', 'ServeUp'] as const
type Categoria = (typeof CATEGORIAS)[number]

type Noticia = {
  id: string
  titulo: string
  contenido: string
  imagen_url: string | null
  categoria: string
  fecha: string
  created_at: string
}

type Form = {
  titulo: string
  contenido: string
  imagen_url: string
  categoria: Categoria
  fecha: string
}

const EMPTY_FORM: Form = {
  titulo: '',
  contenido: '',
  imagen_url: '',
  categoria: 'ServeUp',
  fecha: new Date().toISOString().slice(0, 10),
}

export default function NoticiasSection() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Noticia | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNoticias = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      setTableError(true)
    } else {
      setNoticias(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNoticias() }, [fetchNoticias])

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(n: Noticia) {
    setEditId(n.id)
    setForm({
      titulo: n.titulo,
      contenido: n.contenido,
      imagen_url: n.imagen_url ?? '',
      categoria: (CATEGORIAS.includes(n.categoria as Categoria) ? n.categoria : 'ServeUp') as Categoria,
      fecha: n.fecha.slice(0, 10),
    })
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const supabase = createClient()
    const payload = {
      titulo: form.titulo,
      contenido: form.contenido,
      imagen_url: form.imagen_url || null,
      categoria: form.categoria,
      fecha: form.fecha,
    }

    let err
    if (editId) {
      ;({ error: err } = await supabase.from('noticias').update(payload).eq('id', editId))
    } else {
      ;({ error: err } = await supabase.from('noticias').insert(payload))
    }

    if (err) {
      setFormError('Error al guardar la noticia.')
    } else {
      setShowForm(false)
      await fetchNoticias()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('noticias').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    await fetchNoticias()
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  if (tableError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Noticias</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">La tabla <code>noticias</code> no existe aún.</p>
          <p>Crea la tabla en el SQL Editor de Supabase. El esquema está comentado en el archivo <code>Noticias.tsx</code>.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Noticias</h1>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1A6B3C' }}
        >
          + Nueva noticia
        </button>
      </div>
      <p className="text-gray-500 mb-6">Publica noticias de tenis y ServeUp.</p>

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-400 text-sm py-10">Cargando noticias…</div>
      ) : noticias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: '#f0faf4' }}
          >
            📰
          </div>
          <p className="text-sm text-gray-400">No hay noticias publicadas todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {noticias.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
              {n.imagen_url && (
                <img
                  src={n.imagen_url}
                  alt={n.titulo}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
                      style={{
                        backgroundColor: n.categoria === 'ServeUp' ? '#f0faf4' : '#eff6ff',
                        color: n.categoria === 'ServeUp' ? '#1A6B3C' : '#2563eb',
                      }}
                    >
                      {n.categoria}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{n.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(n.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(n)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(n)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{n.contenido}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editId ? 'Editar noticia' : 'Nueva noticia'}
            </h2>

            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <FormField label="Título">
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                  placeholder="Ej: Federer anuncia su regreso"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Categoría">
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors bg-white"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Fecha">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                  />
                </FormField>
              </div>

              <FormField label="Imagen (URL, opcional)">
                <input
                  type="url"
                  value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors"
                />
              </FormField>

              <FormField label="Contenido">
                <textarea
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  required
                  rows={5}
                  placeholder="Escribe el contenido de la noticia…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6B3C] transition-colors resize-none"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#1A6B3C' }}
                >
                  {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl mx-auto mb-4">
              🗑️
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¿Estás seguro?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará la noticia{' '}
              <span className="font-semibold text-gray-700">&ldquo;{deleteTarget.titulo}&rdquo;</span>.
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
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
