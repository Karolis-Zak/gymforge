'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../../store/userStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { useOnboardingStore, DEFAULT_ANSWERS, type OnboardingAnswers } from '../../store/onboardingStore'
import { generatePlan, type GeneratedPlan } from '../../lib/planGenerator'
import { getMuscleGroupLabel, getEquipmentLabel } from '../../data/exerciseUtils'
import { Button } from '../ui/Button'
import { PlanPreview } from './PlanPreview'
import { FiArrowLeft, FiArrowRight, FiZap } from 'react-icons/fi'
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
    onboardingStore.setAnswers(answers)
    updateProfile({
      name: profile?.name || answers.name,
      age: profile?.age || answers.age,
      gender: profile?.gender || answers.gender || undefined,
      height: profile?.height || answers.height,
      weight: profile?.weight || answers.weight,
      bodyType: profile?.bodyType || toValidBodyType(answers.bodyType),
    })

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
          {/* Step 0: Welcome */}
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

          {/* Step 1: About You */}
          {step === 1 && <Step1AboutYou answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 2: Fitness Level */}
          {step === 2 && <Step2FitnessLevel answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 3: Goals */}
          {step === 3 && <Step3Goals answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 4: Equipment & Location */}
          {step === 4 && <Step4Equipment answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 5: Schedule */}
          {step === 5 && <Step5Schedule answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 6: Preferences */}
          {step === 6 && <Step6Preferences answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 7: Exercise Preferences */}
          {step === 7 && <Step7ExercisePrefs answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 8: Experience */}
          {step === 8 && <Step8Experience answers={answers} update={update} onNext={next} onBack={back} />}

          {/* Step 9: Review */}
          {step === 9 && <Step9Review answers={answers} onBack={back} onGenerate={handleGenerate} isGenerating={isGenerating} onEditStep={goToStep} />}
        </div>
      )}
    </div>
  )
}
