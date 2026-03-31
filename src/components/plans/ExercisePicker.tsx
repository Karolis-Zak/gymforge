'use client'

import React, { useState, useMemo } from 'react'
import { exercises } from '../../data/exercises'
import { searchExercises, getAllMuscleGroups, getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import type { MuscleGroup, Equipment } from '../../data/exercises'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
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

export function ExercisePicker({ onAdd, addedExerciseIds = [] }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [showPicker, setShowPicker] = useState(false)

  const addedSet = useMemo(() => new Set(addedExerciseIds), [addedExerciseIds])

  const filtered = useMemo(() => {
    return searchExercises(query, muscleFilter ? { muscle: muscleFilter as MuscleGroup } : undefined)
      .filter(ex => !addedSet.has(ex.id))
      .slice(0, 50)
  }, [query, muscleFilter, addedSet])

  const muscleGroups = getAllMuscleGroups()

  const handleAdd = (ex: typeof exercises[0]) => {
    onAdd({
      id: ex.id,
      name: ex.name,
      sets,
      reps,
      notes: '',
    })
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
        <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>
          <FiX />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Muscle group filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setMuscleFilter('')}
          className={`px-2.5 py-1 text-xs rounded-full transition-all ${!muscleFilter ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}
        >
          All
        </button>
        {muscleGroups.map(m => (
          <button
            key={m}
            onClick={() => setMuscleFilter(muscleFilter === m ? '' : m)}
            className={`px-2.5 py-1 text-xs rounded-full transition-all ${muscleFilter === m ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}
          >
            {getMuscleGroupLabel(m)}
          </button>
        ))}
      </div>

      {/* Sets/Reps */}
      <div className="flex gap-4">
        <div className="w-24">
          <label className="text-xs text-text-muted block mb-1">Sets</label>
          <input
            type="number"
            value={sets}
            onChange={e => setSets(Number(e.target.value))}
            min={1}
            max={20}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="w-24">
          <label className="text-xs text-text-muted block mb-1">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={e => setReps(Number(e.target.value))}
            min={1}
            max={100}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-4">No exercises found</p>
        )}
        {filtered.map(ex => (
          <div
            key={ex.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary text-sm">{ex.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={difficultyColors[ex.difficulty] || 'neutral'} size="sm">{ex.difficulty}</Badge>
                <Badge variant="neutral" size="sm">{getEquipmentLabel(ex.equipment)}</Badge>
                <Badge variant="neutral" size="sm">{getMuscleGroupLabel(ex.primaryMuscle)}</Badge>
              </div>
            </div>
            <button
              onClick={() => handleAdd(ex)}
              className="opacity-0 group-hover:opacity-100 ml-3 w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-all"
            >
              <FiPlus />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
