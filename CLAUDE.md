# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development**
```bash
npm run dev        # Start dev server at http://localhost:3000 (or gymforge.local:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run Next.js linter
```

## Architecture Overview

**GymForge** is a workout planning and tracking app. The core flow: user answers onboarding questions → plan generator creates a personalized program → user tracks workouts and progress.

### Plan Generation (src/lib/planGenerator.ts)

The generator is **constraint-driven**: it builds exercise pools, scores exercises based on goal-fit, and uses **SessionBuilder** to enforce time constraints.

**Key concepts:**
- **SessionBuilder**: A time-budget enforcer. Each exercise has an estimated duration (30s base + 2s per rep, plus rest). SessionBuilder prevents adding an exercise if it exceeds remaining session time.
- **Volume logic**: Sets/reps vary by fitness level, primary goal, secondary goal, and exercise type (compound vs isolation).
- **Scoring system**: Each exercise gets a score based on:
  - Goal-specific bonuses (COMPOUND_SCORE, ISOLATION_SCORE tables keyed by primaryGoal)
  - Exercise difficulty vs fitness level
  - Whether it targets focus areas
- **5-phase selection**:
  1. Main compound lifts (weighted by goal)
  2. Isolation exercises (weighted by goal)
  3. Aesthetic muscles (calves, core) for toning
  4. Focus area exercises (secondary muscle groups)
  5. Fill remaining time with beginner-safe exercises
- **Push/pull rebalancing**: After phase 1, if push/pull set counts are imbalanced, pull exercises are boosted.
- **Exercise rotation**: 3-week cycles with variations to prevent plateaus.

**Output**: GeneratedPlan with days, exercises, description, and weeklyProgression (RPE per week).

### State Management (src/store/)

Uses **Zustand with localStorage persistence**. Each store is a separate file:
- **userStore**: Profile (age, height, weight, bodyType), theme, weight history
- **workoutStore**: Workout plans and exercises
- **onboardingStore**: Questionnaire answers + completion timestamps + usedExerciseIds
- **workoutLogStore**: Completed workouts with reps/weights logged
- **recoveryStore**: Post-workout recovery notes
- **achievementStore**: Milestones and badges
- **toastStore**: Toast notifications

**Pattern**: Zustand `create()` with `persist()` middleware. Store hydration happens in-browser only.

### Components Structure

**Routing** (src/app/):
- `get-started/` — Questionnaire (9 steps) + plan preview
- `plans/` — Plan list, plan editor, new plan
- `workout/` — Active workout tracking with timer
- `exercises/` — Body map + exercise browser
- `progress/` — Charts (volume, frequency, streak, body weight)
- `history/` — Past workout details
- `profile/` — User profile and settings

**Key Components**:
- **Questionnaire.tsx**: Manages all 9 steps. Generates plan on Step 9, renders PlanPreview.
- **PlanPreview.tsx**: Displays generated plan with [Plan] and [Guide] tabs. Plan tab shows stats + exercise cards. Guide tab shows description (now broken into readable sections).
- **BodySVG + ExerciseList**: Interactive anatomy figure. Tap a muscle to filter exercises.
- **Workout.tsx**: Active session. Big play/pause, auto rest timer, per-side dumbbell tracking.

### Data Layer (src/data/)

**exercises.ts**: 205+ exercises with:
- id, name, type (compound/isolation)
- muscleGroups (primary + secondary)
- difficulty (beginner/intermediate/advanced)
- equipment (barbell, dumbbell, cable, machine, bodyweight, band, kettlebell, etc.)
- notes (form tips)

**exerciseVideos.ts**: Mapping of 205 exercise IDs to verified YouTube video IDs.

**exerciseCategories.ts**: Exercise groupings by category (push, pull, leg, core, etc.).

**exerciseUtils.ts**: Helpers to get labels, filter by equipment, get all muscle groups, etc.

### Design System

**Tailwind**: Dark-first glassmorphic UI. Key color variables are in tailwind.config.js (primary, accent, success, warning, danger, etc.).

