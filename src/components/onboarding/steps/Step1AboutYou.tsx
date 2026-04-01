'use client'

import React from 'react'
import { useUserStore } from '../../../store/userStore'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { Input } from '../../ui/Input'
import { PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, toValidBodyType } from './QuestionnaireShared'
import { FiArrowRight } from 'react-icons/fi'
import { Button } from '../../ui/Button'

interface Step1AboutYouProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

export function Step1AboutYou({ answers, update, onNext, onBack }: Step1AboutYouProps) {
  const { profile, updateProfile } = useUserStore()

  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="About You" subtitle="Basic info to personalise your plan." />
      <Input label="What should we call you?" value={answers.name} onChange={e => update({ name: e.target.value })} placeholder="Your name" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Age" type="number" value={answers.age || ''} onChange={e => update({ age: Number(e.target.value) })} placeholder="25" min={13} max={99} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Gender</label>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as const).map(g => (
              <PillToggle key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={answers.gender === g} onClick={() => update({ gender: g })} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Height (cm)" type="number" value={answers.height || ''} onChange={e => update({ height: Number(e.target.value) })} placeholder="175" min={100} max={250} />
        <Input label="Weight (kg)" type="number" value={answers.weight || ''} onChange={e => update({ weight: Number(e.target.value) })} placeholder="75" min={30} max={300} />
      </div>
      <div className="flex flex-col gap-1.5">
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1">How would you describe your build?</label>
          <p className="text-xs text-text-muted mb-2">This helps us customize exercises based on your body type, not just weight.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            { id: 'lean', label: 'Lean', desc: 'Low body fat, athletic build — can handle high-impact exercises' },
            { id: 'athletic', label: 'Athletic', desc: 'Fit and toned — optimized for full range of movements' },
            { id: 'stocky', label: 'Stocky', desc: 'Naturally strong, solid frame — moderate-impact focus' },
            { id: 'overweight', label: 'Overweight', desc: 'Building strength from here — joint-friendly programming' },
            { id: 'obese', label: 'Obese', desc: 'Maximum joint care — low-impact, beginner-friendly' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => update({ bodyType: t.id })} className={`p-3 rounded-xl border transition-all text-left ${answers.bodyType === t.id ? 'bg-primary/10 border-primary/50' : 'border-white/10 hover:border-white/20'}`}>
              <div className="font-medium text-sm text-text-primary">{t.label}</div>
              <div className="text-xs text-text-muted">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={() => {
          updateProfile({
            name: answers.name,
            age: answers.age,
            gender: answers.gender || undefined,
            height: answers.height || undefined,
            weight: answers.weight || undefined,
            bodyType: toValidBodyType(answers.bodyType),
          })
          onNext()
        }} disabled={!answers.name?.trim() || !answers.bodyType}><FiArrowRight /> Next</Button>
      </div>
    </div>
  )
}
