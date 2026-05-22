'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
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

export default function RegistroPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nivel) {
      setError('Selecciona tu nivel de juego.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1. Crear cuenta en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, ciudad, telefono, nivel },
      },
    })

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? 'Este email ya está registrado. ¿Quieres iniciar sesión?'
          : authError.message
      )
      setLoading(false)
      return
    }

    const user = authData.user
    if (!user) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // 2. Subir foto si la hay
    let foto_url: string | null = null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(path, foto, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('avatares')
          .getPublicUrl(path)
        foto_url = urlData.publicUrl
      }
    }

    // 3. Insertar en tabla jugadores
    const { error: dbError } = await supabase.from('jugadores').insert({
      id: user.id,
      nombre,
      ciudad,
      telefono,
      nivel,
      email,
      foto_url,
    })

    if (dbError) {
      setError('Error al guardar tu perfil. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Si no hay sesión activa (confirmación de email pendiente)
    if (!authData.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: '#f0faf4' }}
          >
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-sm text-gray-500">
            Revisa tu email y haz clic en el enlace de confirmación para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: '#1A6B3C' }}
          >
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-gray-500 mb-8">
          Únete a ServeUp y empieza a jugar torneos
        </p>

        {/* TODO: activar cuando Google OAuth esté configurado en Supabase */}
        {/* <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-60 mb-6"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirigiendo…' : 'Registrarse con Google'}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">o con email</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div> */}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegistro} className="flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Carlos Rodríguez"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ciudad */}
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

            {/* Teléfono */}
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

          {/* Nivel de juego */}
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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A6B3C] transition-colors"
            />
          </div>

          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto de perfil{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="flex items-center gap-4">
              {preview ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#1A6B3C] shrink-0">
                  <Image
                    src={preview}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                  <span className="text-gray-400 text-xl">👤</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {foto ? foto.name : 'Seleccionar foto'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ backgroundColor: '#1A6B3C' }}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: '#1A6B3C' }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
