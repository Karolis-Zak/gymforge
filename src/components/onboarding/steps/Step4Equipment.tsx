'use client'

import React from 'react'
import { getEquipmentLabel, getAllEquipment } from '../../../data/exerciseUtils'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { SelectionCard, PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, LOCATIONS } from './QuestionnaireShared'

interface Step4EquipmentProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const EQUIPMENT_OPTIONS = getAllEquipment().filter(eq => eq !== 'bodyweight' && eq !== 'none')
const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step4Equipment({ answers, update, onNext, onBack }: Step4EquipmentProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Equipment & Location" subtitle="Where and with what will you train?" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LOCATIONS.map(loc => (
          <SelectionCard key={loc.id} icon={loc.icon} label={loc.label} description={loc.desc} selected={answers.trainingLocation === loc.id} onClick={() => update({ trainingLocation: loc.id })} size="lg" />
        ))}
      </div>
      {answers.trainingLocation !== 'outdoor' && (
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">What equipment do you have access to?</label>
          <p className="text-xs text-text-muted mb-3">Bodyweight exercises are always included. Select any equipment you can use.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.trainingLocation || answers.hasAdjustableBench === null || !answers.hasTrainingPartner} />
    </div>
  )
}
