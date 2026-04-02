'use client'

import React, { useState } from 'react'
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
  const [dumbbellInput, setDumbbellInput] = useState(
    answers.typicalDumbbellWeight ? answers.typicalDumbbellWeight.toString() : ''
  )

  return (
    <div className="animate-fade-in space-y-4">
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

      <div className="border-t border-white/5 pt-4">
        <label className="text-sm font-medium text-text-secondary block mb-2">Comfort with free weights</label>
        <p className="text-xs text-text-muted mb-3">How confident are you with dumbbells, barbells, kettlebells?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <PillToggle label="Very comfortable" selected={answers.comfortWithFreeWeights === 'yes'} onClick={() => update({ comfortWithFreeWeights: 'yes' })} />
          <PillToggle label="Somewhat comfortable" selected={answers.comfortWithFreeWeights === 'somewhat'} onClick={() => update({ comfortWithFreeWeights: 'somewhat' })} />
          <PillToggle label="Not yet, start easy" selected={answers.comfortWithFreeWeights === 'not-yet'} onClick={() => update({ comfortWithFreeWeights: 'not-yet' })} />
        </div>

        <label className="text-sm font-medium text-text-secondary block mb-2">Typical dumbbell weight</label>
        <p className="text-xs text-text-muted mb-3">What weight do you usually pick up? (in kg)</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.5"
            value={dumbbellInput}
            onChange={e => {
              setDumbbellInput(e.target.value)
              const weight = e.target.value ? parseFloat(e.target.value) : null
              update({ typicalDumbbellWeight: weight && !isNaN(weight) ? weight : null })
            }}
            placeholder="e.g., 10, 15, 20"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
          />
          <PillToggle
            label="Don't know"
            selected={answers.typicalDumbbellWeight === null && dumbbellInput === ''}
            onClick={() => { setDumbbellInput(''); update({ typicalDumbbellWeight: null }) }}
          />
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.exerciseComplexity || !answers.comfortWithFreeWeights} />
    </div>
  )
}
