'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutStore } from '../../store/workoutStore'
import type { Exercise } from '../../store/workoutStore'
import { ExercisePicker } from './ExercisePicker'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { FiArrowLeft, FiArrowRight, FiCheck, FiTrash2, FiPlus } from 'react-icons/fi'

const GOAL_TAGS = ['Strength', 'Hypertrophy', 'Fat Loss', 'Endurance', 'Mobility', 'General Fitness']

const TEMPLATES = [
  {
    name: 'Full Body Strength',
    description: 'Hit every muscle group in one session',
    exercises: [
      { name: 'Squat', sets: 4, reps: 6 },
      { name: 'Bench Press', sets: 4, reps: 8 },
      { name: 'Deadlift', sets: 3, reps: 5 },
      { name: 'Overhead Press', sets: 3, reps: 8 },
      { name: 'Barbell Row', sets: 3, reps: 10 },
      { name: 'Plank', sets: 3, reps: 1 },
    ],
  },
  {
    name: 'Upper Body Push',
    description: 'Chest, shoulders, and triceps focused',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
      { name: 'Overhead Press', sets: 3, reps: 8 },
      { name: 'Lateral Raise', sets: 3, reps: 15 },
      { name: 'Tricep Pushdown', sets: 3, reps: 12 },
      { name: 'Dips', sets: 3, reps: 10 },
    ],
  },
  {
    name: 'Lower Body Power',
    description: 'Quads, hamstrings, and glutes',
    exercises: [
      { name: 'Squat', sets: 5, reps: 5 },
      { name: 'Romanian Deadlift', sets: 4, reps: 8 },
      { name: 'Leg Press', sets: 3, reps: 12 },
      { name: 'Walking Lunge', sets: 3, reps: 10 },
      { name: 'Leg Curl', sets: 3, reps: 12 },
      { name: 'Calf Raise', sets: 4, reps: 15 },
    ],
  },
]

export function PlanBuilder() {
  const router = useRouter()
  const { addPlan } = useWorkoutStore()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])

  const handleAddExercise = (ex: { id: string; name: string; sets: number; reps: number; notes: string }) => {
    if (exercises.some(e => e.name === ex.name)) return
    setExercises(prev => [...prev, { ...ex, id: ex.id || Math.random().toString(36).substring(2) }])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index))
  }

  const handleTemplate = (template: typeof TEMPLATES[0]) => {
    setName(template.name)
    setDescription(template.description)
    setExercises(template.exercises.map(ex => ({
      id: Math.random().toString(36).substring(2),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      notes: '',
    })))
    setStep(3) // Skip to review
  }

  const [creating, setCreating] = useState(false)

  const handleCreate = () => {
    if (!name || exercises.length === 0 || creating) return
    setCreating(true)
    addPlan({
      name,
      description: `${description}${goal ? ` | Goal: ${goal}` : ''}`,
      exercises,
      isPreMade: false,
    })
    router.push('/plans')
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'
            }`}>
              {step > s ? <FiCheck /> : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-primary' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Name & Goal */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Create Your Plan</h2>
            <p className="text-text-secondary">Give your workout plan a name and set your goal.</p>
          </div>

          <Card>
            <div className="space-y-4">
              <Input
                label="Plan Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Upper Body Blast"
              />
              <Input
                label="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's this plan about?"
              />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Goal</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setGoal(goal === tag ? '' : tag)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        goal === tag
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Templates */}
          <div>
            <h3 className="text-lg font-display font-bold text-text-primary mb-3">Or start from a template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map(tpl => (
                <Card key={tpl.name} variant="interactive" padding="sm" className="p-4">
                  <button onClick={() => handleTemplate(tpl)} className="w-full text-left">
                    <h4 className="font-bold text-text-primary text-sm">{tpl.name}</h4>
                    <p className="text-xs text-text-muted mt-1">{tpl.description}</p>
                    <p className="text-xs text-primary mt-2">{tpl.exercises.length} exercises</p>
                  </button>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name}>
              Next <FiArrowRight />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Exercises */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Add Exercises</h2>
            <p className="text-text-secondary">Search and add exercises to your plan.</p>
          </div>

          <ExercisePicker onAdd={handleAddExercise} addedExerciseIds={exercises.map(e => e.id)} />

          {/* Exercise list */}
          {exercises.length > 0 && (
            <Card>
              <h3 className="font-display font-bold text-text-primary mb-4">
                Your Exercises ({exercises.length})
              </h3>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-text-primary text-sm font-medium">{ex.name}</span>
                        <span className="text-text-muted text-xs ml-2">{ex.sets} x {ex.reps}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(i)}
                      className="text-text-muted hover:text-danger transition-colors p-1"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <FiArrowLeft /> Back
            </Button>
            <div className="flex items-center gap-3">
              {exercises.length === 0 && <span className="text-xs text-text-muted">Add at least 1 exercise</span>}
              <Button onClick={() => setStep(3)} disabled={exercises.length === 0}>
                Review <FiArrowRight />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Review & Create</h2>
            <p className="text-text-secondary">Check everything looks good.</p>
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-display font-bold text-text-primary">{name}</h3>
                {description && <p className="text-text-secondary text-sm mt-1">{description}</p>}
                {goal && <Badge variant="primary" className="mt-2">{goal}</Badge>}
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
                  Exercises ({exercises.length})
                </h4>
                <div className="space-y-2">
                  {exercises.map((ex, i) => (
                    <div key={ex.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted text-sm">{i + 1}.</span>
                        <span className="text-text-primary text-sm">{ex.name}</span>
                      </div>
                      <span className="text-text-muted text-sm">{ex.sets} x {ex.reps}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex items-center gap-4 text-sm text-text-muted">
                <span>Total sets: {exercises.reduce((sum, ex) => sum + (typeof ex.sets === 'number' ? ex.sets : 0), 0)}</span>
                <span>Est. duration: ~{Math.round(exercises.reduce((sum, ex) => sum + (typeof ex.sets === 'number' ? ex.sets : 0), 0) * 2.5)} min</span>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <FiArrowLeft /> Back
            </Button>
            <Button variant="success" onClick={handleCreate} loading={creating} disabled={creating}>
              <FiCheck /> Create Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
