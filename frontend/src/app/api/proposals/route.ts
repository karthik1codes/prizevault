import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { proposalToRow, rowToProposal } from '@/lib/supabase/mappers'
import { syncExecutedPayouts } from '@/lib/supabase/syncExecutedPayouts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ proposals: [], source: 'none' })
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, proposals: [] }, { status: 500 })
    }

    return NextResponse.json({
      proposals: (data || []).map((row) => rowToProposal(row)),
      source: 'supabase',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load proposals'
    return NextResponse.json({ error: message, proposals: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const supabase = createSupabaseServerClient()

    let hackathonDbId: string | null = null
    const hackathonId = String(body.hackathonId || '')
    if (hackathonId) {
      const { data: hack } = await supabase
        .from('hackathons')
        .select('id')
        .or(`legacy_id.eq.${hackathonId},id.eq.${hackathonId}`)
        .maybeSingle()
      hackathonDbId = hack?.id ?? null
    }

    const row = proposalToRow(body, hackathonDbId)
    const { data, error } = await supabase.from('proposals').insert(row).select('*').single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    await syncExecutedPayouts(supabase, data.id, body)

    return NextResponse.json({ success: true, proposal: rowToProposal(data) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create proposal'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** Replace/sync full proposal list (mirrors localStorage bulk save). */
export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { proposals?: Record<string, unknown>[] }
    const proposals = body.proposals
    if (!Array.isArray(proposals)) {
      return NextResponse.json({ success: false, error: 'proposals array required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    for (const p of proposals) {
      const legacyId = String(p.id || '')
      if (!legacyId) continue

      const { data: existing } = await supabase
        .from('proposals')
        .select('id, hackathon_id')
        .eq('legacy_id', legacyId)
        .maybeSingle()

      const row = proposalToRow(p, existing?.hackathon_id)

      let proposalDbId = existing?.id as string | undefined

      if (existing) {
        delete (row as { legacy_id?: string }).legacy_id
        const { error: updateError } = await supabase
          .from('proposals')
          .update(row)
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('proposals')
          .insert(row)
          .select('id')
          .single()
        if (insertError) throw insertError
        proposalDbId = inserted.id
      }

      if (proposalDbId) {
        await syncExecutedPayouts(supabase, proposalDbId, p)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bulk save failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
