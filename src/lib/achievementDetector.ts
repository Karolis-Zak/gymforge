/**
 * Achievement detection logic
 * Called after workout completion to check if new achievements should unlock
 */

import type { WorkoutLog } from '../store/workoutLogStore'
import type { WorkoutPlan } from '../store/workoutStore'
import { calculateVolume } from './exerciseUtils'

export interface AchievementCheckResult {
  newlyUnlocked: string[]
  allUnlocked: string[]
}

export function checkAchievements(
  newLog: WorkoutLog,
  allLogs: WorkoutLog[],
  allPlans: WorkoutPlan[],
  unlockedAchievementIds: Set<string>,
  profileComplete: boolean,
  hasLoggedWeight: boolean
): AchievementCheckResult {
  const unlocked: string[] = []
  const completedLogs = allLogs.filter(l => l.completed)
  const totalWorkouts = completedLogs.length
  
  // Milestone achievements
  if (totalWorkouts === 1 && !unlockedAchievementIds.has('first-workout')) {
    unlocked.push('first-workout')
  }
  
  if (totalWorkouts === 10 && !unlockedAchievementIds.has('workouts-10')) {
    unlocked.push('workouts-10')
  }
  
  if (totalWorkouts === 50 && !unlockedAchievementIds.has('workouts-50')) {
    unlocked.push('workouts-50')
  }
  
  if (totalWorkouts === 100 && !unlockedAchievementIds.has('workouts-100')) {
    unlocked.push('workouts-100')
  }
  
  // Volume achievements
  const workoutVolume = calculateVolume(newLog.exercises)
  if (workoutVolume >= 1000 && !unlockedAchievementIds.has('volume-1000')) {
    unlocked.push('volume-1000')
  }
  
  const totalVolume = completedLogs.reduce((sum, log) => sum + calculateVolume(log.exercises), 0)
  if (totalVolume >= 5000 && !unlockedAchievementIds.has('volume-5000')) {
    unlocked.push('volume-5000')
  }
  
  // Streak achievements - check current streak from logs
  const streakDays = new Set(completedLogs.map(l => l.date.split('T')[0]))
  const today = new Date().toISOString().split('T')[0]
  let currentStreak = 0
  let checkDate = new Date(today)
  
  while (streakDays.has(checkDate.toISOString().split('T')[0])) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  if (currentStreak >= 3 && !unlockedAchievementIds.has('week-streak-3')) {
    unlocked.push('week-streak-3')
  }
  
  if (currentStreak >= 7 && !unlockedAchievementIds.has('week-streak-7')) {
    unlocked.push('week-streak-7')
  }
  
  if (currentStreak >= 30 && !unlockedAchievementIds.has('week-streak-30')) {
    unlocked.push('week-streak-30')
  }
  
  // Exercise variety achievements
  const uniqueExercises = new Set(completedLogs.flatMap(log => 
    log.exercises.map(ex => ex.exerciseId)
  ))
  
  if (uniqueExercises.size >= 10 && !unlockedAchievementIds.has('exercises-10')) {
    unlocked.push('exercises-10')
  }
  
  if (uniqueExercises.size >= 25 && !unlockedAchievementIds.has('exercises-25')) {
    unlocked.push('exercises-25')
  }
  
  // RPE logging achievement - check if all exercises have RPE in last workout
  const allHaveRPE = newLog.exercises.every(ex => ex.rpe !== undefined && ex.rpe !== null)
  if (allHaveRPE && !unlockedAchievementIds.has('all-rpe-logged')) {
    unlocked.push('all-rpe-logged')
  }
  
  // Perfect session - all sets completed
  const allSetsCompleted = newLog.exercises.every(ex => ex.sets.every(s => s.completed))
  if (allSetsCompleted && !unlockedAchievementIds.has('all-sets-completed')) {
    unlocked.push('all-sets-completed')
  }
  
  // Custom plan achievement
  const hasCustomPlan = allPlans.some(p => !p.isPreMade)
  if (hasCustomPlan && !unlockedAchievementIds.has('custom-plan')) {
    unlocked.push('custom-plan')
  }
  
  // Profile complete
  if (profileComplete && !unlockedAchievementIds.has('profile-complete')) {
    unlocked.push('profile-complete')
  }
  
  // Plan created
  if (allPlans.length > 0 && !unlockedAchievementIds.has('plan-created')) {
    unlocked.push('plan-created')
  }
  
  // Weight logged
  if (hasLoggedWeight && !unlockedAchievementIds.has('weight-logged')) {
    unlocked.push('weight-logged')
  }
  
  // Compound focus - 5+ compound exercises in current week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  const thisWeekCompoundCount = new Set(
    completedLogs
      .filter(l => new Date(l.date) >= weekStart)
      .flatMap(log =>
        log.exercises
          .filter(ex =>
            // Check if exercise name contains common compound movement names
            ['squat', 'deadlift', 'bench', 'press', 'row', 'pullup', 'chin', 'dip', 'clean'].some(
              c => ex.exerciseName.toLowerCase().includes(c)
            )
          )
          .map(ex => ex.exerciseId)
      )
  ).size
  
  if (thisWeekCompoundCount >= 5 && !unlockedAchievementIds.has('compound-focus')) {
    unlocked.push('compound-focus')
  }
  
  return {
    newlyUnlocked: unlocked,
    allUnlocked: Array.from(new Set([...Array.from(unlockedAchievementIds), ...unlocked]))
  }
}
