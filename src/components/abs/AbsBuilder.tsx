'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge } from '../ui'
import { useWorkoutStore } from '../../store/workoutStore'
import { useWorkoutLogStore } from '../../store/workoutLogStore'
import { useToast } from '../../store/toastStore'
import { generateAbsPlan, DEFAULT_LIMITATIONS, type AbsAnswers, type AbsGoal, type AbsLevel, type AbsEquipment, type AbsPlan, type AbsLimitations, type AbsFormat } from '../../lib/absBuilder'
import { FiTarget, FiClock, FiZap, FiPlay, FiRefreshCw, FiCheck, FiArrowRight, FiAlertCircle, FiShield, FiList, FiRepeat } from 'react-icons/fi'

const GOALS: { id: AbsGoal; label: string; desc: string }[] = [
  { id: 'tone',      label: 'Define & Tone', desc: 'Carve visible abs with mixed flexion + rotation' },
  { id: 'strength',  label: 'Build Strength', desc: 'Loaded core work — ab wheel, cable, weighted' },
  { id: 'endurance', label: 'Endurance',      desc: 'Long holds + high reps for stamina' },
]

const LEVELS: { id: AbsLevel; label: string; desc: string }[] = [
  { id: 'beginner',     label: 'Beginner',     desc: 'New to ab training' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basics' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Bring on the hanging leg raises' },
]

const DURATIONS: AbsAnswers['duration'][] = [5, 10, 15, 20]

const EQUIPMENTS: { id: AbsEquipment; label: string; desc: string }[] = [
  { id: 'bodyweight', label: 'Bodyweight only', desc: 'Anywhere — floor + your body' },
  { id: 'gym',        label: 'Full gym',        desc: 'Cable, ab wheel, weights, pull-up bar' },
]

const LIMITATION_OPTIONS: { id: keyof AbsLimitations; label: string; desc: string }[] = [
  { id: 'lowerBack',     label: 'Lower back is sensitive',     desc: 'Skips weighted flexion, ab wheel, decline crunches, sit-ups' },
  { id: 'wrists',        label: 'Wrists hurt in plank/push-up', desc: 'Skips planks, ab wheel, mountain climber, bear crawl' },
  { id: 'cantPlank',     label: "Can't hold a 30-sec plank yet", desc: 'Skips all plank variations and ab wheel' },
  { id: 'cantLegRaise',  label: "Can't do straight-leg raises", desc: 'Skips leg raises, V-ups, flutter, Russian twist, hanging moves' },
]

const FORMATS: { id: AbsFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'sequential', label: 'Standard sets', desc: 'Finish all sets of one exercise, then move on (e.g. 3× Plank → 3× Crunch)', icon: <FiList /> },
  { id: 'circuit',    label: 'Circuit rounds', desc: 'Rotate through every exercise, rest, repeat as rounds (e.g. Plank → Crunch → Leg Raise, rest, repeat)', icon: <FiRepeat /> },
]

