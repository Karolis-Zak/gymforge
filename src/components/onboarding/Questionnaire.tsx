'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { useOnboardingStore, DEFAULT_ANSWERS, type OnboardingAnswers } from '../../store/onboardingStore'
import { useToast } from '../../store/toastStore'
import { generatePlan, type GeneratedPlan } from '../../lib/planGenerator'
import { getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import { Button } from '../ui'
import { PlanPreview } from './PlanPreview'
import { FiArrowLeft } from 'react-icons/fi'
import { Step0Welcome } from './steps/Step0Welcome'
import { Step1AboutYou } from './steps/Step1AboutYou'
import { Step2FitnessLevel } from './steps/Step2FitnessLevel'
import { Step3Goals } from './steps/Step3Goals'
import { Step4Equipment } from './steps/Step4Equipment'
import { Step5Schedule } from './steps/Step5Schedule'
import { Step6Preferences } from './steps/Step6Preferences'
import { Step7ExercisePrefs } from './steps/Step7ExercisePrefs'
import { Step8Experience } from './steps/Step8Experience'
import { Step9Review } from './steps/Step9Review'

const TOTAL_STEPS = 10 // 0=welcome, 1-9=steps

function suggestDays(count: number): string[] {
  const all = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  if (count >= 7) return all
  const spacing = Math.floor(7 / count)
  return Array.from({ length: count }, (_, i) => all[(i * spacing) % 7])
}

function toValidBodyType(bt: string): 'lean' | 'athletic' | 'stocky' | 'overweight' | 'obese' | undefined {
  if (bt === 'lean' || bt === 'athletic' || bt === 'stocky' || bt === 'overweight' || bt === 'obese') {
    return bt
  }
  return undefined
}

export function Questionnaire() {
  const router = useRouter()
  const { profile, updateProfile } = useUserStore()
  const { addPlan } = useWorkoutStore()
  const onboardingStore = useOnboardingStore()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [answers, setLocalAnswers] = useState<OnboardingAnswers>(() => {
    const stored = onboardingStore.answers || {}
    return {
      ...DEFAULT_ANSWERS,
      ...stored,
      name: profile?.name || '',
      age: profile?.age || 0,
      gender: (profile?.gender || '') as OnboardingAnswers['gender'],
      height: profile?.height || 0,
      weight: profile?.weight || 0,
    }
  })
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [planName, setPlanName] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const update = (partial: Partial<OnboardingAnswers>) => setLocalAnswers(prev => ({ ...prev, ...partial }))
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 0))
  const goToStep = (targetStep: number) => setStep(Math.max(0, Math.min(targetStep, TOTAL_STEPS)))

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
    setIsGenerating(true)
    try {
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
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShuffle = () => setGeneratedPlan(generatePlan(answers, [], true))

  const handleConfirm = () => {
    if (!generatedPlan || !planName.trim()) return

    try {
      // Update user profile first (safe operation, no rollback needed)
      onboardingStore.setAnswers(answers)
      updateProfile({
        name: profile?.name || answers.name,
        age: profile?.age || answers.age,
        gender: profile?.gender || answers.gender || undefined,
        height: profile?.height || answers.height,
        weight: profile?.weight || answers.weight,
        bodyType: profile?.bodyType || toValidBodyType(answers.bodyType),
        typicalDumbbellWeight: answers.typicalDumbbellWeight ?? profile?.typicalDumbbellWeight,
      })

      // Build all plans first (validation) before adding any
      const plansToAdd = generatedPlan.days.map(day => ({
        name: `${planName.trim()} - ${day.dayName} ${day.splitName}`,
        description: `${day.splitName} targeting ${day.targetMuscles.map(getMuscleGroupLabel).join(', ')}. ~${day.estimatedMinutes} min.`,
        exercises: day.exercises,
        isPreMade: false as const,
      }))

      // Add all plans (atomic operation)
      plansToAdd.forEach(plan => addPlan(plan))

      // Collect exercise IDs after all plans are successfully added
      const allIds: string[] = []
      generatedPlan.days.forEach(day => {
        day.exercises.forEach(ex => allIds.push(ex.id))
      })

      // Mark completion and track exercises
      onboardingStore.markPlanCreated()
      onboardingStore.addUsedExercises(allIds)
      router.push('/plans')
    } catch (error) {
      toast.error('Failed to save your plan. Please try again.')
    }
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold text-text-primary">Your Personalized Plan</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              <FiArrowLeft className="w-3 h-3" /> Edit
            </button>
          </div>
          <PlanPreview plan={generatedPlan} planName={planName} onPlanNameChange={setPlanName} onConfirm={handleConfirm} onShuffle={handleShuffle} />
        </div>
      )}

      {/* Steps */}
      {!showPreview && (
        <div className="space-y-6">
          {step === 0 && <Step0Welcome onNext={next} />}

          {step === 1 && <Step1AboutYou answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 2 && <Step2FitnessLevel answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 3 && <Step3Goals answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 4 && <Step4Equipment answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 5 && <Step5Schedule answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 6 && <Step6Preferences answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 7 && <Step7ExercisePrefs answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 8 && <Step8Experience answers={answers} update={update} onNext={next} onBack={back} />}
          {step === 9 && <Step9Review answers={answers} onBack={back} onGenerate={handleGenerate} isGenerating={isGenerating} onEditStep={goToStep} />}
        </div>
      )}
    </div>
  )
}
