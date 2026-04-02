'use client'

import React, { useState } from 'react'
import type { GeneratedPlan } from '../../lib/planGenerator'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getMuscleGroupLabel } from '../../data/exerciseUtils'
import { FiClock, FiRefreshCw, FiBook } from 'react-icons/fi'

interface PlanPreviewProps {
  plan: GeneratedPlan
  planName: string
  onPlanNameChange: (name: string) => void
  onConfirm: () => void
  onShuffle: () => void
}

export function PlanPreview({ plan, planName, onPlanNameChange, onConfirm, onShuffle }: PlanPreviewProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'guide'>('plan')
  const totalExercises = plan.days.reduce((sum, d) => sum + d.exercises.length, 0)
  const totalMinutes = plan.days.reduce((sum, d) => sum + d.estimatedMinutes, 0)
  const allMuscles = [...new Set(plan.days.flatMap(d => d.targetMuscles))]

  const tabs = [
    { id: 'plan', label: 'Plan', icon: null },
    { id: 'guide', label: 'Guide', icon: <FiBook className="w-4 h-4" /> },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Plan Name */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Name your plan</label>
        <input
          type="text"
          value={planName}
          onChange={e => onPlanNameChange(e.target.value)}
          placeholder="e.g. My Strength Program"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-display text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'plan' | 'guide')}
            className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-primary">{plan.days.length}</p>
              <p className="text-xs text-text-muted">Days / Week</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-accent">{totalExercises}</p>
              <p className="text-xs text-text-muted">Total Exercises</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-success">{totalMinutes}min</p>
              <p className="text-xs text-text-muted">Weekly Time</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-warning">{allMuscles.length}</p>
              <p className="text-xs text-text-muted">Muscle Groups</p>
            </div>
          </Card>

          {/* Weekly progression */}
          {plan.weeklyProgression && plan.weeklyProgression.length > 0 && (
            <Card>
              <h4 className="font-display font-bold text-text-primary mb-3">Training Progression</h4>
              <div className="space-y-2">
                {plan.weeklyProgression.map((w) => (
                  <div key={w.week} className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      <span className="text-sm font-semibold text-text-primary">W{w.week}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-secondary">{w.phase}</span>
                        <span className="text-xs text-text-muted">RPE {w.rpeMin}-{w.rpeMax}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            w.rpeMax <= 6 ? 'bg-success' :
                            w.rpeMax <= 7.5 ? 'bg-warning' :
                            'bg-danger'
                          }`}
                          style={{ width: `${((w.rpeMin + w.rpeMax) / 2) / 10 * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Day cards */}
          {plan.days.map((day) => (
            <Card key={day.dayName}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-text-primary">{day.dayName}</h3>
                  <p className="text-sm text-text-muted">{day.splitName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <FiClock /> ~{day.estimatedMinutes}min
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {day.targetMuscles.map(m => (
                  <Badge key={m} variant="primary" size="sm">{getMuscleGroupLabel(m)}</Badge>
                ))}
              </div>
              <div className="space-y-1.5">
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="py-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{ex.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">{ex.sets} × {ex.reps}{ex.notes?.includes('seconds') ? 's' : ''}</span>
                        {ex.restSeconds && <span className="text-[10px] text-text-muted">{ex.restSeconds}s rest</span>}
                      </div>
                    </div>
                    {ex.notes && <p className="text-xs text-text-muted mt-0.5">{ex.notes}</p>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Guide Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          {plan.description.split('\n\n').map((section, idx) => {
            const isHeading = section.startsWith('##')
            const cleanSection = section.replace(/^##\s*/, '')

            return isHeading ? (
              <div key={idx}>
                <h3 className="text-lg font-display font-bold text-primary mb-3">{cleanSection}</h3>
              </div>
            ) : (
              <Card key={idx} className="bg-white/[0.02]">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{cleanSection}</p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onShuffle} className="flex-1">
          <FiRefreshCw /> Shuffle Exercises
        </Button>
        <button
          onClick={onConfirm}
          disabled={!planName.trim()}
          className="flex-1 h-14 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create My Plan
        </button>
      </div>
    </div>
  )
}
