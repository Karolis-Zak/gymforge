'use client'

import React, { useState } from 'react'
import { useRecoveryStore } from '../store/recoveryStore'
import { Card, Badge, Button } from './ui'
import { FiMinus, FiPlus, FiCheckCircle } from 'react-icons/fi'

const sorenessLabels = ['Really Good', 'Good', 'Medium', 'Poor', 'Really Poor']
const fatigueLabels = ['Really Fresh', 'Fresh', 'Medium', 'Tired', 'Exhausted']

export function RecoveryTracker() {
  const { logRecovery, getRecoveryLog, updateRecoveryLog, getWeeklyRecoveryScore } = useRecoveryStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLog = getRecoveryLog(today)

  const [quality, setQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>(todayLog?.quality || 'good')
  const [sleep, setSleep] = useState(todayLog?.sleep?.toString() || '7')
  const [soreness, setSoreness] = useState(todayLog?.soreness || 2)
  const [fatigue, setFatigue] = useState(todayLog?.fatigue || 2)
  const [notes, setNotes] = useState(todayLog?.notes || '')

  const weeklyScore = getWeeklyRecoveryScore()

  const handleSave = () => {
    const logData = {
      quality,
      sleep: parseFloat(sleep) || 7,
      soreness,
      fatigue,
      notes: notes.trim() || undefined,
    }

    if (todayLog) {
      updateRecoveryLog(today, logData)
    } else {
      logRecovery(logData)
    }
  }

  const qualityColors: Record<string, string> = {
    poor: 'bg-danger/10 text-danger border-danger/30',
    fair: 'bg-warning/10 text-warning border-warning/30',
    good: 'bg-success/10 text-success border-success/30',
    excellent: 'bg-accent/10 text-accent border-accent/30',
  }

  // If already logged today, show minimal version
  if (todayLog) {
    return (
      <Card className="bg-success/5 border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-success" size={20} />
            <div>
              <p className="text-sm font-semibold text-text-primary">Recovery logged today</p>
              <p className="text-xs text-text-muted mt-0.5">
                {todayLog.quality.charAt(0).toUpperCase() + todayLog.quality.slice(1)} • {todayLog.sleep}h sleep • Soreness {todayLog.soreness}/5
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-accent">{weeklyScore}%</div>
            <p className="text-xs text-text-muted">Weekly</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-text-primary">Recovery Log</h3>
          <p className="text-xs text-text-muted mt-0.5">Today's check-in</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{weeklyScore}%</div>
          <p className="text-xs text-text-muted">Weekly</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Recovery Quality */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">How recovered?</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['poor', 'fair', 'good', 'excellent'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`py-1.5 px-2 rounded border transition-all text-xs font-medium ${
                  quality === q
                    ? qualityColors[q]
                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                }`}
              >
                {q === 'excellent' ? '✓' : q.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Sleep hours</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const val = parseFloat(sleep)
                setSleep(!isNaN(val) ? Math.max(0, val - 0.5).toFixed(1) : '6.5')
              }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-sm transition-all"
              aria-label="Decrease sleep"
            >
              <FiMinus size={14} />
            </button>
            <input
              type="number"
              min="0"
              max="16"
              step="0.5"
              value={sleep}
              onChange={e => setSleep(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-center text-sm text-text-primary focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={() => {
                const val = parseFloat(sleep)
                setSleep(!isNaN(val) ? Math.min(16, val + 0.5).toFixed(1) : '7.5')
              }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-sm transition-all"
              aria-label="Increase sleep"
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>

        {/* Soreness */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Muscle soreness</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => setSoreness(val)}
                className={`py-1.5 px-2 rounded border transition-all text-xs font-medium text-center ${
                  soreness === val
                    ? 'bg-success/20 text-success border-success/50'
                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                }`}
                title={sorenessLabels[val - 1]}
              >
                {['😊', '🙂', '😐', '😕', '😣'][val - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Fatigue */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Fatigue level</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => setFatigue(val)}
                className={`py-1.5 px-2 rounded border transition-all text-xs font-medium text-center ${
                  fatigue === val
                    ? 'bg-warning/20 text-warning border-warning/50'
                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                }`}
                title={fatigueLabels[val - 1]}
              >
                {['⚡', '😀', '🙂', '😔', '😫'][val - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes - Optional, hidden by default */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-text-muted hover:text-text-primary transition-colors">
            + Add notes (optional)
          </summary>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any observations..."
            className="mt-2 w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none h-16"
          />
        </details>

        {/* Save Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 text-sm"
        >
          <FiCheckCircle size={16} /> Log Recovery
        </Button>
      </div>
    </Card>
  )
}
