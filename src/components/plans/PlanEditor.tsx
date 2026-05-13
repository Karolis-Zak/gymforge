'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutStore, type Exercise } from '../../store/workoutStore'
import { ExercisePicker } from './ExercisePicker'
import { Card } from '../ui'
import { Button } from '../ui'
import { Input } from '../ui'
import { FiArrowLeft, FiTrash2, FiSave, FiMenu, FiChevronUp, FiChevronDown } from 'react-icons/fi'

export function PlanEditor({ planId }: { planId: string }) {
  const router = useRouter()
  const { plans, updatePlan, addExercise, updateExercise, deleteExercise } = useWorkoutStore()
  const plan = plans.find(p => p.id === planId)

  const [name, setName] = useState(plan?.name || '')
  const [description, setDescription] = useState(plan?.description || '')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  if (!plan) {
    return (
      <div className="animate-fade-in text-center py-16">
        <h2 className="text-xl font-display font-bold text-text-primary mb-2">Plan not found</h2>
        <Button variant="secondary" onClick={() => router.push('/plans')}>Back to Plans</Button>
      </div>
    )
  }

  const handleSave = () => {
    updatePlan(planId, { name: name.trim(), description: description.trim() })
    router.push('/plans')
  }

  const handleAddExercise = (ex: { id: string; name: string; sets: number; reps: number; notes: string }) => {
    addExercise(planId, { name: ex.name, sets: ex.sets, reps: ex.reps, notes: ex.notes })
  }

  const handleDrop = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const newExercises = [...plan.exercises]
    const [moved] = newExercises.splice(fromIdx, 1)
    newExercises.splice(toIdx, 0, moved)
    updatePlan(planId, { exercises: newExercises })
    setDragIdx(null)
    setDragOverIdx(null)
  }

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...plan.exercises]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= newExercises.length) return
    ;[newExercises[index], newExercises[swapIdx]] = [newExercises[swapIdx], newExercises[index]]
    updatePlan(planId, { exercises: newExercises })
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/plans')}>
          <FiArrowLeft /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Edit Plan</h1>
          {plan.isPreMade && <p className="text-xs text-text-muted mt-1">This is a template. Changes will create your custom version.</p>}
        </div>
      </div>

      {/* Plan details */}
      <Card>
        <div className="space-y-4">
          <Input label="Plan Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </Card>

      {/* Exercises */}
      <Card>
        <h3 className="font-display font-bold text-text-primary mb-4">
          Exercises ({plan.exercises.length})
        </h3>
        <div className="space-y-4 md:space-y-3">
          {plan.exercises.map((ex, i) => (
            <div
              key={ex.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => { e.preventDefault(); setDragOverIdx(i) }}
              onDragEnd={() => { if (dragIdx !== null && dragOverIdx !== null) handleDrop(dragIdx, dragOverIdx); setDragIdx(null); setDragOverIdx(null) }}
              className={`flex flex-col md:flex-row md:items-center gap-3 p-5 md:p-4 rounded-2xl md:rounded-xl border transition-all ${
                dragOverIdx === i && dragIdx !== null && dragIdx !== i
                  ? 'bg-primary/10 border-primary/30'
                  : dragIdx === i
                    ? 'opacity-40 border-white/10 bg-white/[0.02]'
                    : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {/* Exercise name + actions row (mobile gets full-width name with controls below) */}
              <div className="flex items-start justify-between gap-3 md:hidden">
                <span className="text-sm font-medium text-text-primary flex-1 pt-2">{ex.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveExercise(i, 'up') }}
                    disabled={i === 0}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    <FiChevronUp size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveExercise(i, 'down') }}
                    disabled={i === plan.exercises.length - 1}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    <FiChevronDown size={18} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remove ${ex.name}?`)) deleteExercise(planId, ex.id) }}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-danger transition-colors"
                    aria-label={`Remove ${ex.name}`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Reorder: drag handle + small arrow column on desktop only */}
              <div className="hidden md:flex items-center gap-1">
                <div className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary touch-none" aria-label="Drag to reorder">
                  <FiMenu size={16} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); handleMoveExercise(i, 'up') }} disabled={i === 0} className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors p-1" aria-label="Move up">
                    <FiChevronUp size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleMoveExercise(i, 'down') }} disabled={i === plan.exercises.length - 1} className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors p-1" aria-label="Move down">
                    <FiChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <span className="hidden md:inline text-sm font-medium text-text-primary">{ex.name}</span>
                <div className="grid grid-cols-3 gap-3 mt-3 md:mt-3 md:flex md:items-center md:gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted font-semibold">Sets</label>
                    <input type="number" value={ex.sets} min={1} max={20}
                      onChange={e => updateExercise(planId, ex.id, { sets: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base md:text-sm md:py-1.5 text-text-primary focus:outline-none focus:border-primary/50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted font-semibold">Reps</label>
                    <input type="number" value={ex.reps} min={1} max={100}
                      onChange={e => updateExercise(planId, ex.id, { reps: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base md:text-sm md:py-1.5 text-text-primary focus:outline-none focus:border-primary/50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted font-semibold">Rest (s)</label>
                    <input type="number" value={ex.restSeconds || 60} min={0} max={600} step={15}
                      onChange={e => updateExercise(planId, ex.id, { restSeconds: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base md:text-sm md:py-1.5 text-text-primary focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
              </div>

              {/* Delete: desktop only (mobile has it in the top-right action row) */}
              <button onClick={() => { if (confirm(`Remove ${ex.name}?`)) deleteExercise(planId, ex.id) }}
                className="hidden md:block text-text-muted hover:text-danger transition-colors p-1" aria-label={`Remove ${ex.name}`}>
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <ExercisePicker onAdd={handleAddExercise} />
        </div>
      </Card>

      {/* Save */}
      <Button variant="primary" size="lg" onClick={handleSave} className="w-full">
        <FiSave /> Save Changes
      </Button>
    </div>
  )
}
