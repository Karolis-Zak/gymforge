'use client'

import React, { useState } from 'react'
import type { MuscleGroup } from '../data/exercises'
import { getMuscleGroupLabel } from '../data/exerciseUtils'
import { BodySVG } from './body-map/BodySVG'
import { ExerciseList } from './body-map/ExerciseList'
import { Button } from './ui/Button'
import { FiRotateCw, FiX } from 'react-icons/fi'

export function BodyMap() {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([])

  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    )
  }

  const clearSelection = () => setSelectedMuscles([])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Exercise Explorer</h1>
          <p className="text-text-secondary text-sm mt-1">Tap a muscle group to see exercises</p>
        </div>
        {selectedMuscles.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <FiX /> Clear
          </Button>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Body map */}
        <div className="lg:w-[320px] flex-shrink-0">
          {/* Front/Back toggle */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <button
              onClick={() => setView('front')}
              className={`px-4 py-2 text-sm font-medium rounded-l-xl border transition-all ${
                view === 'front'
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setView('back')}
              className={`px-4 py-2 text-sm font-medium rounded-r-xl border transition-all ${
                view === 'back'
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
              }`}
            >
              Back
            </button>
            <button
              onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
              className="ml-2 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
              aria-label="Flip view"
            >
              <FiRotateCw size={14} />
            </button>
          </div>

          {/* SVG Body */}
          <div className="bg-background-card border border-white/10 rounded-2xl p-4 flex items-center justify-center">
            <BodySVG
              selectedMuscles={selectedMuscles}
              onToggleMuscle={toggleMuscle}
              view={view}
            />
          </div>

          {/* Quick muscle buttons (mobile helper) */}
          <div className="flex flex-wrap gap-1.5 mt-3 lg:hidden">
            {(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'traps', 'forearms'] as MuscleGroup[]).map(m => (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                  selectedMuscles.includes(m)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-white/5 text-text-muted border-white/10'
                }`}
              >
                {getMuscleGroupLabel(m)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Exercise list */}
        <div className="flex-1 min-w-0">
          <ExerciseList selectedMuscles={selectedMuscles} />
        </div>
      </div>
    </div>
  )
}
