'use client'

import React, { useState, useMemo } from 'react'
import { exercises as exerciseDb, type MuscleGroup, type Equipment } from '../../data/exercises'
import { getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import { getExerciseVideoId, getExerciseSearchUrl } from '../../data/exerciseVideos'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { FiChevronDown, FiChevronUp, FiVideo, FiExternalLink, FiSearch, FiZap } from 'react-icons/fi'

interface ExerciseListProps {
  selectedMuscles: MuscleGroup[]
}

const difficultyColors = {
  beginner: 'success' as const,
  intermediate: 'warning' as const,
  advanced: 'danger' as const,
}

const EQUIPMENT_OPTIONS: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'ez-bar', 'smith-machine', 'pull-up-bar']

export function ExerciseList({ selectedMuscles }: ExerciseListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<Equipment>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment(prev => {
      const next = new Set(prev)
      if (next.has(eq)) next.delete(eq)
      else next.add(eq)
      return next
    })
  }

  const hasEquipmentFilter = selectedEquipment.size > 0

  const filtered = useMemo(() => {
    let results = exerciseDb.filter(ex =>
      selectedMuscles.includes(ex.primaryMuscle) || ex.secondaryMuscles.some(m => selectedMuscles.includes(m))
    )

    if (hasEquipmentFilter) {
      results = results.filter(ex => selectedEquipment.has(ex.equipment))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(ex => ex.name.toLowerCase().includes(q))
    }

    // Sort: compounds first, then by name
    results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'compound' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return results
  }, [selectedMuscles, selectedEquipment, hasEquipmentFilter, searchQuery])

  // Compound exercises that hit MULTIPLE selected muscle groups at once
  const compoundMatches = useMemo(() => {
    if (selectedMuscles.length < 2) return []

    return exerciseDb
      .filter(ex => {
        if (ex.type !== 'compound') return false
        const allMuscles = [ex.primaryMuscle, ...ex.secondaryMuscles]
        // Count how many of the selected muscles this exercise hits
        const matchCount = selectedMuscles.filter(m => allMuscles.includes(m)).length
        // Must hit at least 2 of the selected muscles
        return matchCount >= 2
      })
      .filter(ex => !hasEquipmentFilter || selectedEquipment.has(ex.equipment))
      .filter(ex => !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // Sort by how many selected muscles they hit (most first)
        const allA = [a.primaryMuscle, ...a.secondaryMuscles]
        const allB = [b.primaryMuscle, ...b.secondaryMuscles]
        const countA = selectedMuscles.filter(m => allA.includes(m)).length
        const countB = selectedMuscles.filter(m => allB.includes(m)).length
        if (countB !== countA) return countB - countA
        return a.name.localeCompare(b.name)
      })
  }, [selectedMuscles, selectedEquipment, hasEquipmentFilter, searchQuery])

  if (selectedMuscles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="text-4xl mb-4">👆</div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-2">Tap a muscle group</h3>
        <p className="text-text-muted text-sm max-w-xs">Click on the body map to see exercises for that area. You can select multiple.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected muscles */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedMuscles.map(m => (
          <Badge key={m} variant="primary" size="md">{getMuscleGroupLabel(m)}</Badge>
        ))}
        <span className="text-sm text-text-muted">{filtered.length} exercises</span>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      {/* Equipment filter (multi-select) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => setSelectedEquipment(new Set())}
          className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${
            !hasEquipmentFilter
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {EQUIPMENT_OPTIONS.map(eq => (
          <button
            key={eq}
            onClick={() => toggleEquipment(eq)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${
              selectedEquipment.has(eq)
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
            }`}
          >
            {getEquipmentLabel(eq)}
          </button>
        ))}
      </div>

      {/* Compound exercises - hits multiple selected muscles */}
      {compoundMatches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-2">
            <FiZap className="text-accent" />
            <h3 className="text-sm font-bold text-text-primary">Compound — Hits Multiple Selected Muscles</h3>
            <Badge variant="accent" size="sm">{compoundMatches.length}</Badge>
          </div>
          <p className="text-xs text-text-muted">
            These exercises work {selectedMuscles.length >= 3 ? 'several' : 'both'} of your selected muscle groups in one movement.
          </p>
          {compoundMatches.map(ex => {
            const compoundKey = `compound-${ex.id}`
            const isExpanded = expandedId === compoundKey
            const videoId = getExerciseVideoId(ex.name)
            const allMuscles = [ex.primaryMuscle, ...ex.secondaryMuscles]
            const matchCount = selectedMuscles.filter(m => allMuscles.includes(m)).length

            return (
              <Card key={compoundKey} padding="none" className="overflow-hidden border-accent/10">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : compoundKey)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-text-primary text-sm">{ex.name}</h4>
                      <Badge variant="accent" size="sm">Hits {matchCount}/{selectedMuscles.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant={difficultyColors[ex.difficulty]} size="sm">{ex.difficulty}</Badge>
                      <Badge variant="neutral" size="sm">{getEquipmentLabel(ex.equipment)}</Badge>
                      {allMuscles.map(m => (
                        <Badge key={m} variant={selectedMuscles.includes(m) ? 'primary' : 'neutral'} size="sm">
                          {getMuscleGroupLabel(m)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {isExpanded ? <FiChevronUp className="text-text-muted flex-shrink-0" /> : <FiChevronDown className="text-text-muted flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4 animate-fade-in">
                    {videoId ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-black/30" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                          title={`${ex.name} form guide`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-xl"
                        />
                      </div>
                    ) : (
                      <a
                        href={getExerciseSearchUrl(ex.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FiVideo className="text-primary text-lg" />
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary font-medium text-sm">Watch {ex.name} form guide</p>
                          <p className="text-text-muted text-xs">Opens YouTube in a new tab</p>
                        </div>
                        <FiExternalLink className="text-primary flex-shrink-0" size={14} />
                      </a>
                    )}
                    <div>
                      <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">How to perform</h5>
                      <ol className="space-y-1.5">
                        {ex.instructions.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    {ex.tips.length > 0 && (
                      <div>
                        <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">Tips</h5>
                        {ex.tips.map((tip, i) => (
                          <p key={i} className="text-sm text-accent flex items-start gap-2">
                            <span className="mt-0.5">💡</span> {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Exercise cards - exclude those already in compound section */}
      {(() => {
        const compoundIds = new Set(compoundMatches.map(ex => ex.id))
        const regularExercises = filtered.filter(ex => !compoundIds.has(ex.id))
        return (<>
      {compoundMatches.length > 0 && regularExercises.length > 0 && (
        <div className="flex items-center gap-3 pt-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-text-muted">All exercises</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      )}
      <div className="space-y-2">
        {regularExercises.length === 0 && compoundMatches.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No exercises match your filters.</p>
        ) : (
          regularExercises.map(ex => {
            const isExpanded = expandedId === ex.id
            const videoId = getExerciseVideoId(ex.name)

            return (
              <Card key={ex.id} padding="none" className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary text-sm">{ex.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant={difficultyColors[ex.difficulty]} size="sm">{ex.difficulty}</Badge>
                      <Badge variant="neutral" size="sm">{getEquipmentLabel(ex.equipment)}</Badge>
                      <Badge variant={ex.type === 'compound' ? 'primary' : 'accent'} size="sm">{ex.type}</Badge>
                      {ex.secondaryMuscles.length > 0 && (
                        <span className="text-[10px] text-text-muted">
                          +{ex.secondaryMuscles.map(getMuscleGroupLabel).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <FiChevronUp className="text-text-muted flex-shrink-0" /> : <FiChevronDown className="text-text-muted flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4 animate-fade-in">
                    {/* Video */}
                    {videoId ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-black/30" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                          title={`${ex.name} form guide`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-xl"
                        />
                      </div>
                    ) : (
                      <a
                        href={getExerciseSearchUrl(ex.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FiVideo className="text-primary text-lg" />
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary font-medium text-sm">Watch {ex.name} form guide</p>
                          <p className="text-text-muted text-xs">Opens YouTube in a new tab</p>
                        </div>
                        <FiExternalLink className="text-primary flex-shrink-0" size={14} />
                      </a>
                    )}

                    {/* Instructions */}
                    <div>
                      <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">How to perform</h5>
                      <ol className="space-y-1.5">
                        {ex.instructions.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {ex.tips.length > 0 && (
                      <div>
                        <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">Tips</h5>
                        {ex.tips.map((tip, i) => (
                          <p key={i} className="text-sm text-accent flex items-start gap-2">
                            <span className="mt-0.5">💡</span> {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
        </>)
      })()}
    </div>
  )
}
