'use client'

import React from 'react'
import { exercises as exerciseDb } from '../../data/exercises'
import { isWristDangerousExercise } from '../../lib/exerciseUtils'
import type { ExerciseData } from '../../data/exercises'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { FiX } from 'react-icons/fi'

interface SwapExerciseModalProps {
  exerciseId: string | null
  swapSuggestions: ExerciseData[]
  swapQuery: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onSwap: (newExerciseId: string, newExerciseName: string) => void
  userInjuries: string[]
  userInjurySeverity: Record<string, string>
}

export function SwapExerciseModal({
  exerciseId,
  swapSuggestions,
  swapQuery,
  onQueryChange,
  onClose,
  onSwap,
  userInjuries,
  userInjurySeverity,
}: SwapExerciseModalProps) {
  if (!exerciseId) return null

  return (
    <Card className="animate-fade-in border-accent/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-text-primary">Pick a replacement</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><FiX /></Button>
      </div>

      {/* Smart Suggestions */}
      {swapSuggestions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2.5 font-medium">Recommended for you</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {swapSuggestions.map(ex => (
              <button
                key={ex.id}
                onClick={() => {
                  onSwap(ex.id, ex.name)
                }}
                className="flex flex-col items-start gap-1.5 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-all text-left group"
              >
                <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-2">{ex.name}</span>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="primary" size="sm">{ex.primaryMuscle}</Badge>
                  <Badge variant="neutral" size="sm">{ex.equipment}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Alternative */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Search exercises</p>
        <div className="relative">
          <input
            type="text"
            value={swapQuery}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Find any exercise..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            autoFocus={swapSuggestions.length === 0}
          />
        </div>

        {/* Search Results */}
        {swapQuery && (() => {
          const hasAcuteWristInjury = userInjuries.includes('wrists') &&
                                     (!userInjurySeverity['wrists'] || userInjurySeverity['wrists'] === 'acute')
          const searchResults = exerciseDb
            .filter(ex => ex.name.toLowerCase().includes(swapQuery.toLowerCase()))
            .filter(ex => !(userInjuries.includes('wrists') && isWristDangerousExercise(ex.name, hasAcuteWristInjury)))

          return (
            <div className="mt-2.5 max-h-40 overflow-y-auto space-y-1">
              {searchResults
                .slice(0, 8)
                .map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSwap(ex.id, ex.name)
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">{ex.name}</span>
                    <Badge variant="neutral" size="sm">{ex.primaryMuscle}</Badge>
                  </button>
                ))}
              {searchResults.length === 0 && (
                <p className="text-sm text-text-muted text-center py-3">No exercises found</p>
              )}
            </div>
          )
        })()}
      </div>
    </Card>
  )
}