**Components** (src/components/ui/):
- Card, Button, Badge, Input, ProgressRing, StatCard, ErrorBoundary

**Patterns**:
- Use `className="space-y-4"` for vertical spacing between sections
- Primary color = `text-primary`, secondary text = `text-text-secondary`
- Form inputs get `focus:ring-primary/20` styling
- Cards use `rounded-2xl` for consistency

## Recent Work (Context)

### Tier 2 Scoring Fixes (7 commits)
Fixed exercise selection quality by:
1. Goal-aware scoring (toning ≠ fat-loss)
2. Dynamic push/pull rebalancing
3. Time estimation aligned with SessionBuilder
4. Deload week detection and RPE ranges
5. Aesthetic muscle prioritization (calves, core for toning)

### Plan Preview Redesign (4 commits)
Beginner UX improvements:
- Tab system: [Plan] shows clean exercise list, [Guide] shows guidance text separately
- Scroll-to-top when plan loads
- Day cards with left border accent, numbered exercises, right-aligned sets/reps/rest
- RPE table in Guide (replaces text explanation)
- Description broken into sections with proper spacing

### Training Location Context
Gym vs home equipment distinction:
- Questionnaire Step 4 asks "Where do you train?"
- Gym users → skip equipment filter, get all 225 exercises
- Home users → show equipment checklist, filter pools by availableEquipment
- Backward compatible (undefined defaults to home behavior)

## Branching & Deployment

**Branches**:
- `main` — Development branch. Merge feature branches here.
- `production` — Deployed to Vercel. Merge `main` → `production` to deploy live.

**Deploy to production**:
```bash
git checkout production
git merge main
git push origin production
```

Vercel auto-deploys production branch to https://gymforge-nine.vercel.app.

## Common Patterns

### Adding a Store
```typescript
// src/store/newStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Store { /* ... */ }

export const useNewStore = create<Store>()(
  persist(
    (set) => ({ /* actions */ }),
    { name: 'store-key' }
  )
)
```

### Plan Generation Parameters
Always pass `OnboardingAnswers` to `generatePlan()`. Key fields that affect generation:
- `primaryGoal`, `secondaryGoal` (affect scoring + volume)
- `fitnessLevel` (affects exercise difficulty + exercise selection)
- `daysPerWeek`, `sessionDuration` (affect SessionBuilder budget)
- `trainingLocation` (gym = skip equipment filter; home = use filter)
- `focusAreas` (prioritize these muscles)
- `injuries` (filter exercises marked as risky for that injury)

### Component Prop Drilling for Forms
Use local state + `update(partial)` callback. Example:
```typescript
const [answers, setAnswers] = useState(answers)
const update = (partial) => setAnswers(prev => ({ ...prev, ...partial }))
// Pass update down to child steps
```

## Known Gotchas

1. **Zustand hydration**: Store data only available after client hydration. Use `useEffect` to handle async state.
2. **localStorage key changes**: If you rename `persist({ name: 'old-key' })` to `{ name: 'new-key' }`, users lose data. Migrate manually if needed.
3. **Exercise ID uniqueness**: 205 exercises have unique IDs. If adding new exercises, check for collisions in src/data/exercises.ts.
4. **SessionBuilder time calculation**: 30s base + 2s per rep per set. Must match UI display (estimateDuration in planGenerator).
5. **RPE ranges**: Must correspond to weeklyProgression output. Short timelines (≤4 weeks) have different phase ranges than longer ones.

## Testing & Debugging

- **Test plan generation**: Vary answers (fitness level, goals, equipment, days/week) and verify exercise pools scale correctly.
- **Inspect localStorage**: DevTools → Application → Local Storage → `gymforge` → see all store keys (onboarding-storage, user-storage, etc.).
- **Verify time calculations**: SessionBuilder time estimate should match UI display time. Log totalSeconds in SessionBuilder.tryAdd().
- **Check injury filters**: If user selects injury, verify those exercises are excluded from all pools in generatePlan().
