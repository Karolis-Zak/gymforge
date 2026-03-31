/**
 * Curated YouTube video IDs for exercises.
 * Key = EXACT exercise name (lowercase) as in exercises.ts
 * ALL video IDs verified working via YouTube oembed API.
 */
const curatedVideos: Record<string, string> = {
  // === CHEST ===
  'barbell bench press': 'rT7DgCr-3pg',
  'decline barbell bench press': 'LfyQBUKR8SE',
  'incline barbell bench press': 'SrqOu55lrYU',
  'dumbbell bench press': 'VmB1G1K7v94',
  'dumbbell flye': 'eozdVDA78K0',
  'incline cable flye': 'Iwe6AmxVf7o',
  'low-to-high cable crossover': 'taI4XduLpTk',
  'pec deck flye': 'Iwe6AmxVf7o',
  'cable crossover': 'taI4XduLpTk',
  'push-up': '_l3ySVKYVJ8',
  'wide push-up': '_l3ySVKYVJ8',
  'decline push-up': 'SKPab2YC8BE',
  'chest dip': 'dX_nSOOJIsE',
  'machine chest press': 'xUm0BiZCWlQ',
  'close-grip bench press': 'nEF0bv2FW94',
  'dumbbell floor press': 'uUGDRwge4F8',

  // === BACK ===
  'conventional deadlift': 'op9kVnSso6Q',
  'single-leg romanian deadlift': 'jEy_czb3RKA',
  'stiff-leg deadlift': 'CN_7cz3P-1U',
  'barbell bent-over row': 'FWJR5Ve8bnQ',
  'pendlay row': 'V8dZ3pyiCBo',
  'underhand barbell row': 'FWJR5Ve8bnQ',
  'dumbbell row': 'pYcpY20QaE8',
  'meadows row': 'GZbfZ033f74',
  'landmine row': 'j3Igk5nyZE4',
  'pull-up': 'eGo4IYlbE5g',
  'wide-grip pull-up': 'eGo4IYlbE5g',
  'neutral-grip pull-up': 'eGo4IYlbE5g',
  'band-assisted pull-up': 'eGo4IYlbE5g',
  'lat pulldown': 'CAwf7n6Luuc',
  'close-grip lat pulldown': 'CAwf7n6Luuc',
  'seated cable row': 'GZbfZ033f74',
  'close-grip cable row': 'GZbfZ033f74',
  'cable face pull': 'rep-qVOkqgk',
  'band face pull': 'rep-qVOkqgk',
  'face pull': 'rep-qVOkqgk',
  't-bar row': 'j3Igk5nyZE4',
  'machine row': 'roCP6wCXPqo',
  'inverted row': 'XZV9IwluPjw',
  'straight-arm pulldown': 'lueEJGjTuPQ',
  'lat prayer': 'lueEJGjTuPQ',

  // === SHOULDERS ===
  'overhead barbell press': 'QAQ64hK4Xxs',
  'seated barbell overhead press': 'QAQ64hK4Xxs',
  'seated dumbbell shoulder press': 'qEwKCR5JCog',
  'single-arm dumbbell shoulder press': 'qEwKCR5JCog',
  'arnold press': '6Z15_WdXmVw',
  'push press': 'iaBVSJm78ko',
  'dumbbell lateral raise': 'kDqklk1ZESo',
  'machine lateral raise': 'kDqklk1ZESo',
  'plate front raise': '-t7fuZ0KhDA',
  'dumbbell front raise': '-t7fuZ0KhDA',
  'reverse dumbbell flye': 'EA7u4Q_8HQ0',
  'cable reverse flye': 'EA7u4Q_8HQ0',
  'reverse pec deck': 'EA7u4Q_8HQ0',
  'barbell upright row': 'amCU-ziHITM',
  'dumbbell upright row': 'amCU-ziHITM',

  // === BICEPS ===
  'barbell curl': 'kwG2ipFRgfo',
  'reverse barbell curl': 'nRgxYX2Ve9w',
  'ez-bar curl': 'kwG2ipFRgfo',
  'dumbbell bicep curl': 'ykJmrZ5v0Oo',
  'hammer curl': 'zC3nLlEvin4',
  'cross-body hammer curl': 'zC3nLlEvin4',
  'cable rope hammer curl': 'zC3nLlEvin4',
  'preacher curl': 'fIWP-FRFNU0',
  'machine preacher curl': 'fIWP-FRFNU0',
  'ez-bar spider curl': 'fIWP-FRFNU0',
  'concentration curl': '0AUGkch3tzc',
  'incline dumbbell curl': 'soxrZlIl35U',
  'incline bench hammer curl': 'soxrZlIl35U',
  'spider curl': 'fIWP-FRFNU0',

  // === TRICEPS ===
  'cable tricep pushdown': 'vB5OHsJ3EME',
  'rope tricep pushdown': '2-LAMcpzODU',
  'band tricep pushdown': 'vB5OHsJ3EME',
  'single-arm cable pushdown': 'vB5OHsJ3EME',
  'overhead dumbbell tricep extension': '2C-uNgKwPLE',
  'cable overhead tricep extension': '2C-uNgKwPLE',
  'bodyweight tricep extension': '2C-uNgKwPLE',
  'skull crusher': 'd_KZxkY_0cM',
  'dumbbell skull crusher': 'd_KZxkY_0cM',
  'tricep dip': 'dX_nSOOJIsE',
  'bench dip': 'c3ZGl4pAwZ4',
  'machine dip': 'dX_nSOOJIsE',
  'dumbbell tricep kickback': '6SS6K3lAwZ8',

  // === QUADS ===
  'barbell back squat': 'Dy28eq2PjcM',
  'goblet squat': 'MeIiIdhvXT4',
  'kettlebell goblet squat': 'MeIiIdhvXT4',
  'sumo squat': 'MeIiIdhvXT4',
  'band squat': 'Dy28eq2PjcM',
  'pendulum squat': 'Dy28eq2PjcM',
  'leg press': 'IZxyjW7MPJQ',
  'single-leg leg press': 'IZxyjW7MPJQ',
  'leg extension': '8iPEnn-ltC8',
  'bulgarian split squat': '2C-uNgKwPLE',
  'hack squat': '0tn5K9NlCfo',

  // === HAMSTRINGS ===
  'lying leg curl': '1Tq3QdYUuHs',
  'seated leg curl': 'Orxowest56U',
  'dumbbell leg curl': '1Tq3QdYUuHs',

  // === GLUTES ===
  'barbell hip thrust': 'xDmFkJxPzeM',
  'smith machine hip thrust': 'xDmFkJxPzeM',
  'single-leg barbell hip thrust': 'xDmFkJxPzeM',
  'hip thrust machine': 'xDmFkJxPzeM',
  'glute bridge': 'wPM8icPu6H8',
  'single-leg glute bridge': 'wPM8icPu6H8',
  'kettlebell swing': 'YSxHifyI6s8',

  // === CALVES ===
  'standing calf raise': '-M4-G8p8fmc',
  'single-leg calf raise': '-M4-G8p8fmc',
  'bodyweight calf raise': '-M4-G8p8fmc',
  'smith machine calf raise': '-M4-G8p8fmc',

  // === CORE ===
  'plank': 'pSHjTRCQxIw',
  'side plank': 'K2VljzCC16g',
  'crunch': 'Xyd_fa5zoEU',
  'reverse crunch': 'hyv14e2QDq0',
  'hanging leg raise': 'hdng3Nm1x_E',
  'hanging knee raise': 'hdng3Nm1x_E',
  'bench leg raise': 'hdng3Nm1x_E',
  'lying leg raise': 'JB2oyawG9KI',
  'russian twist': 'wkD8rjkodUI',
  'bicycle crunch': '9FGilxCbdz8',
  'mountain climber': 'nmwgirgXLYM',
  'dead bug': 'I5xbsA71v1A',
  'bird dog': 'wiFNA3sqjCA',
  'pallof press': 'AH_QZLm_0-s',
  'cable wood chop': 'pAplQXk3dkU',
  'low-to-high cable wood chop': 'pAplQXk3dkU',
  'toe touch': 'Xyd_fa5zoEU',

  // === TRAPS ===
  'barbell shrug': 'cJRVVxmytaM',
  'dumbbell shrug': 'cJRVVxmytaM',
  'trap bar shrug': 'cJRVVxmytaM',
  'cable shrug': 'cJRVVxmytaM',
  'smith machine shrug': 'cJRVVxmytaM',

  // === FOREARMS ===
  'towel pull-up': 'eGo4IYlbE5g',
}

/**
 * Get a YouTube video ID for an exercise.
 * Exact name match only. Returns null for unmatched exercises
 * (UI shows YouTube search link as fallback).
 */
export function getExerciseVideoId(exerciseName: string): string | null {
  const lower = exerciseName.toLowerCase().trim()
  return curatedVideos[lower] || null
}

/**
 * Get a YouTube search URL for any exercise.
 */
export function getExerciseSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} proper form technique`)
  return `https://www.youtube.com/results?search_query=${query}`
}
