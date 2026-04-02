'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { exercises as exerciseDb, type MuscleGroup, type Equipment, type Difficulty } from '../../data/exercises'
import { getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import { difficultyColors, difficultyFilterStyles } from '../../lib/difficultyStyles'
import { getSmartScore } from '../../lib/exerciseUtils'
import { getExerciseVideoId, getExerciseSearchUrl } from '../../data/exerciseVideos'
import { getExerciseCategory } from '../../data/exerciseCategories'
import { Card, Badge } from '../ui'
import { FiChevronDown, FiChevronUp, FiVideo, FiExternalLink, FiSearch, FiZap } from 'react-icons/fi'

interface ExerciseListProps {
  selectedMuscles: MuscleGroup[]
}

const EQUIPMENT_OPTIONS: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'ez-bar', 'smith-machine', 'pull-up-bar']
const DIFFICULTY_OPTIONS: Difficulty[] = ['beginner', 'intermediate', 'advanced']

const EQUIPMENT_ORDER: Record<string, number> = {
  barbell: 1, dumbbell: 2, 'ez-bar': 3, cable: 4, machine: 5,
  kettlebell: 6, bodyweight: 7, band: 8, 'smith-machine': 9, 'pull-up-bar': 10, none: 11,
}

function sortExercises(exercises: typeof exerciseDb): typeof exerciseDb {
  return [...exercises].sort((a, b) => getSmartScore(b, 20, 10) - getSmartScore(a, 20, 10))
}

