/**
 * Curated YouTube video IDs for common exercises.
 * These are short-form instructional videos showing proper form.
 * Key = exercise name (lowercase), Value = YouTube video ID.
 */
const curatedVideos: Record<string, string> = {
  // Chest
  'barbell bench press': 'rT7DgCr-3pg',
  'flat barbell bench press': 'rT7DgCr-3pg',
  'incline barbell bench press': 'SrqOu55lrYU',
  'incline dumbbell press': 'hChjZQhX0HI',
  'dumbbell flat press': 'VmB1G1K7v94',
  'dumbbell fly': 'eozdVDA78K0',
  'cable crossover': 'taI4XduLpTk',
  'push-up': '_l3ySVKYVJ8',
  'push up': '_l3ySVKYVJ8',
  'chest dip': 'dX_nSOOJIsE',
  'machine chest press': 'xUm0BiZCWlQ',

  // Back
  'conventional deadlift': 'op9kVnSso6Q',
  'barbell row': 'FWJR5Ve8bnQ',
  'dumbbell row': 'pYcpY20QaE8',
  'pull-up': 'eGo4IYlbE5g',
  'pull up': 'eGo4IYlbE5g',
  'chin-up': 'brhRXlOhWI8',
  'chin up': 'brhRXlOhWI8',
  'lat pulldown': 'CAwf7n6Luuc',
  'seated cable row': 'GZbfZ033f74',
  'face pull': 'rep-qVOkqgk',
  't-bar row': 'j3Igk5nyZE4',

  // Shoulders
  'overhead press': 'QAQ64hK4Xxs',
  'seated dumbbell press': 'qEwKCR5JCog',
  'arnold press': '6Z15_WdXmVw',
  'lateral raise': 'kDqklk1ZESo',
  'front raise': '-t7fuZ0KhDA',
  'rear delt fly': 'EA7u4Q_8HQ0',
  'upright row': 'amCU-ziHITM',

  // Biceps
  'barbell curl': 'kwG2ipFRgfo',
  'dumbbell curl': 'ykJmrZ5v0Oo',
  'hammer curl': 'zC3nLlEvin4',
  'preacher curl': 'fIWP-FRFNU0',
  'concentration curl': '0AUGkch3tzc',
  'ez bar curl': 'kwG2ipFRgfo',
  'incline dumbbell curl': 'soxrZlIl35U',

  // Triceps
  'tricep pushdown': 'vB5OHsJ3EME',
  'overhead tricep extension': '2C-uNgKwPLE',
  'skull crusher': 'd_KZxkY_0cM',
  'tricep dip': 'dX_nSOOJIsE',
  'diamond push-up': 'J0DnG1_S3lg',
  'rope pushdown': '2-LAMcpzODU',
  'tricep kickback': '6SS6K3lAwZ8',

  // Legs
  'barbell back squat': 'Dy28eq2PjcM',
  'front squat': 'wyDbagKtFWQ',
  'goblet squat': 'MeIiIdhvXT4',
  'leg press': 'IZxyjW7MPJQ',
  'leg extension': '8iPEnn-ltC8',
  'walking lunge': 'L8fvypPrzzo',
  'bulgarian split squat': '2C-uNgKwPLE',
  'hack squat': '0tn5K9NlCfo',
  'romanian deadlift': '7ADMkPlnZOk',
  'lying leg curl': '1Tq3QdYUuHs',
  'seated leg curl': 'Orxowest56U',
  'barbell hip thrust': 'xDmFkJxPzeM',
  'glute bridge': 'wPM8icPu6H8',
  'kettlebell swing': 'YSxHifyI6s8',

  // Core
  'plank': 'pSHjTRCQxIw',
  'crunch': 'Xyd_fa5zoEU',
  'hanging leg raise': 'hdng3Nm1x_E',
  'russian twist': 'wkD8rjkodUI',
  'bicycle crunch': '9FGilxCbdz8',
  'ab wheel rollout': 'rqiTPl4XFfo',
  'mountain climber': 'nmwgirgXLYM',
  'dead bug': 'I5xbsA71v1A',

  // Calves
  'standing calf raise': '-M4-G8p8fmc',
  'seated calf raise': 'JbyjNymZODg',

  // Traps
  'barbell shrug': 'cJRVVxmytaM',
  'dumbbell shrug': 'cJRVVxmytaM',
  "farmer's walk": 'Fkzk_RqlYig',
  'farmers walk': 'Fkzk_RqlYig',

  // Bodyweight basics
  'push-ups': '_l3ySVKYVJ8',
  'bodyweight squats': 'aclHkVaku9U',
  'squats': 'aclHkVaku9U',
  'deadlifts': 'op9kVnSso6Q',
  'bench press': 'rT7DgCr-3pg',
}

/**
 * Get a YouTube video ID for an exercise.
 * Returns a curated ID if available, otherwise null.
 */
export function getExerciseVideoId(exerciseName: string): string | null {
  const lower = exerciseName.toLowerCase().trim()

  // Direct match
  if (curatedVideos[lower]) return curatedVideos[lower]

  // Partial match
  for (const [key, id] of Object.entries(curatedVideos)) {
    if (lower.includes(key) || key.includes(lower)) return id
  }

  return null
}



/**
 * Get a YouTube search URL (opens in new tab) for any exercise.
 */
export function getExerciseSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} proper form technique`)
  return `https://www.youtube.com/results?search_query=${query}`
}
