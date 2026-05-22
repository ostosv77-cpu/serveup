'use client'

export default function ResultadosSection() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Resultados</h1>
      <p className="text-gray-500 mb-8">Historial de partidos y marcadores.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
          style={{ backgroundColor: '#f0faf4' }}
        >
          🎾
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Sin resultados aún</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Los resultados aparecerán aquí cuando haya torneos y partidos activos.
        </p>
      </div>
    </div>
  )
}
