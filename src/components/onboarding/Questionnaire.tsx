'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { useOnboardingStore, DEFAULT_ANSWERS, type OnboardingAnswers } from '../../store/onboardingStore'
import { generatePlan, type GeneratedPlan } from '../../lib/planGenerator'
import { getAllMuscleGroups, getAllEquipment, getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import type { MuscleGroup, Equipment } from '../../data/exercises'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SelectionCard, PillToggle, DayToggle, NumberCard } from './SelectionCard'
import { PlanPreview } from './PlanPreview'
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiTarget, FiAward, FiTrendingDown,
  FiHeart, FiActivity, FiMaximize2, FiHome, FiMapPin, FiSun, FiCompass,
  FiZap, FiTrendingUp, FiStar, FiShield, FiRefreshCw, FiUsers, FiUser
} from 'react-icons/fi'

const TOTAL_STEPS = 10 // 0=welcome, 1-9=steps

const INJURY_AREAS = [
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'back-spine', label: 'Back / Spine' },
  { id: 'knees', label: 'Knees' },
  { id: 'wrists', label: 'Wrists' },
  { id: 'hips', label: 'Hips' },
  { id: 'ankles', label: 'Ankles' },
  { id: 'neck', label: 'Neck' },
]

const GOALS = [
  { id: 'strength', label: 'Build Strength', desc: 'Get stronger, lift heavier', icon: <FiTarget /> },
  { id: 'muscle-building', label: 'Build Muscle', desc: 'Grow bigger muscles', icon: <FiAward /> },
  { id: 'toning', label: 'Body Toning', desc: 'Define muscles, look lean', icon: <FiStar /> },
  { id: 'fat-loss', label: 'Lose Fat', desc: 'Burn calories, get leaner', icon: <FiTrendingDown /> },
  { id: 'general-fitness', label: 'General Fitness', desc: 'Stay healthy, feel good', icon: <FiHeart /> },
  { id: 'endurance', label: 'Build Endurance', desc: 'Improve stamina', icon: <FiActivity /> },
  { id: 'flexibility', label: 'Improve Flexibility', desc: 'Move better', icon: <FiMaximize2 /> },
]

const LOCATIONS = [
  { id: 'gym', label: 'At a Gym', desc: 'Full gym access', icon: <FiMapPin /> },
  { id: 'home', label: 'At Home', desc: 'Home equipment', icon: <FiHome /> },
  { id: 'outdoor', label: 'Outdoors', desc: 'Parks, outdoors', icon: <FiSun /> },
  { id: 'mixed', label: 'Mixed', desc: 'Combination', icon: <FiCompass /> },
]

const SPLIT_LABELS: Record<number, string> = { 2: 'Full Body', 3: 'PPL', 4: 'Upper/Lower', 5: '5-Day', 6: 'PPL ×2' }

const WEEKDAYS = [
  { id: 'monday', label: 'M' }, { id: 'tuesday', label: 'T' }, { id: 'wednesday', label: 'W' },
  { id: 'thursday', label: 'T' }, { id: 'friday', label: 'F' }, { id: 'saturday', label: 'S' }, { id: 'sunday', label: 'S' },
]

const FAMILIAR_EXERCISES = [
  'Push-ups', 'Squats', 'Plank', 'Lunges', 'Bench Press',
  'Deadlift', 'Pull-ups', 'Shoulder Press', 'Rows', 'Curls',
]

// Equipment options - exclude bodyweight and none (always available)
const EQUIPMENT_OPTIONS = getAllEquipment().filter(eq => eq !== 'bodyweight' && eq !== 'none')

function suggestDays(count: number): string[] {
  const all = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  if (count >= 7) return all
  const spacing = Math.floor(7 / count)
  return Array.from({ length: count }, (_, i) => all[(i * spacing) % 7])
}

