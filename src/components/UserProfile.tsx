'use client'

import React, { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { useToast } from '../store/toastStore'
import { Card, Button, Input, ProgressRing, StatCard } from './ui'
import { FiEdit2, FiCheck, FiUser, FiTarget, FiClock } from 'react-icons/fi'

export const UserProfileForm: React.FC = () => {
  const { profile, updateProfile, calculateBMI, getIdealWeight, defaultRestSeconds, setDefaultRestSeconds } = useUserStore()
  const toast = useToast()
  const [editing, setEditing] = useState(!profile?.name)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: string | number = e.target.value
    if (e.target.type === 'number') {
      const num = Number(e.target.value)
      if (isNaN(num) || num < 0) return
      // Enforce realistic maximums
      const name = e.target.name
      if (name === 'weight' && num > 300) return
      if (name === 'height' && num > 250) return
      if (name === 'age' && num > 120) return
      value = num
    }
    updateProfile({ [e.target.name]: value })
  }

  const handleSave = () => {
    setEditing(false)
    toast.success('Profile updated successfully!')
  }

  const bmi = calculateBMI()
  const idealWeight = getIdealWeight()
  const name = profile?.name || 'Athlete'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // BMI color
  const getBmiColor = (bmi: number | null) => {
    if (!bmi) return '#64748b'
    if (bmi < 18.5) return '#f59e0b'
    if (bmi < 25) return '#22c55e'
    if (bmi < 30) return '#f59e0b'
    return '#ef4444'
  }

  const getBmiLabel = (bmi: number | null) => {
    if (!bmi) return 'N/A'
    if (bmi < 18.5) return 'Below average'
    if (bmi < 25) return 'Healthy range'
    if (bmi < 30) return 'Above average'
    return 'High'
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">Profile</h1>
        <Button
          variant={editing ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => editing ? handleSave() : setEditing(true)}
        >
          {editing ? <><FiCheck /> Save</> : <><FiEdit2 /> Edit</>}
        </Button>
      </div>

      {/* Avatar & Name */}
      <Card className="flex items-center gap-4 sm:gap-6 overflow-hidden">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-mixed flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg sm:text-2xl">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              name="name"
              value={profile?.name || ''}
              onChange={handleChange}
              placeholder="Your name"
              className="text-lg font-bold"
            />
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary truncate">{name}</h2>
              <p className="text-text-secondary text-sm mt-1">
                {profile?.age ? `${profile.age} years old` : 'Set up your profile'}
                {profile?.gender ? ` \u00b7 ${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}` : ''}
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Body Metrics */}
      {editing ? (
        <Card>
          <h3 className="text-lg font-display font-bold text-text-primary mb-4">
            <FiUser className="inline mr-2 text-primary" />
            Body Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Age"
              name="age"
              type="number"
              value={profile?.age || ''}
              onChange={handleChange}
              min={0}
              max={120}
              placeholder="25"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Gender</label>
              <select
                name="gender"
                value={profile?.gender || ''}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="" className="bg-background-card">Prefer not to say</option>
                <option value="male" className="bg-background-card">Male</option>
                <option value="female" className="bg-background-card">Female</option>
                <option value="other" className="bg-background-card">Other</option>
              </select>
            </div>
            <Input
              label="Height (cm)"
              name="height"
              type="number"
              value={profile?.height || ''}
              onChange={handleChange}
              min={100}
              max={250}
              step={0.1}
              placeholder="175"
            />
            <Input
              label="Weight (kg)"
              name="weight"
              type="number"
              value={profile?.weight || ''}
              onChange={handleChange}
              min={30}
              max={300}
              step={0.1}
              placeholder="75"
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Age" value={profile?.age || '-'} color="primary" />
          <StatCard title="Height" value={profile?.height ? `${profile.height}cm` : '-'} color="accent" />
          <StatCard title="Weight" value={profile?.weight ? `${profile.weight}kg` : '-'} color="success" />
          <StatCard title="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '-'} color="warning" />
        </div>
      )}

      {/* BMI & Ideal Weight */}
      {profile && profile.height > 0 && profile.weight > 0 && !editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
              <FiTarget className="inline mr-1" /> Body Mass Index
            </h3>
            <ProgressRing
              value={bmi || 0}
              max={40}
              size={160}
              strokeWidth={10}
              color={getBmiColor(bmi)}
            >
              <span className="text-3xl font-display font-bold text-text-primary">{bmi}</span>
              <span className="text-xs text-text-muted mt-1">{getBmiLabel(bmi)}</span>
            </ProgressRing>
          </Card>

          <Card className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
              Weight Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Current</span>
                <span className="text-xl font-bold text-text-primary">{profile.weight} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Ideal</span>
                <span className="text-xl font-bold text-primary">{idealWeight} kg</span>
              </div>
              {idealWeight && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                    <span>{Math.abs(profile.weight - idealWeight).toFixed(1)} kg {profile.weight > idealWeight ? 'to lose' : profile.weight < idealWeight ? 'to gain' : '— at goal!'}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 relative">
                    {/* Current weight marker */}
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(Math.max((1 - Math.abs(profile.weight - idealWeight) / Math.max(profile.weight, idealWeight)) * 100, 10), 100)}%`,
                        background: `linear-gradient(90deg, ${getBmiColor(bmi)}, ${getBmiColor(bmi)}80)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>Current: {profile.weight}kg</span>
                    <span>Ideal: {idealWeight}kg</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Training Settings */}
      <Card>
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          <FiClock className="inline mr-1" /> Training Settings
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary font-medium text-sm">Default Rest Time</p>
            <p className="text-xs text-text-muted">Time between sets (can be overridden per exercise in plan editor)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDefaultRestSeconds(Math.max(10, defaultRestSeconds - 15))}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/10 transition-all flex items-center justify-center"
            >
              -
            </button>
            <span className="text-lg font-display font-bold text-primary w-14 text-center">{defaultRestSeconds}s</span>
            <button
              onClick={() => setDefaultRestSeconds(Math.min(300, defaultRestSeconds + 15))}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/10 transition-all flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
