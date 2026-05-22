import Link from 'next/link'

function TennisBallIcon({ size = 24, color = '#1A6B3C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="w-full px-6 py-4 flex items-center border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <TennisBallIcon size={22} />
          <span className="text-lg font-bold tracking-tight" style={{ color: '#1A6B3C' }}>
            ServeUp
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} ServeUp. Todos los derechos reservados.
      </footer>
    </div>
  )
}