export function Questionnaire() {
  const router = useRouter()
  const { profile, updateProfile } = useUserStore()
  const { addPlan } = useWorkoutStore()
  const onboardingStore = useOnboardingStore()

  const [step, setStep] = useState(0)
  const [answers, setLocalAnswers] = useState<OnboardingAnswers>(() => ({
    ...DEFAULT_ANSWERS,
    name: profile?.name || '',
    age: profile?.age || 0,
    gender: (profile?.gender as any) || '',
    height: profile?.height || 0,
    weight: profile?.weight || 0,
    // Resume from stored answers if available
    ...(onboardingStore.answers || {}),
  }))
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [planName, setPlanName] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const update = (partial: Partial<OnboardingAnswers>) => setLocalAnswers(prev => ({ ...prev, ...partial }))
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

  // Auto-suggest days when daysPerWeek changes
  useEffect(() => {
    update({ specificDays: suggestDays(answers.daysPerWeek) })
  }, [answers.daysPerWeek])

  // Auto-set complexity for beginners
  useEffect(() => {
    if (answers.fitnessLevel === 'complete-beginner' && answers.exerciseComplexity !== 'simple') {
      update({ exerciseComplexity: 'simple' })
    }
  }, [answers.fitnessLevel])

  const handleGenerate = () => {
    const plan = generatePlan(answers)
    const levelLabel = answers.fitnessLevel === 'complete-beginner' ? 'Beginner' : answers.fitnessLevel === 'some-experience' ? 'Intermediate' : 'Advanced'
    const goalNames: Record<string, string> = {
      'strength': 'Strength', 'muscle-building': 'Muscle Building', 'toning': 'Tone & Define',
      'fat-loss': 'Fat Burn', 'general-fitness': 'Fitness', 'endurance': 'Endurance', 'flexibility': 'Flexibility',
    }
    const secondaryNames: Record<string, string> = { 'strength': 'Strength', 'fat-loss': 'Conditioning', 'muscle-building': 'Hypertrophy', 'toning': 'Toning', 'endurance': 'Endurance' }
    const goalLabel = goalNames[answers.primaryGoal] || 'Fitness'
    const secondaryLabel = answers.secondaryGoal ? ` & ${secondaryNames[answers.secondaryGoal] || ''}` : ''
    setPlanName(`${levelLabel} ${goalLabel}${secondaryLabel}`)
    setGeneratedPlan(plan)
    setShowPreview(true)
  }

  const handleShuffle = () => setGeneratedPlan(generatePlan(answers, [], true))

  const handleConfirm = () => {
    if (!generatedPlan || !planName.trim()) return
    onboardingStore.setAnswers(answers)
    updateProfile({ name: answers.name, age: answers.age, gender: answers.gender || undefined, height: answers.height, weight: answers.weight })

    const allIds: string[] = []
    generatedPlan.days.forEach(day => {
      addPlan({
        name: `${planName.trim()} - ${day.dayName} ${day.splitName}`,
        description: `${day.splitName} targeting ${day.targetMuscles.map(getMuscleGroupLabel).join(', ')}. ~${day.estimatedMinutes} min.`,
        exercises: day.exercises,
        isPreMade: false,
      })
      day.exercises.forEach(ex => allIds.push(ex.id))
    })
    onboardingStore.markPlanCreated()
    onboardingStore.addUsedExercises(allIds)
    router.push('/plans')
  }

  const progress = step === 0 ? 0 : (step / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress bar */}
      {step > 0 && !showPreview && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Step {step} of {TOTAL_STEPS - 1}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Plan Preview */}
      {showPreview && generatedPlan && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="mb-4">
            <FiArrowLeft /> Back to questions
          </Button>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">Your Personalized Plan</h2>
          <PlanPreview plan={generatedPlan} planName={planName} onPlanNameChange={setPlanName} onConfirm={handleConfirm} onShuffle={handleShuffle} />
        </div>
      )}

      {/* Steps */}
      {!showPreview && (
        <div className="space-y-6">

          {/* ===== Step 0: Welcome ===== */}
          {step === 0 && (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-mixed flex items-center justify-center mx-auto mb-6">
                <FiZap className="text-white text-3xl" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
                Let&apos;s Build Your <span className="gradient-text">Perfect Plan</span>
              </h1>
              <p className="text-text-secondary text-base sm:text-lg mb-2 max-w-md mx-auto">
                Answer a few questions and we&apos;ll create a personalized training program just for you.
              </p>
              <p className="text-text-muted text-sm mb-8">Takes about 5 minutes</p>
              <button onClick={next} className="h-14 px-10 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200">
                Let&apos;s Go <FiArrowRight className="inline ml-2" />
              </button>
            </div>
          )}

          {/* ===== Step 1: About You ===== */}
          {step === 1 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="About You" subtitle="Basic info to personalise your plan." />
              <Input label="What should we call you?" value={answers.name} onChange={e => update({ name: e.target.value })} placeholder="Your name" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Age" type="number" value={answers.age || ''} onChange={e => update({ age: Number(e.target.value) })} placeholder="25" min={13} max={99} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Gender</label>
                  <div className="flex gap-2">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <PillToggle key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={answers.gender === g} onClick={() => update({ gender: g })} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Height (cm)" type="number" value={answers.height || ''} onChange={e => update({ height: Number(e.target.value) })} placeholder="175" min={100} max={250} />
                <Input label="Weight (kg)" type="number" value={answers.weight || ''} onChange={e => update({ weight: Number(e.target.value) })} placeholder="75" min={30} max={300} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => {
                  // Save profile data immediately so it persists even if user doesn't finish questionnaire
                  updateProfile({
                    name: answers.name,
                    age: answers.age,
                    gender: answers.gender || undefined,
                    height: answers.height || undefined,
                    weight: answers.weight || undefined,
                  })
                  next()
                }} disabled={!answers.name?.trim()}>Next <FiArrowRight /></Button>
              </div>
            </div>
          )}

          {/* ===== Step 2: Fitness Level & Injuries ===== */}
          {step === 2 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Fitness Level" subtitle="Be honest — there's no wrong answer." />
              <div className="space-y-2">
                <SelectionCard icon={<FiStar />} label="Complete Beginner" description="Never followed a workout program" selected={answers.fitnessLevel === 'complete-beginner'} onClick={() => update({ fitnessLevel: 'complete-beginner' })} size="lg" />
                <SelectionCard icon={<FiTrendingUp />} label="Some Experience" description="Done some workouts, not consistently" selected={answers.fitnessLevel === 'some-experience'} onClick={() => update({ fitnessLevel: 'some-experience' })} size="lg" />
                <SelectionCard icon={<FiZap />} label="Regular Exerciser" description="Work out regularly, want a better plan" selected={answers.fitnessLevel === 'regular-exerciser'} onClick={() => update({ fitnessLevel: 'regular-exerciser' })} size="lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Any injuries or limitations?</label>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="None" selected={answers.injuries.length === 0} onClick={() => update({ injuries: [], injurySeverity: {} })} />
                  {INJURY_AREAS.map(area => (
                    <PillToggle key={area.id} label={area.label} selected={answers.injuries.includes(area.id)} onClick={() => {
                      const newInjuries = toggleInArray(answers.injuries, area.id)
                      const newSeverity = { ...answers.injurySeverity }
                      if (!newInjuries.includes(area.id)) delete newSeverity[area.id]
                      else if (!newSeverity[area.id]) newSeverity[area.id] = 'chronic'
                      update({ injuries: newInjuries, injurySeverity: newSeverity })
                    }} />
                  ))}
                </div>
              </div>
              {/* Injury severity for each selected injury */}
              {answers.injuries.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary block">Injury status</label>
                  {answers.injuries.map(id => {
                    const area = INJURY_AREAS.find(a => a.id === id)
                    return (
                      <div key={id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2">
                        <span className="text-sm text-text-primary">{area?.label}</span>
                        <div className="flex gap-2">
                          <PillToggle label="Recovering" selected={answers.injurySeverity[id] === 'acute'} onClick={() => update({ injurySeverity: { ...answers.injurySeverity, [id]: 'acute' } })} />
                          <PillToggle label="Ongoing" selected={answers.injurySeverity[id] === 'chronic' || !answers.injurySeverity[id]} onClick={() => update({ injurySeverity: { ...answers.injurySeverity, [id]: 'chronic' } })} />
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-text-muted">Recovering = we&apos;ll avoid those areas. Ongoing = we&apos;ll include lighter exercises.</p>
                </div>
              )}
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 3: Goals ===== */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Your Goals" subtitle="What are you training for?" />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Primary goal</label>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map(g => (
                    <SelectionCard key={g.id} icon={g.icon} label={g.label} description={g.desc} selected={answers.primaryGoal === g.id} onClick={() => update({ primaryGoal: g.id as any })} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Secondary goal (optional)</label>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="None" selected={!answers.secondaryGoal} onClick={() => update({ secondaryGoal: '' })} />
                  {GOALS.filter(g => g.id !== answers.primaryGoal).map(g => (
                    <PillToggle key={g.id} label={g.label} selected={answers.secondaryGoal === g.id} onClick={() => update({ secondaryGoal: g.id })} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Include cardio in your plan?</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: 'none', l: 'No cardio' }, { v: 'light', l: 'Light (walks)' },
                    { v: 'moderate', l: 'Moderate (20 min)' }, { v: 'heavy', l: 'Heavy (30+ min)' },
                  ].map(c => (
                    <PillToggle key={c.v} label={c.l} selected={answers.cardioPreference === c.v} onClick={() => update({ cardioPreference: c.v as any })} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Program duration</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { w: 4, l: '4 weeks — Try it out' }, { w: 8, l: '8 weeks — Build a habit' },
                    { w: 12, l: '12 weeks — Commit' }, { w: 24, l: '6 months — Transform' },
                  ].map(t => (
                    <PillToggle key={t.w} label={t.l} selected={answers.timelineWeeks === t.w} onClick={() => update({ timelineWeeks: t.w })} />
                  ))}
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 4: Equipment & Location ===== */}
          {step === 4 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Equipment & Location" subtitle="Where and with what will you train?" />
              <div className="grid grid-cols-2 gap-3">
                {LOCATIONS.map(loc => (
                  <SelectionCard key={loc.id} icon={loc.icon} label={loc.label} description={loc.desc} selected={answers.trainingLocation === loc.id} onClick={() => update({ trainingLocation: loc.id as any })} size="lg" />
                ))}
              </div>
              {answers.trainingLocation !== 'outdoor' && (
                <div>
                  <label className="text-sm font-medium text-text-secondary block mb-2">What equipment do you have access to?</label>
                  <p className="text-xs text-text-muted mb-3">Bodyweight exercises are always included. Select any equipment you can use.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <PillToggle key={eq} label={getEquipmentLabel(eq)} selected={answers.availableEquipment.includes(eq)} onClick={() => update({ availableEquipment: toggleInArray(answers.availableEquipment, eq) })} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Do you have an adjustable bench?</label>
                <p className="text-xs text-text-muted mb-2">Some exercises need a bench that can incline/decline.</p>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="Yes" selected={answers.hasAdjustableBench === true} onClick={() => update({ hasAdjustableBench: true })} />
                  <PillToggle label="No" selected={answers.hasAdjustableBench === false} onClick={() => update({ hasAdjustableBench: false })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Do you have a training partner?</label>
                <p className="text-xs text-text-muted mb-2">Affects whether we suggest exercises that need a spotter.</p>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="Yes, regularly" selected={answers.hasTrainingPartner === 'yes'} onClick={() => update({ hasTrainingPartner: 'yes' })} />
                  <PillToggle label="Sometimes" selected={answers.hasTrainingPartner === 'sometimes'} onClick={() => update({ hasTrainingPartner: 'sometimes' })} />
                  <PillToggle label="No, I train alone" selected={answers.hasTrainingPartner === 'no'} onClick={() => update({ hasTrainingPartner: 'no' })} />
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 5: Schedule ===== */}
          {step === 5 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Your Schedule" subtitle="When and how long can you train?" />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-3">Days per week</label>
                <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                  {[2, 3, 4, 5, 6].map(n => (
                    <NumberCard key={n} value={n} subtitle={SPLIT_LABELS[n]} selected={answers.daysPerWeek === n} onClick={() => update({ daysPerWeek: n })} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-3">Which days?</label>
                <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
                  {WEEKDAYS.map(d => (
                    <DayToggle key={d.id} day={d.id} label={d.label} selected={answers.specificDays.includes(d.id)} onClick={() => {
                      const newDays = toggleInArray(answers.specificDays, d.id)
                      if (newDays.length <= answers.daysPerWeek) update({ specificDays: newDays })
                    }} />
                  ))}
                </div>
                <p className="text-xs text-text-muted text-center mt-2">Select {answers.daysPerWeek} days ({answers.specificDays.length} selected)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Session duration</label>
                <div className="flex flex-wrap gap-2">
                  {[{ v: 30, l: '30 min' }, { v: 45, l: '45 min' }, { v: 60, l: '60 min' }, { v: 90, l: '90 min' }].map(d => (
                    <PillToggle key={d.v} label={d.l} selected={answers.sessionDuration === d.v} onClick={() => update({ sessionDuration: d.v })} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Warm-up preference</label>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="Quick 5 min" selected={answers.warmupPreference === 'quick'} onClick={() => update({ warmupPreference: 'quick' })} />
                  <PillToggle label="Full 10 min" selected={answers.warmupPreference === 'full'} onClick={() => update({ warmupPreference: 'full' })} />
                  <PillToggle label="Skip warm-up" selected={answers.warmupPreference === 'none'} onClick={() => update({ warmupPreference: 'none' })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Preferred time of day</label>
                <div className="flex flex-wrap gap-2">
                  {['Morning', 'Afternoon', 'Evening', 'No preference'].map(t => (
                    <PillToggle key={t} label={t} selected={answers.preferredTime === t.toLowerCase().replace(' ', '-')} onClick={() => update({ preferredTime: t.toLowerCase().replace(' ', '-') })} />
                  ))}
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} nextDisabled={answers.specificDays.length !== answers.daysPerWeek} />
            </div>
          )}

          {/* ===== Step 6: Preferences ===== */}
          {step === 6 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Preferences" subtitle="Tailor your experience." />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Variety or consistency?</label>
                <div className="space-y-2">
                  <SelectionCard icon={<FiRefreshCw />} label="Variety" description="Switch exercises often — keeps it fresh" selected={answers.varietyPreference === 'variety'} onClick={() => update({ varietyPreference: 'variety' })} />
                  <SelectionCard icon={<FiShield />} label="Routine" description="Master the same movements over time" selected={answers.varietyPreference === 'routine'} onClick={() => update({ varietyPreference: 'routine' })} />
                  <SelectionCard icon={<FiActivity />} label="Balanced" description="A mix of both" selected={answers.varietyPreference === 'balanced'} onClick={() => update({ varietyPreference: 'balanced' })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Which areas do you want to prioritise?</label>
                <p className="text-xs text-text-muted mb-2">Selected areas get extra exercises in your plan. Leave empty for a balanced program.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {getAllMuscleGroups().filter(m => m !== 'forearms' && m !== 'traps').map(m => (
                    <PillToggle key={m} label={getMuscleGroupLabel(m)} selected={answers.focusAreas.includes(m)} onClick={() => {
                      if (answers.focusAreas.includes(m)) update({ focusAreas: answers.focusAreas.filter(f => f !== m) })
                      else update({ focusAreas: [...answers.focusAreas, m] })
                    }} />
                  ))}
                </div>
                {answers.focusAreas.length > 0 && <p className="text-xs text-text-muted mt-1">{answers.focusAreas.length} area{answers.focusAreas.length !== 1 ? 's' : ''} selected</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">How often should each muscle be trained?</label>
                <div className="flex flex-wrap gap-2">
                  <PillToggle label="Once/week" selected={answers.muscleFrequency === 'once'} onClick={() => update({ muscleFrequency: 'once' })} />
                  <PillToggle label="Twice/week" selected={answers.muscleFrequency === 'twice'} onClick={() => update({ muscleFrequency: 'twice' })} />
                  <PillToggle label="Auto (best for my split)" selected={answers.muscleFrequency === 'auto'} onClick={() => update({ muscleFrequency: 'auto' })} />
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 7: Exercise Preferences ===== */}
          {step === 7 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Exercise Preferences" subtitle="What kind of exercises suit you?" />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Exercise complexity</label>
                <div className="space-y-2">
                  <SelectionCard label="Keep it simple" description="Easy-to-learn, beginner-friendly movements" selected={answers.exerciseComplexity === 'simple'} onClick={() => update({ exerciseComplexity: 'simple' })} size="sm" />
                  <SelectionCard label="Some complexity is fine" description="Willing to learn new techniques" selected={answers.exerciseComplexity === 'moderate'} onClick={() => update({ exerciseComplexity: 'moderate' })} size="sm" />
                  <SelectionCard label="Bring it on" description="Most effective exercises, any difficulty" selected={answers.exerciseComplexity === 'any'} onClick={() => update({ exerciseComplexity: 'any' })} size="sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Comfortable using free weights (barbells, dumbbells)?</label>
                <div className="flex gap-2 flex-wrap">
                  <PillToggle label="Yes" selected={answers.comfortWithFreeWeights === 'yes'} onClick={() => update({ comfortWithFreeWeights: 'yes' })} />
                  <PillToggle label="Somewhat" selected={answers.comfortWithFreeWeights === 'somewhat'} onClick={() => update({ comfortWithFreeWeights: 'somewhat' })} />
                  <PillToggle label="Not yet" selected={answers.comfortWithFreeWeights === 'not-yet'} onClick={() => update({ comfortWithFreeWeights: 'not-yet' })} />
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 8: Experience ===== */}
          {step === 8 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Your Experience" subtitle="Helps us pick the right starting exercises." />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Have you done any of these before?</label>
                <p className="text-xs text-text-muted mb-3">Select any you&apos;ve tried — we&apos;ll include familiar movements.</p>
                <div className="flex flex-wrap gap-2">
                  {FAMILIAR_EXERCISES.map(ex => (
                    <PillToggle key={ex} label={ex} selected={answers.familiarExercises.includes(ex)} onClick={() => update({ familiarExercises: toggleInArray(answers.familiarExercises, ex) })} />
                  ))}
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </div>
          )}

          {/* ===== Step 9: Review & Generate ===== */}
          {step === 9 && (
            <div className="animate-fade-in space-y-5">
              <StepHeader title="Review & Generate" subtitle="Check your answers, then build your plan." />
              <Card padding="md">
                <div className="space-y-3 text-sm">
                  <SummaryRow label="Name" value={answers.name} onEdit={() => setStep(1)} />
                  <SummaryRow label="Age / Gender" value={`${answers.age || '?'}, ${answers.gender || '?'}`} onEdit={() => setStep(1)} />
                  {answers.height > 0 && <SummaryRow label="Height / Weight" value={`${answers.height}cm, ${answers.weight}kg`} onEdit={() => setStep(1)} />}
                  <SummaryRow label="Level" value={answers.fitnessLevel.replace(/-/g, ' ')} onEdit={() => setStep(2)} />
                  {answers.injuries.length > 0 && <SummaryRow label="Injuries" value={answers.injuries.map(i => `${INJURY_AREAS.find(a => a.id === i)?.label || i} (${answers.injurySeverity[i] || 'ongoing'})`).join(', ')} onEdit={() => setStep(2)} />}
                  <SummaryRow label="Goal" value={`${answers.primaryGoal.replace(/-/g, ' ')}${answers.secondaryGoal ? ` + ${answers.secondaryGoal.replace(/-/g, ' ')}` : ''}`} onEdit={() => setStep(3)} />
                  <SummaryRow label="Cardio" value={answers.cardioPreference} onEdit={() => setStep(3)} />
                  <SummaryRow label="Location" value={answers.trainingLocation} onEdit={() => setStep(4)} />
                  <SummaryRow label="Equipment" value={answers.availableEquipment.length > 0 ? answers.availableEquipment.map(getEquipmentLabel).join(', ') : 'Bodyweight only'} onEdit={() => setStep(4)} />
                  <SummaryRow label="Bench" value={answers.hasAdjustableBench ? 'Yes' : 'No'} onEdit={() => setStep(4)} />
                  <SummaryRow label="Partner" value={answers.hasTrainingPartner === 'yes' ? 'Yes' : answers.hasTrainingPartner === 'sometimes' ? 'Sometimes' : 'No'} onEdit={() => setStep(4)} />
                  <SummaryRow label="Schedule" value={`${answers.daysPerWeek}×/week, ${answers.sessionDuration} min, ${answers.warmupPreference} warm-up`} onEdit={() => setStep(5)} />
                  <SummaryRow label="Days" value={answers.specificDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')} onEdit={() => setStep(5)} />
                  <SummaryRow label="Focus" value={answers.focusAreas.length > 0 ? answers.focusAreas.map(getMuscleGroupLabel).join(', ') : 'Balanced'} onEdit={() => setStep(6)} />
                  <SummaryRow label="Variety" value={answers.varietyPreference} onEdit={() => setStep(6)} />
                  <SummaryRow label="Frequency" value={answers.muscleFrequency === 'auto' ? 'Auto' : answers.muscleFrequency === 'twice' ? 'Twice/week' : 'Once/week'} onEdit={() => setStep(6)} />
                  <SummaryRow label="Complexity" value={answers.exerciseComplexity} onEdit={() => setStep(7)} />
                  <SummaryRow label="Free weights" value={answers.comfortWithFreeWeights === 'yes' ? 'Comfortable' : answers.comfortWithFreeWeights === 'somewhat' ? 'Somewhat' : 'Not yet'} onEdit={() => setStep(7)} />
                  <SummaryRow label="Duration" value={`${answers.timelineWeeks} weeks`} onEdit={() => setStep(3)} />
                </div>
              </Card>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={back}><FiArrowLeft /> Back</Button>
                <button onClick={handleGenerate} className="flex-1 h-14 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2">
                  <FiZap /> Generate My Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-text-primary">{title}</h2>
      <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
    </div>
  )
}

function NavButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between pt-2">
      <Button variant="secondary" onClick={onBack}><FiArrowLeft /> Back</Button>
      <Button onClick={onNext} disabled={nextDisabled}>Next <FiArrowRight /></Button>
    </div>
  )
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-4">
      <span className="text-text-muted flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 text-right min-w-0">
        <span className="text-text-primary capitalize truncate">{value}</span>
        <button onClick={onEdit} className="text-xs text-primary hover:text-primary-light flex-shrink-0" aria-label={`Edit ${label}`}>edit</button>
      </div>
    </div>
  )
}
