'use client'

import React from 'react'
import { useRecoveryStore } from '../store/recoveryStore'
import { Card, Badge } from './ui'
import { FiAlertCircle, FiCheckCircle, FiTrendingUp } from 'react-icons/fi'

export function RecoveryInsights() {
  const { getRecentLogs, getWeeklyRecoveryScore } = useRecoveryStore()
  const weeklyLogs = getRecentLogs(7)
  const weeklyScore = getWeeklyRecoveryScore()

  if (weeklyLogs.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-display font-bold text-text-primary mb-4">Recovery Insights</h3>
        <p className="text-text-secondary text-sm">Start logging your recovery to see insights here.</p>
      </Card>
    )
  }

  // Calculate averages
  const avgSleep = (weeklyLogs.reduce((sum, l) => sum + (l.sleep || 7), 0) / weeklyLogs.length).toFixed(1)
  const avgSoreness = (weeklyLogs.reduce((sum, l) => sum + l.soreness, 0) / weeklyLogs.length).toFixed(1)
  const avgFatigue = (weeklyLogs.reduce((sum, l) => sum + l.fatigue, 0) / weeklyLogs.length).toFixed(1)

  const qualityCounts = {
    poor: weeklyLogs.filter(l => l.quality === 'poor').length,
    fair: weeklyLogs.filter(l => l.quality === 'fair').length,
    good: weeklyLogs.filter(l => l.quality === 'good').length,
    excellent: weeklyLogs.filter(l => l.quality === 'excellent').length,
  }

  const qualityLabels: Record<string, string> = {
    poor: 'Poor',
    fair: 'Fair',
    good: 'Good',
    excellent: 'Excellent',
  }

  // Generate recommendations
  const recommendations: string[] = []
  if (parseFloat(avgSleep) < 7) recommendations.push('Try to get more sleep — aim for 7-9 hours')
  if (parseFloat(avgSoreness) > 3) recommendations.push('You\'re quite sore — consider a lighter week')
  if (parseFloat(avgFatigue) > 3.5) recommendations.push('Fatigue is high — take a rest day or two')
  if (qualityCounts.poor + qualityCounts.fair > 3) recommendations.push('Recovery quality has been low — reassess your routine')
  if (recommendations.length === 0) recommendations.push('Your recovery is looking excellent! Keep it up.')

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-display font-bold text-text-primary mb-6">Recovery Insights</h3>

        {/* Weekly Score */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <div className="text-4xl font-bold text-accent">{weeklyScore}%</div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Weekly Recovery Score</p>
            <p className="text-xs text-text-secondary mt-0.5">Based on quality, sleep, soreness & fatigue</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xl font-bold text-text-primary">{avgSleep}h</p>
            <p className="text-xs text-text-muted mt-1">Avg Sleep</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xl font-bold text-text-primary">{avgSoreness}</p>
            <p className="text-xs text-text-muted mt-1">Avg Soreness</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xl font-bold text-text-primary">{avgFatigue}</p>
            <p className="text-xs text-text-muted mt-1">Avg Fatigue</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xl font-bold text-text-primary">{weeklyLogs.length}</p>
            <p className="text-xs text-text-muted mt-1">Days Logged</p>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-text-muted mb-3">Recovery Quality Distribution</p>
          <div className="flex gap-2">
            {(['excellent', 'good', 'fair', 'poor'] as const).map(q => {
              const count = qualityCounts[q]
              const total = weeklyLogs.length
              const percentage = (count / total) * 100
              const colors: Record<string, string> = {
                excellent: 'bg-accent',
                good: 'bg-success',
                fair: 'bg-warning',
                poor: 'bg-danger',
              }
              return (
                <div key={q} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-white/5 rounded-lg overflow-hidden h-6 mb-2">
                    <div
                      className={`h-full ${colors[q]} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">{qualityLabels[q]}</p>
                  <p className="text-xs font-semibold text-text-primary">{count}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {recommendations[0].includes('excellent') || recommendations[0].includes('up') ? (
                <FiCheckCircle className="text-success text-xl" />
              ) : (
                <FiAlertCircle className="text-warning text-xl" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-2">Recommendation</h4>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-text-secondary">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
