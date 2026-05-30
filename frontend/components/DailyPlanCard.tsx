'use client'

import { useState, useTransition } from 'react'
import { markActionDone } from '@/app/actions/plans'
import type { DailyPlanAction } from '@/lib/types'

type Props = {
  action: DailyPlanAction
  planId: string
}

export default function DailyPlanCard({ action, planId }: Props) {
  const [done, setDone] = useState(action.done)
  const [isPending, startTransition] = useTransition()

  function handleCheck(checked: boolean) {
    setDone(checked) // optimistic
    startTransition(async () => { await markActionDone(planId, action.rank, checked) })
  }

  return (
    <div className={`rounded-lg border p-5 transition-opacity ${done ? 'opacity-50' : 'opacity-100'} border-gray-200 bg-white`}>
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {action.rank}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              {action.carried_forward && (
                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Carried forward
                </span>
              )}
              <h3 className={`font-semibold text-gray-900 ${done ? 'line-through' : ''}`}>
                {action.title}
              </h3>
            </div>
            <input
              type="checkbox"
              checked={done}
              disabled={isPending}
              onChange={(e) => handleCheck(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 disabled:opacity-50"
            />
          </div>

          <p className="text-sm text-gray-600">{action.why}</p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
              {action.criterion}
            </span>
            <span>Deadline: {action.deadline}</span>
            <span>Time: {action.time_required}</span>
            {action.evidence_gain > 0 && (
              <span className="text-green-600">+{action.evidence_gain} score</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
