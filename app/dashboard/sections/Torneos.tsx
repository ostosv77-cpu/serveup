'use client'

export default function TorneosSection() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Torneos</h1>
      <p className="text-gray-500 mb-8">Gestiona los torneos de ServeUp.</p>

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
          className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1A6B3C' }}
          onClick={() => alert('El formulario de creación de torneos estará disponible próximamente.')}
        >
          + Crear nuevo torneo
        </button>

        <div className="w-full border-t border-gray-100 pt-6 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            El formulario incluirá:
          </p>
          <ul className="text-sm text-gray-500 space-y-1.5">
            {[
              'Nombre del torneo y ciudad',
              'Fecha de inicio y fecha de fin',
              'Categorías: A, B, C (checkboxes)',
              'Precio de inscripción por categoría',
              'Cupos máximos por categoría',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span style={{ color: '#1A6B3C' }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
