'use client'

import React, { useState, useMemo } from 'react'
import { exercises } from '../../data/exercises'
import { searchExercises, getAllMuscleGroups, getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import { getExerciseCategory } from '../../data/exerciseCategories'
import type { MuscleGroup } from '../../data/exercises'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { FiPlus, FiSearch, FiX } from 'react-icons/fi'

interface ExercisePickerProps {
  onAdd: (exercise: { id: string; name: string; sets: number; reps: number; notes: string }) => void
  addedExerciseIds?: string[]
}

const difficultyColors = {
  beginner: 'success' as const,
  intermediate: 'warning' as const,
  advanced: 'danger' as const,
}

const SET_PRESETS = [
  { label: '3×10', sets: 3, reps: 10, desc: 'Standard' },
  { label: '3×12', sets: 3, reps: 12, desc: 'Hypertrophy' },
  { label: '4×8', sets: 4, reps: 8, desc: 'Strength' },
  { label: '5×5', sets: 5, reps: 5, desc: 'Heavy' },
  { label: '3×15', sets: 3, reps: 15, desc: 'Toning' },
  { label: '4×6', sets: 4, reps: 6, desc: 'Power' },
]

// Smart sort: staple isolation first, then standard, then unique
function smartScore(ex: typeof exercises[0]): number {
  const cat = getExerciseCategory(ex.id)
  let score = cat === 'staple' ? 30 : cat === 'standard' ? 15 : 0
  score += ex.type === 'isolation' ? 10 : 5
  score += ex.difficulty === 'beginner' ? 5 : ex.difficulty === 'intermediate' ? 2 : 0
  return score
}

export function ExercisePicker({ onAdd, addedExerciseIds = [] }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [showPicker, setShowPicker] = useState(false)

  const addedSet = useMemo(() => new Set(addedExerciseIds), [addedExerciseIds])

  const filtered = useMemo(() => {
    // searchExercises now only matches primaryMuscle
    const results = searchExercises(query, muscleFilter ? { muscle: muscleFilter as MuscleGroup } : undefined)
      .filter(ex => !addedSet.has(ex.id))

    // Smart sort
    return results.sort((a, b) => smartScore(b) - smartScore(a)).slice(0, 50)
  }, [query, muscleFilter, addedSet])

  const muscleGroups = getAllMuscleGroups()

  const handleAdd = (ex: typeof exercises[0]) => {
    onAdd({ id: ex.id, name: ex.name, sets, reps, notes: '' })
  }

  const applyPreset = (preset: typeof SET_PRESETS[0]) => {
    setSets(preset.sets)
    setReps(preset.reps)
  }

  if (!showPicker) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>
        <FiPlus /> Add Exercise
      </Button>
    )
  }

  return (
    <div className="bg-background-elevated border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-text-primary">Add Exercise</h4>
        <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}><FiX /></Button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
      </div>

      {/* Muscle filter — PRIMARY only */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setMuscleFilter('')}
          className={`px-2.5 py-1 text-xs rounded-full transition-all ${!muscleFilter ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}>
          All
        </button>
        {muscleGroups.map(m => (
          <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? '' : m)}
            className={`px-2.5 py-1 text-xs rounded-full transition-all ${muscleFilter === m ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}>
            {getMuscleGroupLabel(m)}
          </button>
        ))}
      </div>

      {/* Set presets + custom */}
      <div>
        <label className="text-xs text-text-muted block mb-2">Sets × Reps</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SET_PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${sets === p.sets && reps === p.reps
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1">
            <button onClick={() => setSets(Math.max(1, sets - 1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary text-sm flex items-center justify-center">−</button>
            <span className="text-sm text-text-primary font-medium w-6 text-center">{sets}</span>
            <button onClick={() => setSets(Math.min(10, sets + 1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary text-sm flex items-center justify-center">+</button>
            <span className="text-xs text-text-muted ml-1">sets</span>
          </div>
          <span className="text-text-muted">×</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setReps(Math.max(1, reps - 1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary text-sm flex items-center justify-center">−</button>
            <span className="text-sm text-text-primary font-medium w-6 text-center">{reps}</span>
            <button onClick={() => setReps(Math.min(30, reps + 1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary text-sm flex items-center justify-center">+</button>
            <span className="text-xs text-text-muted ml-1">reps</span>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-4">No exercises found</p>
        )}
        {filtered.map(ex => (
          <div key={ex.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary text-sm">{ex.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={difficultyColors[ex.difficulty] || 'neutral'} size="sm">{ex.difficulty}</Badge>
                <Badge variant="neutral" size="sm">{getEquipmentLabel(ex.equipment)}</Badge>
                <Badge variant="neutral" size="sm">{getMuscleGroupLabel(ex.primaryMuscle)}</Badge>
              </div>
            </div>
            <button onClick={() => handleAdd(ex)}
              className="opacity-0 group-hover:opacity-100 ml-3 w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-all">
              <FiPlus />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