export function ExerciseList({ selectedMuscles }: ExerciseListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<Equipment>>(new Set())
  const [selectedDifficulty, setSelectedDifficulty] = useState<Set<Difficulty>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSecondary, setShowSecondary] = useState(false)

  const toggleEquipment = useCallback((eq: Equipment) => {
    setSelectedEquipment(prev => { const next = new Set(prev); if (next.has(eq)) next.delete(eq); else next.add(eq); return next })
  }, [])
  const toggleDifficulty = useCallback((d: Difficulty) => {
    setSelectedDifficulty(prev => { const next = new Set(prev); if (next.has(d)) next.delete(d); else next.add(d); return next })
  }, [])

  const hasEquipmentFilter = selectedEquipment.size > 0
  const hasDifficultyFilter = selectedDifficulty.size > 0
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false)

  // Apply equipment + difficulty + search filters to full pool
  const applyFilters = (exercises: typeof exerciseDb) => {
    let results = exercises
    if (hasEquipmentFilter) results = results.filter(ex => selectedEquipment.has(ex.equipment))
    if (hasDifficultyFilter) results = results.filter(ex => selectedDifficulty.has(ex.difficulty))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(ex => ex.name.toLowerCase().includes(q))
    }
    return results
  }

  // PRIMARY: exercises where selected muscle IS the primary target
  const primaryMatches = useMemo(() => {
    const matches = exerciseDb.filter(ex => selectedMuscles.includes(ex.primaryMuscle))
    return sortExercises(applyFilters(matches))
  }, [selectedMuscles, selectedEquipment, selectedDifficulty, searchQuery, hasEquipmentFilter, hasDifficultyFilter])

  // SECONDARY: exercises that also work the selected muscles (but primary is different)
  const secondaryMatches = useMemo(() => {
    const matches = exerciseDb.filter(ex =>
      !selectedMuscles.includes(ex.primaryMuscle) &&
      ex.secondaryMuscles.some(m => selectedMuscles.includes(m))
    )
    return sortExercises(applyFilters(matches))
  }, [selectedMuscles, selectedEquipment, selectedDifficulty, searchQuery, hasEquipmentFilter, hasDifficultyFilter])

  // COMPOUND: exercises hitting multiple selected muscles (only when 2+ selected)
  const compoundMatches = useMemo(() => {
    if (selectedMuscles.length < 2) return []
    return sortExercises(applyFilters(
      exerciseDb.filter(ex => {
        if (ex.type !== 'compound') return false
        const all = [ex.primaryMuscle, ...ex.secondaryMuscles]
        return selectedMuscles.filter(m => all.includes(m)).length >= 2
      })
    ))
  }, [selectedMuscles, selectedEquipment, selectedDifficulty, searchQuery, hasEquipmentFilter, hasDifficultyFilter])

  // IDs to exclude from regular sections (shown in compound section)
  const compoundIds = useMemo(() => new Set(compoundMatches.map(ex => ex.id)), [compoundMatches])

  if (selectedMuscles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FiSearch className="text-primary text-2xl" />
        </div>
        <h3 className="text-lg font-display font-bold text-text-primary mb-2">Tap a muscle group</h3>
        <p className="text-text-muted text-sm max-w-xs">Click on the body map to see exercises for that area. You can select multiple.</p>
      </div>
    )
  }

  // Muscle labels for headers
  const muscleLabel = selectedMuscles.map(getMuscleGroupLabel).join(' & ')

  return (
    <div className="space-y-3">
      {/* Selected muscles + count */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedMuscles.map(m => (
          <Badge key={m} variant="primary" size="md">{getMuscleGroupLabel(m)}</Badge>
        ))}
        <span className="text-xs md:text-sm text-text-muted">{primaryMatches.length} exercises</span>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search exercises..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all" />
      </div>

      {/* Difficulty filter (always visible) */}
      <div className="flex gap-1.5">
        <button onClick={() => setSelectedDifficulty(new Set())}
          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${!hasDifficultyFilter ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>All Levels</button>
        {DIFFICULTY_OPTIONS.map(d => (
          <button key={d} onClick={() => toggleDifficulty(d)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedDifficulty.has(d) ? difficultyFilterStyles[d] : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Equipment filter (collapsible on mobile) */}
      <div className="hidden md:block">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button onClick={() => setSelectedEquipment(new Set())}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${!hasEquipmentFilter ? 'bg-primary/15 text-primary border-primary/30' : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>All</button>
          {EQUIPMENT_OPTIONS.map(eq => (
            <button key={eq} onClick={() => toggleEquipment(eq)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${selectedEquipment.has(eq) ? 'bg-primary/15 text-primary border-primary/30' : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>
              {getEquipmentLabel(eq)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile equipment filter toggle */}
      <div className="md:hidden">
        <button onClick={() => setShowEquipmentFilter(!showEquipmentFilter)}
          className="w-full px-3 py-2 text-xs font-medium text-text-muted bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center justify-between">
          <span>Equipment {hasEquipmentFilter && `(${selectedEquipment.size})`}</span>
          {showEquipmentFilter ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </button>
        {showEquipmentFilter && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button onClick={() => setSelectedEquipment(new Set())}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${!hasEquipmentFilter ? 'bg-primary/15 text-primary border-primary/30' : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>All</button>
            {EQUIPMENT_OPTIONS.map(eq => (
              <button key={eq} onClick={() => toggleEquipment(eq)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border transition-all ${selectedEquipment.has(eq) ? 'bg-primary/15 text-primary border-primary/30' : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'}`}>
                {getEquipmentLabel(eq)}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* ===== Compound section (2+ muscles selected) ===== */}
      {compoundMatches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-2">
            <FiZap className="text-accent" />
            <h3 className="text-sm font-bold text-text-primary">Compound — Hits Multiple Selected Muscles</h3>
            <Badge variant="accent" size="sm">{compoundMatches.length}</Badge>
          </div>
          <p className="text-xs text-text-muted">One movement working {selectedMuscles.length >= 3 ? 'several' : 'both'} of your selected muscle groups.</p>
          {compoundMatches.map(ex => <ExerciseCard key={`compound-${ex.id}`} ex={ex} expandedId={expandedId} setExpandedId={setExpandedId} idPrefix="compound-" selectedMuscles={selectedMuscles} />)}
        </div>
      )}

      {/* ===== Primary matches — TARGET exercises ===== */}
      {primaryMatches.length > 0 && (
        <div className="space-y-2">
          {compoundMatches.length > 0 && (
            <div className="flex items-center gap-3 pt-4">
              <div className="flex-1 h-px bg-white/5" /><span className="text-xs text-text-muted">{muscleLabel} Exercises</span><div className="flex-1 h-px bg-white/5" />
            </div>
          )}
          {primaryMatches.filter(ex => !compoundIds.has(ex.id)).map(ex =>
            <ExerciseCard key={ex.id} ex={ex} expandedId={expandedId} setExpandedId={setExpandedId} selectedMuscles={selectedMuscles} />
          )}
        </div>
      )}

      {/* ===== Secondary matches — show differently based on whether primary has results ===== */}
      {secondaryMatches.filter(ex => !compoundIds.has(ex.id)).length > 0 && (
        <div className="space-y-2 pt-4">
          {primaryMatches.filter(ex => !compoundIds.has(ex.id)).length > 0 ? (
            /* Primary has results — show secondary as collapsible section */
            <>
              <button onClick={() => setShowSecondary(!showSecondary)} className="flex items-center gap-2 w-full">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-text-muted flex items-center gap-1">
                  Also targets {muscleLabel} ({secondaryMatches.filter(ex => !compoundIds.has(ex.id)).length})
                  {showSecondary ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </button>
              {showSecondary && (
                <div className="space-y-2 opacity-70">
                  {secondaryMatches.filter(ex => !compoundIds.has(ex.id)).map(ex =>
                    <ExerciseCard key={`secondary-${ex.id}`} ex={ex} expandedId={expandedId} setExpandedId={setExpandedId} idPrefix="secondary-" selectedMuscles={selectedMuscles} showPrimaryLabel />
                  )}
                </div>
              )}
            </>
          ) : (
            /* No primary results — show secondary exercises directly with explanation */
            <>
              <p className="text-xs text-text-muted">No {muscleLabel.toLowerCase()}-only exercises match your equipment filter. Showing exercises that also target {muscleLabel.toLowerCase()}:</p>
              <div className="space-y-2">
                {secondaryMatches.filter(ex => !compoundIds.has(ex.id)).map(ex =>
                  <ExerciseCard key={`secondary-${ex.id}`} ex={ex} expandedId={expandedId} setExpandedId={setExpandedId} idPrefix="secondary-" selectedMuscles={selectedMuscles} showPrimaryLabel />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {primaryMatches.length === 0 && secondaryMatches.length === 0 && compoundMatches.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">No exercises match your filters.</p>
      )}
    </div>
  )
}

// Reusable exercise card
function ExerciseCard({ ex, expandedId, setExpandedId, idPrefix = '', selectedMuscles, showPrimaryLabel }: {
  ex: typeof exerciseDb[0]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  idPrefix?: string
  selectedMuscles: MuscleGroup[]
  showPrimaryLabel?: boolean
}) {
  const cardId = `${idPrefix}${ex.id}`
  const isExpanded = expandedId === cardId
  const videoId = getExerciseVideoId(ex.name)
  const allMuscles = [ex.primaryMuscle, ...ex.secondaryMuscles]
  const matchCount = idPrefix === 'compound-' ? selectedMuscles.filter(m => allMuscles.includes(m)).length : 0

  return (
    <Card padding="none" className="overflow-hidden">
      <button onClick={() => setExpandedId(isExpanded ? null : cardId)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-text-primary text-sm">{ex.name}</h4>
            {matchCount >= 2 && <Badge variant="accent" size="sm">Hits {matchCount}/{selectedMuscles.length}</Badge>}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={difficultyColors[ex.difficulty]} size="sm">{ex.difficulty}</Badge>
            <Badge variant="neutral" size="sm">{getEquipmentLabel(ex.equipment)}</Badge>
            {idPrefix === 'compound-' ? (
              allMuscles.map(m => <Badge key={m} variant={selectedMuscles.includes(m) ? 'primary' : 'neutral'} size="sm">{getMuscleGroupLabel(m)}</Badge>)
            ) : (
              <>
                <Badge variant={ex.type === 'compound' ? 'primary' : 'accent'} size="sm">{ex.type}</Badge>
                {showPrimaryLabel && <span className="text-[10px] text-text-muted">Primary: {getMuscleGroupLabel(ex.primaryMuscle)}</span>}
                {!showPrimaryLabel && ex.secondaryMuscles.length > 0 && (
                  <span className="text-[10px] text-text-muted">+{ex.secondaryMuscles.map(getMuscleGroupLabel).join(', ')}</span>
                )}
              </>
            )}
          </div>
        </div>
        {isExpanded ? <FiChevronUp className="text-text-muted flex-shrink-0" /> : <FiChevronDown className="text-text-muted flex-shrink-0" />}
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 p-4 space-y-4 animate-fade-in">
          {videoId ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-black/30" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title={`${ex.name} form guide`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-xl" />
            </div>
          ) : (
            <a href={getExerciseSearchUrl(ex.name)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all">
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
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          {ex.tips.length > 0 && (
            <div>
              <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">Tips</h5>
              {ex.tips.map((tip, i) => (
                <p key={i} className="text-sm text-accent flex items-start gap-2"><FiZap className="mt-0.5 flex-shrink-0" size={14} /> {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
