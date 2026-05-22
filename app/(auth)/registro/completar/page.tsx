'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NIVELES = [
  {
    id: 'recreativo',
    emoji: '🟢',
    nombre: 'Recreativo',
    descripcion: 'Estoy aprendiendo, juego por diversión y ejercicio (0 a 6 meses)',
  },
  {
    id: 'intermedio',
    emoji: '🔵',
    nombre: 'Intermedio',
    descripcion: 'Ya conozco las reglas, juego con cierta consistencia (6 meses a 2 años)',
  },
  {
    id: 'avanzado',
    emoji: '🟠',
    nombre: 'Avanzado',
    descripcion: 'Juego regularmente, tengo técnica definida y competencia (más de 2 años)',
  },
  {
    id: 'competitivo',
    emoji: '🔴',
    nombre: 'Competitivo',
    descripcion: 'Juego torneos frecuentemente, busco alto rendimiento (categoría abierta)',
  },
] as const

type Nivel = (typeof NIVELES)[number]['id']

export default function CompletarPerfilPage() {
  const router = useRouter()
  const [ciudad, setCiudad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserEmail(data.user.email ?? '')
      setUserName(
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        ''
      )
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nivel) {
      setError('Selecciona tu nivel de juego.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: dbError } = await supabase.from('jugadores').insert({
      id: user.id,
      nombre: userName || userEmail,
      ciudad,
      telefono,
      nivel,
      email: userEmail,
      foto_url: user.user_metadata?.avatar_url ?? null,
    })

    if (dbError) {
      setError('Error al guardar tu perfil. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Completa tu perfil
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Solo necesitamos un poco más de información para crear tu cuenta de jugador.
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ciudad
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Bogotá"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nivel de juego
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NIVELES.map((n) => {
                const selected = nivel === n.id
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNivel(n.id)}
                    className="flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: selected ? '#1A6B3C' : '#E5E7EB',
                      backgroundColor: selected ? '#f0faf4' : '#ffffff',
                    }}
                  >
                    <span className="text-lg leading-none">{n.emoji}</span>
                    <span
                      className="text-sm font-semibold mt-1"
                      style={{ color: selected ? '#1A6B3C' : '#111827' }}
                    >
                      {n.nombre}
                    </span>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      {n.descripcion}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ backgroundColor: '#1A6B3C' }}
          >
            {loading ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
