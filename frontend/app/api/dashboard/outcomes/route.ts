import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MOCK_OUTCOMES } from '@/lib/mock-data'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: outcomes } = await supabase
    .from('outcomes')
    .select(`
      id,
      opportunity_id,
      status,
      notes,
      decided_at,
      created_at,
      opportunities ( title, type, criterion )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!outcomes || outcomes.length === 0) {
    return NextResponse.json(MOCK_OUTCOMES)
  }

  return NextResponse.json(
    outcomes.map(o => {
      const opp = o.opportunities as unknown as { title: string; type: string; criterion: string | null } | null
      return {
        id: o.id,
        opportunity_id: o.opportunity_id,
        opportunity_title: opp?.title ?? 'Unknown opportunity',
        opportunity_type: opp?.type ?? 'cfp',
        criterion: opp?.criterion ?? null,
        status: o.status,
        notes: o.notes,
        decided_at: o.decided_at,
        created_at: o.created_at,
      }
    })
  )
}
