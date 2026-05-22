'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NIVEL_CONFIG = {
  recreativo:  { label: 'Recreativo',  bg: '#dcfce7', color: '#16a34a' },
  intermedio:  { label: 'Intermedio',  bg: '#dbeafe', color: '#2563eb' },
  avanzado:    { label: 'Avanzado',    bg: '#ffedd5', color: '#ea580c' },
  competitivo: { label: 'Competitivo', bg: '#fee2e2', color: '#dc2626' },
} as const

type Nivel = keyof typeof NIVEL_CONFIG

type Stats = {
  total: number
  porNivel: Record<Nivel, number>
}

export default function InicioSection() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const { data } = await supabase.from('jugadores').select('nivel')
      if (data) {
        const porNivel: Record<Nivel, number> = {
          recreativo: 0, intermedio: 0, avanzado: 0, competitivo: 0,
        }
        for (const row of data) {
          if (row.nivel in porNivel) porNivel[row.nivel as Nivel]++
        }
        setStats({ total: data.length, porNivel })
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inicio</h1>
      <p className="text-gray-500 mb-8">Resumen general de ServeUp.</p>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="👥"
          label="Total jugadores"
          value={loading ? '—' : String(stats?.total ?? 0)}
          loading={loading}
        />
        <StatCard
          icon="🏆"
          label="Torneos activos"
          value="0"
          loading={false}
        />
        <StatCard
          icon="🎾"
          label="Partidos jugados"
          value="0"
          loading={false}
        />
        <StatCard
          icon="📊"
          label="Niveles registrados"
          value={loading ? '—' : String(Object.values(stats?.porNivel ?? {}).filter(v => v > 0).length)}
          loading={loading}
        />
      </div>

      {/* Jugadores por nivel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Jugadores por nivel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(NIVEL_CONFIG) as [Nivel, typeof NIVEL_CONFIG[Nivel]][]).map(
            ([nivel, cfg]) => {
              const count = stats?.porNivel[nivel] ?? 0
              const total = stats?.total ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={nivel} className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: cfg.bg }}>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {loading ? (
                      <span className="text-lg font-bold text-gray-300">—</span>
                    ) : (
                      <span className="text-2xl font-extrabold" style={{ color: cfg.color }}>
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: cfg.color }}>
                    {pct}% del total
                  </p>
                </div>
              )
            }
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: string
  label: string
  value: string
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: '#f0faf4' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {loading ? (
          <div className="h-7 w-12 rounded bg-gray-100 animate-pulse" />
        ) : (
          <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  )
}
