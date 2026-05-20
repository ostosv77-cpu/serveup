export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TennisBallIcon />
          <span className="text-xl font-bold tracking-tight" style={{ color: "#1A6B3C" }}>
            ServeUp
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-[#1A6B3C] transition-colors">
            Características
          </a>
          <a href="#how-it-works" className="hover:text-[#1A6B3C] transition-colors">
            Cómo funciona
          </a>
          <a
            href="#register"
            className="px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: "#1A6B3C" }}
          >
            Registrarse
          </a>
        </nav>
        {/* Mobile menu button placeholder */}
        <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <main className="flex flex-col flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 bg-white">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border"
            style={{ color: "#1A6B3C", borderColor: "#1A6B3C", backgroundColor: "#f0faf4" }}
          >
            <TennisBallIcon size={16} />
            Liga + Playoffs · Resultados en tiempo real
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 max-w-3xl leading-tight">
            Gestiona tus torneos de tenis{" "}
            <span style={{ color: "#1A6B3C" }}>sin complicaciones</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed">
            ServeUp organiza tus competiciones con metodología Liga + Playoffs. Lleva el control
            de clasificaciones, partidos y resultados desde cualquier dispositivo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <a
              id="register"
              href="#register"
              className="px-8 py-3.5 rounded-xl text-white text-base font-semibold shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1A6B3C" }}
            >
              Registrarse gratis
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver cómo funciona
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Sin tarjeta de crédito · Siempre gratuito para organizadores</p>
        </section>

        {/* Stats bar */}
        <section className="w-full py-10 border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Torneos jugados" },
              { value: "8 000+", label: "Partidos registrados" },
              { value: "3 200+", label: "Jugadores activos" },
              { value: "98%", label: "Satisfacción" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold" style={{ color: "#1A6B3C" }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
              Desde la inscripción de jugadores hasta la final del torneo, ServeUp cubre cada etapa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: "#1A6B3C" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
              Metodología Liga + Playoffs: todos juegan, los mejores avanzan.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.title} className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: "#1A6B3C" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 px-6 flex flex-col items-center text-center"
          style={{ backgroundColor: "#1A6B3C" }}
        >
          <TennisBallIcon size={40} color="white" />
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white max-w-xl leading-tight">
            ¿Listo para organizar tu próximo torneo?
          </h2>
          <p className="mt-4 text-green-100 max-w-md text-base">
            Únete a miles de organizadores y jugadores que ya confían en ServeUp.
          </p>
          <a
            href="#register"
            className="mt-8 px-10 py-4 rounded-xl bg-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ color: "#1A6B3C" }}
          >
            Registrarse gratis
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <TennisBallIcon size={18} />
          <span className="font-semibold" style={{ color: "#1A6B3C" }}>
            ServeUp
          </span>
        </div>
        <p>© {new Date().getFullYear()} ServeUp. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

/* ── Inline data ── */

const features = [
  {
    icon: "🏆",
    title: "Liga regular",
    description:
      "Todos los jugadores compiten entre sí en formato todos contra todos. La clasificación se actualiza automáticamente tras cada partido.",
  },
  {
    icon: "⚡",
    title: "Playoffs automáticos",
    description:
      "Los mejores clasificados avanzan al cuadro de eliminatorias. ServeUp genera los cruces y gestiona cada ronda sin esfuerzo.",
  },
  {
    icon: "📊",
    title: "Clasificaciones en vivo",
    description:
      "Tablas de posiciones, estadísticas de jugadores y resultados de partidos actualizados en tiempo real desde cualquier dispositivo.",
  },
  {
    icon: "📅",
    title: "Agenda de partidos",
    description:
      "Programa los encuentros, recibe notificaciones y registra marcadores directamente desde la aplicación.",
  },
  {
    icon: "👥",
    title: "Gestión de jugadores",
    description:
      "Inscribe participantes, crea grupos y administra categorías de forma sencilla con unos pocos clics.",
  },
  {
    icon: "📱",
    title: "100 % responsivo",
    description:
      "Diseñado para funcionar perfectamente en móvil, tablet y escritorio. Accede a tu torneo desde donde quieras.",
  },
];

const steps = [
  {
    title: "Crea tu torneo",
    description:
      "Define el nombre, categoría, número de grupos y fechas. ServeUp configura automáticamente el formato Liga + Playoffs.",
  },
  {
    title: "Añade jugadores",
    description:
      "Inscribe participantes individualmente o por importación. El sistema los distribuye en grupos de forma equitativa.",
  },
  {
    title: "¡A jugar!",
    description:
      "Registra resultados, sigue la clasificación en vivo y deja que ServeUp gestione el avance a playoffs sin intervención manual.",
  },
];

/* ── SVG icon ── */

function TennisBallIcon({
  size = 24,
  color = "#1A6B3C",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path
        d="M4.5 7.5C6.5 9 8 11 8 12s-1.5 3-3.5 4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19.5 7.5C17.5 9 16 11 16 12s1.5 3 3.5 4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
