'use client'

import React from 'react'
import { getAllMuscleGroups, getMuscleGroupLabel } from '../../../data/exerciseUtils'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import type { MuscleGroup } from '../../../data/exercises'
import { Button } from '../../ui/Button'
import { StepHeader, SummaryRow, capitalize, GOALS, CARDIO_OPTIONS, SPLIT_LABELS, WEEKDAYS, INJURY_AREAS } from './QuestionnaireShared'
import { FiArrowLeft, FiZap } from 'react-icons/fi'

interface Step9ReviewProps {
  answers: OnboardingAnswers
  onBack: () => void
  onGenerate: () => void
  isGenerating: boolean
  onEditStep: (step: number) => void
}

export function Step9Review({ answers, onBack, onGenerate, isGenerating, onEditStep }: Step9ReviewProps) {
  const getGoalLabel = (id: string) => GOALS.find(g => g.id === id)?.label || id
  const getCardioLabel = (id: string) => CARDIO_OPTIONS.find(c => c.v === id)?.l || id
  const getInjuryLabel = (id: string) => INJURY_AREAS.find(a => a.id === id)?.label || id
  const muscleGroupLabels = (groups: MuscleGroup[]) => groups.length > 0 ? groups.map(mg => getMuscleGroupLabel(mg)).join(', ') : 'None (balanced)'
  const daysLabel = answers.specificDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).filter(Boolean).join(', ')

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      <StepHeader title="Review Your Answers" subtitle="Make sure everything looks right before we create your plan." />

      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">About You</h3>
          <div className="space-y-1">
            <SummaryRow label="Name" value={answers.name || '—'} onEdit={() => onEditStep(1)} />
            <SummaryRow label="Age" value={answers.age ? `${answers.age}` : '—'} onEdit={() => onEditStep(1)} />
            <SummaryRow label="Gender" value={answers.gender ? capitalize(answers.gender) : '—'} onEdit={() => onEditStep(1)} />
            <SummaryRow label="Height" value={answers.height ? `${answers.height} cm` : '—'} onEdit={() => onEditStep(1)} />
            <SummaryRow label="Weight" value={answers.weight ? `${answers.weight} kg` : '—'} onEdit={() => onEditStep(1)} />
            <SummaryRow label="Build" value={capitalize(answers.bodyType) || '—'} onEdit={() => onEditStep(1)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Fitness & Health</h3>
          <div className="space-y-1">
            <SummaryRow label="Fitness Level" value={capitalize(answers.fitnessLevel)} onEdit={() => onEditStep(2)} />
            <SummaryRow label="Injuries" value={answers.injuries.length > 0 ? answers.injuries.map(getInjuryLabel).join(', ') : 'None'} onEdit={() => onEditStep(2)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Goals</h3>
          <div className="space-y-1">
            <SummaryRow label="Primary Goal" value={getGoalLabel(answers.primaryGoal)} onEdit={() => onEditStep(3)} />
            <SummaryRow label="Secondary Goal" value={answers.secondaryGoal ? getGoalLabel(answers.secondaryGoal) : 'None'} onEdit={() => onEditStep(3)} />
            <SummaryRow label="Timeline" value={`${answers.timelineWeeks} weeks`} onEdit={() => onEditStep(3)} />
            <SummaryRow label="Cardio" value={getCardioLabel(answers.cardioPreference)} onEdit={() => onEditStep(3)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Equipment</h3>
          <div className="space-y-1">
            <SummaryRow label="Training Location" value={answers.trainingLocation === 'gym' ? 'Full Gym' : answers.trainingLocation === 'home' ? 'Home / Limited' : '—'} onEdit={() => onEditStep(4)} />
            <SummaryRow label="Equipment" value={answers.trainingLocation === 'gym' ? 'All available' : answers.availableEquipment.length > 0 ? answers.availableEquipment.join(', ') : 'Bodyweight only'} onEdit={() => onEditStep(4)} />
            <SummaryRow label="Adjustable Bench" value={answers.hasAdjustableBench ? 'Yes' : 'No'} onEdit={() => onEditStep(4)} />
            <SummaryRow label="Training Partner" value={capitalize(answers.hasTrainingPartner)} onEdit={() => onEditStep(4)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Schedule</h3>
          <div className="space-y-1">
            <SummaryRow label="Days per Week" value={`${answers.daysPerWeek} days ${SPLIT_LABELS[answers.daysPerWeek] ? `(${SPLIT_LABELS[answers.daysPerWeek]})` : ''}`} onEdit={() => onEditStep(5)} />
            <SummaryRow label="Which Days" value={daysLabel} onEdit={() => onEditStep(5)} />
            <SummaryRow label="Session Duration" value={`${answers.sessionDuration} min`} onEdit={() => onEditStep(5)} />
            <SummaryRow label="Warm-up" value={answers.warmupPreference === 'quick' ? '5 min' : answers.warmupPreference === 'full' ? '10 min' : 'Skip'} onEdit={() => onEditStep(5)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Preferences</h3>
          <div className="space-y-1">
            <SummaryRow label="Training Style" value={capitalize(answers.varietyPreference)} onEdit={() => onEditStep(6)} />
            <SummaryRow label="Focus Areas" value={muscleGroupLabels(answers.focusAreas)} onEdit={() => onEditStep(6)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Exercise Preferences</h3>
          <div className="space-y-1">
            <SummaryRow label="Complexity" value={capitalize(answers.exerciseComplexity)} onEdit={() => onEditStep(7)} />
            <SummaryRow label="Free Weights" value={capitalize(answers.comfortWithFreeWeights)} onEdit={() => onEditStep(7)} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Experience</h3>
          <div className="space-y-1">
            <SummaryRow label="Familiar Exercises" value={answers.familiarExercises.length > 0 ? answers.familiarExercises.join(', ') : 'None yet'} onEdit={() => onEditStep(8)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onBack}><FiArrowLeft /> Back</Button>
        <Button onClick={onGenerate} disabled={isGenerating} className="flex-1"><FiZap /> {isGenerating ? 'Creating plan...' : 'Create My Plan'}</Button>
      </div>
    </div>
  )
}
