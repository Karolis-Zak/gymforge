'use client'

import React from 'react'
import { FiStar, FiTrendingUp, FiZap } from 'react-icons/fi'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { SelectionCard, PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, INJURY_AREAS } from './QuestionnaireShared'

interface Step2FitnessLevelProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step2FitnessLevel({ answers, update, onNext, onBack }: Step2FitnessLevelProps) {
  return (
    <div className="animate-fade-in space-y-4">
      <StepHeader title="Fitness Level" subtitle="Be honest — there's no wrong answer." />
      <div className="space-y-2">
        <SelectionCard icon={<FiStar />} label="Complete Beginner" description="Never followed a workout program" selected={answers.fitnessLevel === 'complete-beginner'} onClick={() => update({ fitnessLevel: 'complete-beginner' })} size="lg" />
        <SelectionCard icon={<FiTrendingUp />} label="Some Experience" description="Done some workouts, not consistently" selected={answers.fitnessLevel === 'some-experience'} onClick={() => update({ fitnessLevel: 'some-experience' })} size="lg" />
        <SelectionCard icon={<FiZap />} label="Regular Exerciser" description="Work out regularly, want a better plan" selected={answers.fitnessLevel === 'regular-exerciser'} onClick={() => update({ fitnessLevel: 'regular-exerciser' })} size="lg" />
      </div>

      {/* Injuries section with better visual hierarchy */}
      <div className="border-t border-white/5 pt-4">
        <label className="text-sm font-medium text-text-secondary block mb-3">Any injuries or limitations?</label>
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

      {/* Injury status details - cleaner inline layout */}
      {answers.injuries.length > 0 && (
        <div className="space-y-2 bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">Injury Status</h4>
          {answers.injuries.map(id => {
            const area = INJURY_AREAS.find(a => a.id === id)
            return (
              <div key={id} className="flex items-center justify-between py-1">
                <span className="text-sm text-text-primary">{area?.label}</span>
                <div className="flex gap-2">
                  <PillToggle label="Recovering" selected={answers.injurySeverity[id] === 'acute'} onClick={() => update({ injurySeverity: { ...answers.injurySeverity, [id]: 'acute' } })} />
                  <PillToggle label="Ongoing" selected={answers.injurySeverity[id] === 'chronic' || !answers.injurySeverity[id]} onClick={() => update({ injurySeverity: { ...answers.injurySeverity, [id]: 'chronic' } })} />
                </div>
              </div>
            )
          })}
          <p className="text-xs text-text-muted mt-2">Recovering = we'll avoid those areas. Ongoing = we'll include lighter exercises.</p>
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.fitnessLevel} />
    </div>
  )
}
