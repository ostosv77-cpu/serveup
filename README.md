# ServeUp

Plataforma web para gestionar torneos de tenis con metodología **Liga + Playoffs**.

## Descripción

ServeUp permite a organizadores y jugadores gestionar competiciones de tenis de forma sencilla y profesional. La aplicación cubre el ciclo completo de un torneo: inscripción de jugadores, fase de liga regular (todos contra todos), generación automática de playoffs y seguimiento de resultados en tiempo real.

## Características principales

- **Liga regular** — todos los jugadores compiten entre sí; clasificación automática.
- **Playoffs automáticos** — los mejores clasificados avanzan a cuadro de eliminatorias.
- **Clasificaciones en vivo** — tablas actualizadas tras cada resultado.
- **Agenda de partidos** — programación, notificaciones y registro de marcadores.
- **Gestión de jugadores** — inscripción, grupos y categorías en pocos clics.
- **Diseño responsivo** — optimizado para móvil, tablet y escritorio.

## Stack tecnológico

| Capa       | Tecnología              |
|------------|-------------------------|
| Framework  | Next.js 15 (App Router) |
| Lenguaje   | TypeScript              |
| Estilos    | Tailwind CSS v4         |
| Plataforma | Vercel (recomendado)    |

## Paleta de colores

| Rol       | Hex       |
|-----------|-----------|
| Principal | `#1A6B3C` |
| Fondo     | `#FFFFFF` |

## Estructura del proyecto

```
serveup/
├── app/
│   ├── globals.css       # Estilos globales + variables CSS
│   ├── layout.tsx        # Layout raíz con metadatos
│   └── page.tsx          # Página de inicio (Landing)
├── public/               # Activos estáticos
├── next.config.ts        # Configuración de Next.js
└── README.md
```

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Hoja de ruta

- [ ] Autenticación de usuarios (organizadores y jugadores)
- [ ] CRUD de torneos
- [ ] Módulo de liga: grupos y clasificación
- [ ] Módulo de playoffs: cuadro de eliminatorias
- [ ] Registro de resultados en tiempo real
- [ ] Panel de estadísticas por jugador
- [ ] Notificaciones por correo / push
