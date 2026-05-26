import { createClient } from '@/lib/supabase/server'

type Categoria = 'A' | 'B' | 'C' | 'D'

const CAT_META: Record<Categoria, { label: string; desc: string; bg: string; color: string }> = {
  A: { label: 'Categoría A', desc: 'Abierta',      bg: '#fee2e2', color: '#dc2626' },
  B: { label: 'Categoría B', desc: '4a categoría', bg: '#ffedd5', color: '#ea580c' },
  C: { label: 'Categoría C', desc: '5a categoría', bg: '#dbeafe', color: '#2563eb' },
  D: { label: 'Categoría D', desc: '6a categoría', bg: '#dcfce7', color: '#16a34a' },
}

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  publicado: { label: 'Inscripciones abiertas', bg: '#dcfce7', color: '#1A6B3C' },
  en_curso:  { label: 'En curso',               bg: '#fef9c3', color: '#ca8a04' },
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
  categoria: Categoria
  cupos_maximos: number
  cupos_disponibles: number
  precio_inscripcion: number
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

export default async function TorneosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('torneos')
    .select('*')
    .in('estado', ['publicado', 'en_curso'])
    .order('fecha_liga_inicio', { ascending: true })

  const torneos = (data as Torneo[]) ?? []

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <a href="/" className="flex items-center gap-2">
          <TennisBallIcon />
          <span className="text-xl font-bold tracking-tight" style={{ color: '#1A6B3C' }}>
            ServeUp
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="/torneos" className="font-semibold" style={{ color: '#1A6B3C' }}>
            Torneos
          </a>
          <a
            href="/login"
            className="hover:text-[#1A6B3C] transition-colors"
          >
            Iniciar sesión
          </a>
          <a
            href="/registro"
            className="px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: '#1A6B3C' }}
          >
            Registrarse
          </a>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Torneos disponibles</h1>
          <p className="text-gray-500">
            {torneos.length === 0
              ? 'No hay torneos con inscripciones abiertas en este momento.'
              : `${torneos.length} torneo${torneos.length !== 1 ? 's' : ''} disponible${torneos.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {torneos.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-16 flex flex-col items-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: '#f0faf4' }}
            >
              🏆
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              Próximamente nuevos torneos
            </h2>
            <p className="text-sm text-gray-400 max-w-sm">
              Regístrate para recibir notificaciones cuando abran nuevas inscripciones.
            </p>
            <a
              href="/registro"
              className="mt-2 px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A6B3C' }}
            >
              Registrarse gratis
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {torneos.map(t => {
              const cat = CAT_META[t.categoria] ?? CAT_META.A
              const estadoMeta = ESTADO_META[t.estado]
              const cuposAgotados = t.cupos_disponibles === 0

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-start gap-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h2 className="font-bold text-gray-900 text-lg">{t.nombre}</h2>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: cat.bg, color: cat.color }}
                      >
                        {cat.label} · {cat.desc}
                      </span>
                      {estadoMeta && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: estadoMeta.bg, color: estadoMeta.color }}
                        >
                          {estadoMeta.label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mb-4">{t.ciudad}, {t.pais}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <InfoBlock
                        icon="📅"
                        label="Fase Liga"
                        value={`${fmtDate(t.fecha_liga_inicio)} – ${fmtDate(t.fecha_liga_fin)}`}
                      />
                      <InfoBlock
                        icon="⚡"
                        label="Fase Playoffs"
                        value={`${fmtDate(t.fecha_playoffs_inicio)} – ${fmtDate(t.fecha_playoffs_fin)}`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-gray-400">👥</span>
                        <span>
                          <span
                            className="font-semibold"
                            style={{ color: cuposAgotados ? '#dc2626' : '#1A6B3C' }}
                          >
                            {cuposAgotados ? 'Sin cupos' : `${t.cupos_disponibles} cupos`}
                          </span>
                          <span className="text-gray-400"> / {t.cupos_maximos} máx.</span>
                        </span>
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <span className="text-gray-400">💰</span>
                        <span className="font-semibold">{fmtCOP(t.precio_inscripcion)}</span>
                      </span>
                    </div>

                    {t.descripcion && (
                      <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {t.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col justify-start">
                    <a
                      href={cuposAgotados ? undefined : '/registro'}
                      aria-disabled={cuposAgotados}
                      className={[
                        'px-6 py-3 rounded-xl text-sm font-semibold text-center transition-opacity',
                        cuposAgotados
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                          : 'text-white hover:opacity-90 shadow-sm',
                      ].join(' ')}
                      style={cuposAgotados ? undefined : { backgroundColor: '#1A6B3C' }}
                    >
                      {cuposAgotados ? 'Cupos agotados' : 'Inscribirse'}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="w-full border-t border-gray-100 py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <TennisBallIcon size={18} />
          <span className="font-semibold" style={{ color: '#1A6B3C' }}>ServeUp</span>
        </div>
        <p>© {new Date().getFullYear()} ServeUp. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

function InfoBlock({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 flex gap-3 items-start">
      <span className="text-base mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function TennisBallIcon({ size = 24, color = '#1A6B3C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
