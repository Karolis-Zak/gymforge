'use client'

import React, { useState } from 'react'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import { calculateVolume } from '../lib/exerciseUtils'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { FiClock, FiAward, FiChevronDown, FiChevronUp, FiCalendar, FiBook } from 'react-icons/fi'

function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function WorkoutHistory() {
  const { logs } = useWorkoutLogStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const completedLogs = logs
    .filter(l => l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-display font-bold text-text-primary">Workout History</h1>

      {completedLogs.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FiBook className="text-primary text-2xl" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary mb-2">No workouts yet</h2>
          <p className="text-text-secondary">Complete a workout to see it here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedLogs.map(log => {
            const isExpanded = expandedId === log.id
            const totalSets = log.exercises.reduce((s, ex) => s + ex.sets.length, 0)
            const completedSets = log.exercises.reduce((s, ex) => s + ex.sets.filter(set => set.completed).length, 0)
            const totalVolume = calculateVolume(log.exercises)

            return (
              <Card key={log.id} padding="none" className="overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <FiAward className="text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">{log.planName}</h3>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={11} />
                          {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span>{log.exercises.length} exercises</span>
                        <span>{completedSets}/{totalSets} sets</span>
                        {log.durationSeconds && (
                          <span className="flex items-center gap-1"><FiClock size={11} /> {formatDuration(log.durationSeconds)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary">
                      {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
                    </span>
                    {isExpanded ? <FiChevronUp className="text-text-muted" /> : <FiChevronDown className="text-text-muted" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 animate-fade-in space-y-4">
                    {log.sessionNotes && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                        <p className="text-xs text-text-muted mb-1">Notes</p>
                        <p className="text-sm text-text-secondary">{log.sessionNotes}</p>
                      </div>
                    )}

                    {log.exercises.map(ex => {
                      const exVolume = ex.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0)
                      const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0))

                      return (
                        <div key={ex.id}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-text-primary text-sm">{ex.exerciseName}</h4>
                            <div className="flex items-center gap-2">
                              {maxWeight > 0 && <Badge variant="primary" size="sm">Max: {maxWeight}kg</Badge>}
                              {exVolume > 0 && <span className="text-xs text-text-muted">{exVolume}kg vol</span>}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-text-muted">
                                  <th className="text-left py-1 px-2 w-12">Set</th>
                                  <th className="text-left py-1 px-2">Weight</th>
                                  <th className="text-left py-1 px-2">Reps</th>
                                  <th className="text-right py-1 px-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ex.sets.map((set, idx) => (
                                  <tr key={idx} className="border-t border-white/5">
                                    <td className="py-1.5 px-2 text-text-muted">{idx + 1}</td>
                                    <td className="py-1.5 px-2 text-text-primary">{set.weight ? `${set.weight}kg` : '—'}</td>
                                    <td className="py-1.5 px-2 text-text-primary">{set.reps || '—'}</td>
                                    <td className="py-1.5 px-2 text-right">
                                      {set.completed
                                        ? <Badge variant="success" size="sm">Done</Badge>
                                        : <Badge variant="neutral" size="sm">Skipped</Badge>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {ex.rpe && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-text-muted">RPE:</span>
                              <Badge variant="primary" size="sm">{ex.rpe}/10</Badge>
                              {ex.rpe <= 5 && <span className="text-text-muted">⬅️ Easy</span>}
                              {ex.rpe > 5 && ex.rpe <= 7 && <span className="text-text-muted">✓ Good</span>}
                              {ex.rpe > 7 && <span className="text-text-muted">➡️ Hard</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
