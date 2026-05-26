import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { torneo_id } = body as { torneo_id?: string }
  if (!torneo_id) {
    return NextResponse.json({ error: 'torneo_id requerido' }, { status: 400 })
  }

  // Fetch torneo (solo publicados pueden recibir inscripciones)
  const { data: torneo, error: torneoErr } = await supabase
    .from('torneos')
    .select('*')
    .eq('id', torneo_id)
    .eq('estado', 'publicado')
    .single()

  if (torneoErr || !torneo) {
    return NextResponse.json({ error: 'Torneo no encontrado o no disponible' }, { status: 404 })
  }

  const cupos = torneo.cupos_disponibles ?? 0
  if (cupos <= 0) {
    return NextResponse.json({ error: 'No hay cupos disponibles en este torneo' }, { status: 409 })
  }

  // Verificar que el jugador no tenga 2 torneos activos ya
  const { count: activasCount } = await supabase
    .from('inscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('jugador_id', user.id)
    .eq('estado', 'activa')

  if ((activasCount ?? 0) >= 2) {
    return NextResponse.json({
      error: 'Ya tienes 2 torneos activos — debes finalizar uno para inscribirte a otro',
    }, { status: 409 })
  }

  // Insertar inscripción (la constraint UNIQUE captura duplicados)
  const { error: insErr } = await supabase
    .from('inscripciones')
    .insert({ jugador_id: user.id, torneo_id, estado: 'activa' })

  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Ya estás inscrito en este torneo' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al procesar la inscripción' }, { status: 500 })
  }

  // Descontar cupo — si falla, hacemos rollback de la inscripción
  const { error: cuposErr } = await supabase
    .from('torneos')
    .update({ cupos_disponibles: cupos - 1 })
    .eq('id', torneo_id)
    .gt('cupos_disponibles', 0)

  if (cuposErr) {
    await supabase
      .from('inscripciones')
      .delete()
      .eq('jugador_id', user.id)
      .eq('torneo_id', torneo_id)
    return NextResponse.json({ error: 'Error al reservar cupo. Inténtalo de nuevo.' }, { status: 500 })
  }

  // Enviar correo de bienvenida (non-blocking — no falla la inscripción si el email falla)
  if (process.env.RESEND_API_KEY) {
    const { data: jugador } = await supabase
      .from('jugadores')
      .select('nombre, email')
      .eq('id', user.id)
      .single()

    if (jugador?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      resend.emails.send({
        from: 'ServeUp <noreply@serveup.co>',
        to: jugador.email,
        subject: `¡Bienvenido a ${torneo.nombre}!`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
            <div style="margin-bottom:20px;">
              <span style="font-size:24px;font-weight:800;color:#1A6B3C;">ServeUp 🎾</span>
            </div>
            <h1 style="color:#111827;font-size:20px;margin:0 0 8px;">¡Bienvenido a ${torneo.nombre}!</h1>
            <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Hola <strong style="color:#111827;">${jugador.nombre}</strong>, tu inscripción ha sido confirmada.</p>
            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Fase Liga</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600;border-bottom:1px solid #e5e7eb;">${fmtDate(torneo.fecha_liga_inicio)} al ${fmtDate(torneo.fecha_liga_fin)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Fase Playoffs</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600;border-bottom:1px solid #e5e7eb;">${fmtDate(torneo.fecha_playoffs_inicio)} al ${fmtDate(torneo.fecha_playoffs_fin)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Precio inscripción</td>
                <td style="padding:12px 16px;color:#1A6B3C;font-size:13px;font-weight:700;">${fmtCOP(torneo.precio_inscripcion)}</td>
              </tr>
            </table>
            <p style="margin:28px 0 0;color:#1A6B3C;font-size:16px;font-weight:700;">🎾 Nos vemos en la cancha.</p>
          </div>
        `,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
