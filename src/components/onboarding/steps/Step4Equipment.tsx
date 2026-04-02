'use client'

import React from 'react'
import { getEquipmentLabel, getAllEquipment } from '../../../data/exerciseUtils'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { PillToggle, SelectionCard } from '../SelectionCard'
import { StepHeader, NavButtons } from './QuestionnaireShared'

interface Step4EquipmentProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const LOCATION_OPTIONS = [
  { value: 'gym' as const, label: 'Full Gym', desc: 'Commercial or well-equipped gym — we include all equipment' },
  { value: 'home' as const, label: 'Home / Limited', desc: 'Home setup, hotel gym, or limited equipment access' },
]
const EQUIPMENT_OPTIONS = getAllEquipment().filter(eq => eq !== 'bodyweight' && eq !== 'none')
const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step4Equipment({ answers, update, onNext, onBack }: Step4EquipmentProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Equipment" subtitle="Where do you primarily train?" />

      {/* Location selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LOCATION_OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.desc}
            selected={answers.trainingLocation === opt.value}
            onClick={() => update({ trainingLocation: opt.value })}
          />
        ))}
      </div>

      {/* Equipment selection — conditional on location */}
      {answers.trainingLocation === 'gym' && (
        <p className="text-xs text-text-muted px-1">
          All standard gym equipment will be included in your plan — barbells, cables, machines, and more.
        </p>
      )}
      {answers.trainingLocation === 'home' && (
        <div>
          <p className="text-xs text-text-muted mb-3">Bodyweight exercises are always included. Select any equipment you can use.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map(eq => (
              <PillToggle key={eq} label={getEquipmentLabel(eq)} selected={answers.availableEquipment.includes(eq)} onClick={() => update({ availableEquipment: toggleInArray(answers.availableEquipment, eq) })} />
            ))}
          </div>
        </div>
      )}

      {/* Adjustable bench — both flows */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Do you have an adjustable bench?</label>
        <p className="text-xs text-text-muted mb-2">Some exercises need a bench that can incline/decline.</p>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Yes" selected={answers.hasAdjustableBench === true} onClick={() => update({ hasAdjustableBench: true })} />
          <PillToggle label="No" selected={answers.hasAdjustableBench === false} onClick={() => update({ hasAdjustableBench: false })} />
        </div>
      </div>

      {/* Training partner — both flows */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Do you have a training partner?</label>
        <p className="text-xs text-text-muted mb-2">Affects whether we suggest exercises that need a spotter.</p>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Yes, regularly" selected={answers.hasTrainingPartner === 'yes'} onClick={() => update({ hasTrainingPartner: 'yes' })} />
          <PillToggle label="Sometimes" selected={answers.hasTrainingPartner === 'sometimes'} onClick={() => update({ hasTrainingPartner: 'sometimes' })} />
          <PillToggle label="No, I train alone" selected={answers.hasTrainingPartner === 'no'} onClick={() => update({ hasTrainingPartner: 'no' })} />
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.trainingLocation || answers.hasAdjustableBench === null || !answers.hasTrainingPartner} />
    </div>
  )
}
