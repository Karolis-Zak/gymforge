'use client'

import React from 'react'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { NumberCard, DayToggle, PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, SPLIT_LABELS, WEEKDAYS } from './QuestionnaireShared'

interface Step5ScheduleProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step5Schedule({ answers, update, onNext, onBack }: Step5ScheduleProps) {
  return (
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
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={answers.specificDays.length !== answers.daysPerWeek} />
    </div>
  )
}
