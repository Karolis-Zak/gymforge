/**
 * Shared constants for plan generation and display
 * Used in both Questionnaire and plan generation to maintain consistency
 */

export const GOAL_NAMES: Record<string, string> = {
  'strength': 'Strength',
  'muscle-building': 'Muscle Building',
  'toning': 'Tone & Define',
  'fat-loss': 'Fat Burn',
  'general-fitness': 'Fitness',
  'endurance': 'Endurance',
  'flexibility': 'Flexibility',
}

export const SECONDARY_GOAL_NAMES: Record<string, string> = {
  'strength': 'Strength',
  'fat-loss': 'Conditioning',
  'muscle-building': 'Hypertrophy',
  'toning': 'Toning',
  'endurance': 'Endurance',
}

/**
 * Get display label for primary goal
 */
export function getGoalLabel(goalId: string): string {
  return GOAL_NAMES[goalId] || goalId
}

/**
 * Get display label for secondary goal
 */
export function getSecondaryGoalLabel(goalId: string): string {
  return SECONDARY_GOAL_NAMES[goalId] || goalId
}
