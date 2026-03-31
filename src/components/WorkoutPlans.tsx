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
import { FiPlus, FiUpload, FiDownload, FiSearch } from 'react-icons/fi'

export const WorkoutPlans: React.FC = () => {
  const router = useRouter()
  const { plans, deletePlan, exportPlan, addPlan } = useWorkoutStore()
  const { startWorkout, currentWorkout } = useWorkoutLogStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    try {
      const text = await file.text()
      const plan = JSON.parse(text)
      if (!plan.name || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
        setImportError('Invalid plan: must have a name and at least one exercise.')
        return
      }
      addPlan(plan)
    } catch {
      setImportError('Invalid plan file. Please upload a valid JSON file.')
    }
    e.target.value = ''
  }

  const handleExport = (plan: WorkoutPlan) => {
    const json = exportPlan(plan.id)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${plan.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Workout Plans</h1>
          <p className="text-text-secondary mt-1">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="secondary" size="sm" className="pointer-events-none">
              <FiUpload /> Import
            </Button>
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
          <Link href="/plans/new">
            <Button variant="primary" size="sm">
              <FiPlus /> New Plan
            </Button>
          </Link>
        </div>
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

      {/* Import Error */}
      {importError && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-danger/60 hover:text-danger ml-4">&times;</button>
        </div>
      )}

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
          <div className="text-5xl mb-4">📋</div>
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
