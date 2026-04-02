'use client'

import React, { useState } from 'react'
import { useRecoveryStore } from '../store/recoveryStore'
import { Card, Badge, Button } from './ui'
import { FiMinus, FiPlus, FiCheckCircle } from 'react-icons/fi'

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

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-bold text-text-primary">Recovery Log</h3>
          <p className="text-xs text-text-muted mt-1">Track your recovery today</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{weeklyScore}%</div>
          <p className="text-xs text-text-muted">Weekly score</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Recovery Quality */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">How recovered are you?</label>
          <div className="grid grid-cols-4 gap-2">
            {(['poor', 'fair', 'good', 'excellent'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`py-2 px-3 rounded-lg border transition-all capitalize text-sm font-medium ${
                  quality === q
                    ? qualityColors[q]
                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Sleep hours</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSleep(Math.max(0, parseFloat(sleep) - 0.5).toFixed(1))}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              aria-label="Decrease sleep"
            >
              <FiMinus size={16} />
            </button>
            <input
              type="number"
              min="0"
              max="16"
              step="0.5"
              value={sleep}
              onChange={e => setSleep(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-text-primary focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={() => setSleep(Math.min(16, parseFloat(sleep) + 0.5).toFixed(1))}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              aria-label="Increase sleep"
            >
              <FiPlus size={16} />
            </button>
          </div>
        </div>

        {/* Soreness */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Muscle soreness</label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-12">None</span>
            <input
              type="range"
              min="1"
              max="5"
              value={soreness}
              onChange={e => setSoreness(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-text-muted w-12 text-right">Extreme</span>
          </div>
          <div className="mt-1 text-center text-sm font-semibold text-text-primary">{soreness}/5</div>
        </div>

        {/* Fatigue */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Fatigue level</label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-12">Fresh</span>
            <input
              type="range"
              min="1"
              max="5"
              value={fatigue}
              onChange={e => setFatigue(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-text-muted w-12 text-right">Exhausted</span>
          </div>
          <div className="mt-1 text-center text-sm font-semibold text-text-primary">{fatigue}/5</div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any observations about your recovery..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none h-20"
          />
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2"
        >
          <FiCheckCircle /> {todayLog ? 'Update' : 'Log'} Recovery
        </Button>

        {/* Last logged message */}
        {todayLog && (
          <p className="text-xs text-success text-center">✓ Logged for today</p>
        )}
      </div>
    </Card>
  )
}
