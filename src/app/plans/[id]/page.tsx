'use client'

export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'
import { PlanEditor } from '../../../components/plans/PlanEditor'

export default function EditPlanPage() {
  const params = useParams()
  return <PlanEditor planId={(params?.id as string) || ''} />
}