export function AbsBuilder() {
  const router = useRouter()
  const { addPlan } = useWorkoutStore()
  const { startWorkout } = useWorkoutLogStore()
  const toast = useToast()

  const [answers, setAnswers] = useState<AbsAnswers>({
    goal: 'tone',
    level: 'beginner',
    duration: 10,
    equipment: 'bodyweight',
    limitations: { ...DEFAULT_LIMITATIONS },
    format: 'sequential',
  })
  const [plan, setPlan] = useState<AbsPlan | null>(null)
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)

  const update = (partial: Partial<AbsAnswers>) => {
    setAnswers(prev => ({ ...prev, ...partial }))
    setPlan(null) // clear preview when answers change
    setSavedPlanId(null)
  }

  const toggleLimitation = (key: keyof AbsLimitations) => {
    setAnswers(prev => ({
      ...prev,
      limitations: { ...prev.limitations, [key]: !prev.limitations[key] },
    }))
    setPlan(null)
    setSavedPlanId(null)
  }

  const activeLimitationCount = Object.values(answers.limitations).filter(Boolean).length

  const handleGenerate = (shuffle: boolean = false) => {
    const generated = generateAbsPlan(answers, shuffle)
    if (generated.exercises.length === 0) {
      toast.error('Could not build a plan — try different settings.')
      return
    }
    setPlan(generated)
    setSavedPlanId(null)
    // Scroll to preview
    setTimeout(() => {
      document.getElementById('abs-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleShuffle = () => handleGenerate(true)

  const handleSave = () => {
    if (!plan) return
    const planExercises = plan.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      notes: ex.notes,
      restSeconds: ex.restSeconds,
      triggerRestAfter: ex.triggerRestAfter, // circuit round-rest carries to active workout
    }))
    addPlan({
      name: plan.name,
      description: `${plan.description} (~${plan.estimatedMinutes} min)`,
      exercises: planExercises,
      isPreMade: false,
    })
    // addPlan sets selectedPlan to the newly created plan with a generated id
    const justAdded = useWorkoutStore.getState().selectedPlan
    if (justAdded) {
      setSavedPlanId(justAdded.id)
      toast.success('Saved to your plans!')
    } else {
      toast.error('Saved, but could not auto-start. Find it under Plans.')
    }
  }

  const handleStartNow = () => {
    if (!savedPlanId || !plan) return
    startWorkout(savedPlanId, plan.name)
    router.push('/workout')
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <FiTarget className="text-accent text-xl" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Abs Builder</h1>
        </div>
        <p className="text-text-secondary">A focused core workout in three taps. Answer below and we&apos;ll build it.</p>
      </div>

      {/* Form */}
      <Card padding="lg">
        <div className="space-y-6">
          {/* Goal */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold flex items-center gap-2 mb-3">
              <FiZap /> Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => update({ goal: g.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    answers.goal === g.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-semibold text-text-primary">{g.label}</div>
                  <div className="text-xs text-text-muted mt-1">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3 block">Experience Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  onClick={() => update({ level: l.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    answers.level === l.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-semibold text-text-primary">{l.label}</div>
                  <div className="text-xs text-text-muted mt-1">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold flex items-center gap-2 mb-3">
              <FiClock /> Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => update({ duration: d })}
                  className={`px-4 py-3 rounded-xl border text-center transition-all ${
                    answers.duration === d
                      ? 'bg-primary/10 border-primary/50 text-primary'
                      : 'bg-white/[0.02] border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'
                  }`}
                >
                  <span className="text-lg font-display font-bold">{d}</span>
                  <span className="text-xs ml-1">min</span>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3 block">Equipment</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EQUIPMENTS.map(e => (
                <button
                  key={e.id}
                  onClick={() => update({ equipment: e.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    answers.equipment === e.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-semibold text-text-primary">{e.label}</div>
                  <div className="text-xs text-text-muted mt-1">{e.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format — sequential vs circuit */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold flex items-center gap-2 mb-3">
              <FiRepeat /> Workout format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FORMATS.map(f => {
                const selected = answers.format === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => update({ format: f.id })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      selected
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${selected ? 'text-primary' : 'text-text-muted'}`}>
                      {f.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary">{f.label}</div>
                      <div className="text-xs text-text-muted mt-1 leading-snug">{f.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Limitations / Capability check */}
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold flex items-center gap-2 mb-1">
              <FiShield /> Anything to avoid?
              {activeLimitationCount > 0 && (
                <span className="text-primary">({activeLimitationCount} active)</span>
              )}
            </label>
            <p className="text-xs text-text-muted mb-3">
              Tap any that apply. We&apos;ll skip exercises that need that capability or stress that area.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LIMITATION_OPTIONS.map(opt => {
                const checked = answers.limitations[opt.id]
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => toggleLimitation(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      checked
                        ? 'bg-warning/10 border-warning/40'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked
                        ? 'bg-warning border-warning'
                        : 'border-white/20'
                    }`}>
                      {checked && <FiCheck className="text-white" size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary">{opt.label}</div>
                      <div className="text-xs text-text-muted mt-1 leading-snug">{opt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={() => handleGenerate(false)}
            className="w-full h-14 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FiTarget /> Build My Abs Workout
          </button>
        </div>
      </Card>

      {/* Preview */}
      {plan && (
        <div id="abs-preview" className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">{plan.name}</h2>
              <p className="text-sm text-text-secondary mt-1">{plan.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="primary">{plan.exercises.length} exercises</Badge>
              <Badge variant="accent">~{plan.estimatedMinutes} min</Badge>
            </div>
          </div>

          {/* Coverage — what ab regions this workout hits */}
          {plan.coverage.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Hits:</span>
              {plan.coverage.map(region => (
                <span
                  key={region}
                  className="text-xs px-2 py-1 rounded-full bg-success/10 border border-success/20 text-success"
                >
                  {region}
                </span>
              ))}
            </div>
          )}

          {/* Limitation feedback */}
          {(plan.excludedByLimitations > 0 || plan.safetyNetTriggered || plan.exercises.length < plan.targetExerciseCount) && (
            <div className="text-xs bg-warning/5 border border-warning/20 rounded-xl px-3 py-2 flex items-start gap-2">
              <FiAlertCircle className="text-warning mt-0.5 flex-shrink-0" />
              <div className="text-text-secondary space-y-1">
                {plan.excludedByLimitations > 0 && (
                  <div>
                    Filtered out <span className="font-semibold text-text-primary">{plan.excludedByLimitations}</span>{' '}
                    exercise{plan.excludedByLimitations === 1 ? '' : 's'} based on what you flagged to avoid.
                  </div>
                )}
                {plan.safetyNetTriggered && (
                  <div>
                    Difficulty was relaxed to find more options for your limits.
                  </div>
                )}
                {plan.exercises.length < plan.targetExerciseCount && (
                  <div>
                    Only <span className="font-semibold text-text-primary">{plan.exercises.length}</span> of the {plan.targetExerciseCount} target exercises fit your selections — try unchecking a limit, switching to gym equipment, or shortening the session.
                  </div>
                )}
              </div>
            </div>
          )}

          {plan.format === 'circuit' ? (
            // Circuit preview — show ONE round template + "× N rounds" header
            <Card padding="md">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FiRepeat className="text-primary" />
                  <span className="text-sm font-semibold text-text-primary">
                    {plan.rounds} round{plan.rounds === 1 ? '' : 's'} of this circuit:
                  </span>
                </div>
                <span className="text-xs text-text-muted">~60s rest between rounds</span>
              </div>
              <div className="space-y-2">
                {plan.uniqueExercises.map((ex, idx) => (
                  <div key={ex.id} className="bg-white/[0.02] rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">
                        {idx + 1}. {ex.name}
                      </div>
                      {ex.notes && <p className="text-xs text-text-muted mt-1 leading-relaxed">{ex.notes}</p>}
                    </div>
                    <div className="text-right text-xs text-text-muted whitespace-nowrap">
                      <div className="font-medium text-text-primary">
                        {ex.reps}{ex.isDurationBased ? 's' : ' reps'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3 leading-relaxed">
                Saved as {plan.exercises.length} entries ({plan.uniqueExercises.length} exercises × {plan.rounds} rounds) so the workout flow walks you through each round in order.
              </p>
            </Card>
          ) : (
            // Sequential preview — standard set-by-set list
            <Card padding="md">
              <div className="space-y-2">
                {plan.exercises.map((ex, idx) => (
                  <div key={ex.id} className="bg-white/[0.02] rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">
                        {idx + 1}. {ex.name}
                      </div>
                      {ex.notes && <p className="text-xs text-text-muted mt-1 leading-relaxed">{ex.notes}</p>}
                    </div>
                    <div className="text-right text-xs text-text-muted whitespace-nowrap">
                      <div className="font-medium text-text-primary">
                        {ex.sets} × {ex.reps}{ex.isDurationBased ? 's' : ''}
                      </div>
                      <div>{ex.restSeconds}s rest</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" size="lg" onClick={handleShuffle} className="flex-1">
              <FiRefreshCw /> Try a different mix
            </Button>
            {!savedPlanId ? (
              <button
                onClick={handleSave}
                className="flex-1 h-12 bg-gradient-primary text-white font-display font-bold rounded-xl shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <FiCheck /> Save to my plans
              </button>
            ) : (
              <button
                onClick={handleStartNow}
                className="flex-1 h-12 bg-gradient-success text-white font-display font-bold rounded-xl shadow-glow-success hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <FiPlay /> Start workout now <FiArrowRight />
              </button>
            )}
          </div>

          {savedPlanId && (
            <p className="text-xs text-text-muted text-center">
              Saved. Find it any time under{' '}
              <button onClick={() => router.push('/plans')} className="text-primary hover:underline">Plans</button>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
