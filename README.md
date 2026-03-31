# GymForge

A modern fitness tracking app built with Next.js. Track workouts, build personalised training plans, and monitor your progress with a clean dark-themed UI.

## Features

- **Smart Onboarding** - 9-step questionnaire that generates a personalised workout plan based on your goals, equipment, schedule, and experience level
- **205 Exercise Database** - Comprehensive library with instructions, tips, and YouTube form guides
- **Active Workout Tracking** - Real-time timer, set tracking, rest timers, per-side tracking for unilateral exercises, weight progression suggestions
- **Plan Management** - Create, edit, import/export workout plans with configurable rest times
- **Progress Analytics** - Charts for volume, frequency, streaks, body weight tracking, and exercise-specific progress
- **Workout History** - Detailed view of every completed workout with sets, weights, reps, and session notes
- **Dark/Light Theme** - Toggle between themes for indoor/outdoor training
- **Plan Refresh System** - Automatic suggestions to switch up exercises after 2-4 weeks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand with localStorage persistence
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: react-icons (Feather)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/
    ui/             # Reusable UI primitives (Card, Button, Badge, etc.)
    layout/         # Sidebar, BottomNav, LayoutShell
    plans/          # Plan management components
    onboarding/     # Questionnaire and plan preview
  store/            # Zustand stores (user, workout, onboarding)
  data/             # Exercise database (205 exercises) and utilities
  lib/              # Plan generation algorithm
  hooks/            # Custom hooks
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and quick start |
| `/get-started` | Onboarding questionnaire |
| `/profile` | User profile with BMI and body metrics |
| `/plans` | Workout plan list |
| `/plans/new` | Create a new plan |
| `/plans/[id]` | Edit an existing plan |
| `/workout` | Active workout tracking |
| `/progress` | Analytics and charts |
| `/history` | Past workout details |

## License

MIT
