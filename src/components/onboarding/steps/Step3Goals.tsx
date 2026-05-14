'use client'

import React from 'react'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { SelectionCard, PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, GOALS, SECONDARY_GOALS, CARDIO_OPTIONS } from './QuestionnaireShared'

interface Step3GoalsProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3Goals({ answers, update, onNext, onBack }: Step3GoalsProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Your Goals" subtitle="What are you training for?" />
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Primary goal</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOALS.map(g => (
            <SelectionCard key={g.id} icon={g.icon} label={g.label} description={g.desc} selected={answers.primaryGoal === g.id} onClick={() => update({ primaryGoal: g.id })} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Secondary goal (optional)</label>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="None" selected={!answers.secondaryGoal} onClick={() => update({ secondaryGoal: '' })} />
          {SECONDARY_GOALS.filter(g => g.id !== answers.primaryGoal).map(g => (
            <PillToggle key={g.id} label={g.label} selected={answers.secondaryGoal === g.id} onClick={() => update({ secondaryGoal: g.id })} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Include cardio in your plan?</label>
        <div className="flex flex-wrap gap-2">
          {CARDIO_OPTIONS.map(c => (
            <PillToggle key={c.v} label={c.l} selected={answers.cardioPreference === c.v} onClick={() => update({ cardioPreference: c.v })} />
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
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.primaryGoal || !answers.timelineWeeks} />
    </div>
  )
}
