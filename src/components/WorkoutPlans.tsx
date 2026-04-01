'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkoutStore } from '../store/workoutStore'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import type { WorkoutPlan } from '../store/workoutStore'
import { PlanCard } from './plans/PlanCard'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { FiPlus, FiSearch } from 'react-icons/fi'

export const WorkoutPlans: React.FC = () => {
  const router = useRouter()
  const { plans, deletePlan } = useWorkoutStore()
  const { startWorkout, currentWorkout } = useWorkoutLogStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPlans = plans.filter(p =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStartWorkout = (plan: WorkoutPlan) => {
    if (currentWorkout) {
      if (!confirm('You have an active workout. Start a new one?')) return
    }
    startWorkout(plan.id, plan.name)
    router.push('/workout')
  }

  const handleDelete = (planId: string) => {
    if (confirm('Delete this plan?')) {
      deletePlan(planId)
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Workout Plans</h1>
          <p className="text-text-secondary mt-1">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/plans/new">
          <Button variant="primary" size="sm">
            <FiPlus /> New Plan
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search plans..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Plans Grid */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onStart={() => handleStartWorkout(plan)}
              onDelete={() => handleDelete(plan.id)}
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FiPlus className="text-primary text-2xl" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary mb-2">No plans yet</h2>
          <p className="text-text-secondary mb-6">Create your first workout plan to get started.</p>
          <Link href="/plans/new">
            <Button variant="primary" size="lg">
              <FiPlus /> Create Plan
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-text-secondary">No plans match &quot;{searchTerm}&quot;</p>
        </Card>
      )}
    </div>
  )
}
