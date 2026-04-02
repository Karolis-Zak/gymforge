'use client'

import React, { useState } from 'react'
import { useAchievementStore } from '../store/achievementStore'
import { Card, Badge } from './ui'
import { FiZap, FiLock, FiCheck } from 'react-icons/fi'

export function AchievementShowcase() {
  const { getUnlocked, getLocked } = useAchievementStore()
  const [showLocked, setShowLocked] = useState(false)

  const unlocked = getUnlocked()
  const locked = getLocked()

  const categoryLabels: Record<string, string> = {
    consistency: 'Consistency',
    performance: 'Performance',
    skill: 'Skill',
    milestone: 'Milestone',
  }

  const categories = ['milestone', 'consistency', 'performance', 'skill'] as const

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center py-6">
          <div className="text-3xl font-bold text-primary mb-2">{unlocked.length}</div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Achievements</p>
        </Card>
        <Card className="text-center py-6">
          <div className="text-3xl font-bold text-success mb-2">{unlocked.length + locked.length > 0 ? Math.round((unlocked.length / (unlocked.length + locked.length)) * 100) : 0}%</div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Complete</p>
        </Card>
        <Card className="text-center py-6">
          <div className="text-3xl font-bold text-warning mb-2">{locked.length}</div>
          <p className="text-xs text-text-muted uppercase tracking-wider">To Unlock</p>
        </Card>
        <Card className="text-center py-6">
          <div className="text-3xl font-bold text-accent mb-2">
            {unlocked.length > 0 ? new Date(unlocked[0].unlockedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
          </div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Latest</p>
        </Card>
      </div>

      {/* Unlocked achievements by category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryAchievements = unlocked.filter(a => a.category === category)
          if (categoryAchievements.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                {categoryLabels[category]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryAchievements.map(achievement => (
                  <Card key={achievement.id} className="p-4 bg-success/5 border-success/20">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary text-sm">{achievement.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{achievement.description}</p>
                        {achievement.unlockedAt && (
                          <div className="flex items-center gap-2 mt-2">
                            <FiCheck className="text-success text-xs" />
                            <span className="text-xs text-text-muted">
                              {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Locked achievements */}
      {locked.length > 0 && (
        <div>
          <button
            onClick={() => setShowLocked(!showLocked)}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            {showLocked ? '↓' : '→'} {locked.length} locked achievements
          </button>

          {showLocked && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {locked.map(achievement => (
                <Card key={achievement.id} className="p-4 opacity-50">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl opacity-30">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-primary text-sm opacity-70">{achievement.title}</h4>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{achievement.description}</p>
                    </div>
                    <FiLock className="text-text-muted opacity-40 flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {unlocked.length === 0 && (
        <Card className="text-center py-12">
          <FiZap className="text-primary text-4xl mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No achievements yet</h3>
          <p className="text-text-secondary text-sm">Complete workouts to unlock achievements!</p>
        </Card>
      )}
    </div>
  )
}
