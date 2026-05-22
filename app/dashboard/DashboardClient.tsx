'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InicioSection from './sections/Inicio'
import JugadoresSection from './sections/Jugadores'
import TorneosSection from './sections/Torneos'
import ResultadosSection from './sections/Resultados'
import NoticiasSection from './sections/Noticias'

type Section = 'inicio' | 'jugadores' | 'torneos' | 'resultados' | 'noticias'

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio',      label: 'Inicio',      icon: <HomeIcon /> },
  { id: 'jugadores',   label: 'Jugadores',   icon: <PlayersIcon /> },
  { id: 'torneos',     label: 'Torneos',     icon: <TrophyIcon /> },
  { id: 'resultados',  label: 'Resultados',  icon: <ChartIcon /> },
  { id: 'noticias',    label: 'Noticias',    icon: <NewsIcon /> },
]

export default function DashboardClient() {
  const [active, setActive] = useState<Section>('inicio')
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sectionTitle = NAV.find((n) => n.id === active)?.label ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: '#1A6B3C' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <TennisBallIcon />
          <span className="text-white text-xl font-bold tracking-tight">ServeUp</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setMobileOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Admin badge */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            className="px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
            >
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Admin</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                serveup-admin
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
              ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
            }}
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-4 px-4 py-3 bg-white shrink-0"
          style={{ borderBottom: '1px solid #f3f4f6' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <TennisBallIconDark />
            <span className="font-semibold text-gray-900 text-sm">{sectionTitle}</span>
          </div>
        </div>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          {active === 'inicio'     && <InicioSection />}
          {active === 'jugadores'  && <JugadoresSection />}
          {active === 'torneos'    && <TorneosSection />}
          {active === 'resultados' && <ResultadosSection />}
          {active === 'noticias'   && <NoticiasSection />}
        </main>
      </div>
    </div>
  )
}

/* ── Icons ── */

function TennisBallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
      <path d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TennisBallIconDark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#1A6B3C" strokeWidth="2" />
      <path d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function PlayersIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 22h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4"  strokeLinecap="round" />
      <line x1="6"  y1="20" x2="6"  y2="14" strokeLinecap="round" />
    </svg>
  )
}

function NewsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 15h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 18h5" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7" />
      <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
