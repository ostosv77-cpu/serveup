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

  // ── 1. Autenticación ────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    console.error('[inscribir] step=auth error:', authErr)
    return NextResponse.json({ error: 'No autenticado', step: 'auth' }, { status: 401 })
  }
  console.log('[inscribir] user:', user.id)

  // ── 2. Parsear body ─────────────────────────────────────────────────────
  let torneo_id: string | undefined
  try {
    const body = await req.json()
    torneo_id = body.torneo_id
  } catch {
    return NextResponse.json({ error: 'Body inválido', step: 'parse' }, { status: 400 })
  }
  if (!torneo_id) {
    return NextResponse.json({ error: 'torneo_id requerido', step: 'parse' }, { status: 400 })
  }
  console.log('[inscribir] torneo_id:', torneo_id)

  // ── 3. Verificar torneo ─────────────────────────────────────────────────
  const { data: torneo, error: torneoErr } = await supabase
    .from('torneos')
    .select('*')
    .eq('id', torneo_id)
    .eq('estado', 'publicado')
    .single()

  if (torneoErr) {
    console.error('[inscribir] step=torneo_fetch code:', torneoErr.code, 'msg:', torneoErr.message)
    return NextResponse.json(
      { error: 'Torneo no encontrado o no disponible', step: 'torneo_fetch', code: torneoErr.code },
      { status: 404 }
    )
  }

  const cupos = torneo.cupos_disponibles ?? 0
  console.log('[inscribir] cupos_disponibles:', cupos)
  if (cupos <= 0) {
    return NextResponse.json({ error: 'No hay cupos disponibles', step: 'cupos_check' }, { status: 409 })
  }

  // ── 4. Contar inscripciones activas del jugador ─────────────────────────
  const { count: activasCount, error: countErr } = await supabase
    .from('inscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('jugador_id', user.id)
    .eq('estado', 'activa')

  if (countErr) {
    console.error('[inscribir] step=count_activas code:', countErr.code, 'msg:', countErr.message)
    return NextResponse.json(
      { error: 'Error al verificar inscripciones activas', step: 'count_activas', code: countErr.code, detail: countErr.message },
      { status: 500 }
    )
  }

  console.log('[inscribir] activas:', activasCount)
  if ((activasCount ?? 0) >= 2) {
    return NextResponse.json(
      { error: 'Ya tienes 2 torneos activos — debes finalizar uno para inscribirte a otro', step: 'limit_check' },
      { status: 409 }
    )
  }

  // ── 5. Insertar inscripción ─────────────────────────────────────────────
  const { error: insErr } = await supabase
    .from('inscripciones')
    .insert({ jugador_id: user.id, torneo_id, estado: 'activa' })

  if (insErr) {
    console.error('[inscribir] step=insert code:', insErr.code, 'msg:', insErr.message)
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Ya estás inscrito en este torneo', step: 'insert' }, { status: 409 })
    }
    return NextResponse.json(
      { error: 'Error al procesar la inscripción', step: 'insert', code: insErr.code, detail: insErr.message },
      { status: 500 }
    )
  }
  console.log('[inscribir] inscription inserted OK')

  // ── 6. Descontar cupo ───────────────────────────────────────────────────
  const { error: cuposErr } = await supabase
    .from('torneos')
    .update({ cupos_disponibles: cupos - 1 })
    .eq('id', torneo_id)
    .gt('cupos_disponibles', 0)

  if (cuposErr) {
    console.error('[inscribir] step=cupos_update code:', cuposErr.code, 'msg:', cuposErr.message)
    // Rollback inscripción
    await supabase
      .from('inscripciones')
      .delete()
      .eq('jugador_id', user.id)
      .eq('torneo_id', torneo_id)
    return NextResponse.json(
      { error: 'Error al reservar cupo. Inténtalo de nuevo.', step: 'cupos_update', code: cuposErr.code, detail: cuposErr.message },
      { status: 500 }
    )
  }
  console.log('[inscribir] cupos updated to', cupos - 1)

  // ── 7. Email de bienvenida (non-blocking) ───────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const { data: jugador } = await supabase
      .from('jugadores')
      .select('nombre, email')
      .eq('id', user.id)
      .single()

    if (jugador?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      resend.emails.send({
        from: 'ServeUp <onboarding@resend.dev>',
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
      }).catch((emailErr: unknown) => console.error('[inscribir] email error:', emailErr))
    }
  }

  return NextResponse.json({ ok: true })
}
