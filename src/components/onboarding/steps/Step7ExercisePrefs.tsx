'use client'

import React from 'react'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons } from './QuestionnaireShared'

interface Step7ExercisePrefsProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

export function Step7ExercisePrefs({ answers, update, onNext, onBack }: Step7ExercisePrefsProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Exercise Style" subtitle="What type of exercises do you prefer?" />
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Exercise complexity</label>
        <p className="text-xs text-text-muted mb-3">How advanced should exercises be?</p>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Keep it simple" selected={answers.exerciseComplexity === 'simple'} onClick={() => update({ exerciseComplexity: 'simple' })} />
          <PillToggle label="Moderate challenge" selected={answers.exerciseComplexity === 'moderate'} onClick={() => update({ exerciseComplexity: 'moderate' })} />
          <PillToggle label="Any level" selected={answers.exerciseComplexity === 'any'} onClick={() => update({ exerciseComplexity: 'any' })} />
        </div>
        {answers.fitnessLevel === 'complete-beginner' && (
          <p className="text-xs text-warning mt-2">Beginners work best with simple exercises to master form first.</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Comfort with free weights</label>
        <p className="text-xs text-text-muted mb-3">How confident are you with dumbbells, barbells, kettlebells?</p>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Very comfortable" selected={answers.comfortWithFreeWeights === 'yes'} onClick={() => update({ comfortWithFreeWeights: 'yes' })} />
          <PillToggle label="Somewhat comfortable" selected={answers.comfortWithFreeWeights === 'somewhat'} onClick={() => update({ comfortWithFreeWeights: 'somewhat' })} />
          <PillToggle label="Not yet, start easy" selected={answers.comfortWithFreeWeights === 'not-yet'} onClick={() => update({ comfortWithFreeWeights: 'not-yet' })} />
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.exerciseComplexity || !answers.comfortWithFreeWeights} />
    </div>
  )
}
