# GymForge

Your personal training command center. Build smart workout plans, track every rep, and watch your progress over time.

**[Live Demo](https://gymforge-nine.vercel.app)**

---

## What It Does

**Smart Plan Builder** — Answer questions about your goals, equipment, schedule, and experience. The app generates a personalised weekly training program with the right exercises, sets, reps, and rest times for you.

**Track Your Workouts** — Follow your plan with a clean workout interface. Log weights and reps, get rest timers between sets, watch form guide videos, and track each side for dumbbell exercises.

**See Your Progress** — Charts for weekly volume, workout frequency, exercise progression, body weight trends, and a streak calendar. Tap any past workout to see exactly what you did.

---

## Features

| Feature | Description |
|---------|-------------|
| Onboarding Questionnaire | 9-step quiz covering goals, injuries, equipment, schedule, preferences |
| Plan Generation | Auto-creates Push/Pull/Legs, Upper/Lower, or Full Body splits based on your answers |
| 205 Exercises | Full database with muscle groups, difficulty, instructions, tips, and video guides |
| Active Workout | Big central controls, auto rest timer, per-side tracking, exercise swap mid-workout |
| Weight Progression | Suggests +2.5kg when you've been consistent at current weight |
| Plan Editor | Add, remove, reorder exercises. Customise sets, reps, and rest per exercise |
| Progress Charts | Volume per week, workouts per week, streak heatmap, body part distribution |
| Body Weight Log | Track weight over time with trend chart |
| Workout History | Full detail view of every completed session |
| Dark/Light Theme | Toggle for indoor or outdoor training |
| Plan Refresh | Suggests new exercises every 2-4 weeks to keep things fresh |
| Session Notes | Log how you felt after each workout |

---

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — Dark-first design system with glassmorphic UI
- **Zustand** — State management with localStorage persistence
- **Chart.js** — Analytics and progress visualisation
- **react-icons** — Feather icon set

---

## Getting Started

```bash
git clone https://github.com/Karolis-Zak/gymforge.git
cd gymforge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

live [gymforge-nine.vercel.app](https://gymforge-nine.vercel.app/)
---

## Project Structure

```
src/
  app/                  # Pages (App Router)
    get-started/        # Onboarding questionnaire
    plans/              # Plan list, builder, editor
    workout/            # Active workout tracking
    progress/           # Analytics and charts
    history/            # Past workout details
    profile/            # User profile and BMI
  components/
    ui/                 # Card, Button, Badge, Input, ProgressRing, StatCard, ErrorBoundary
    layout/             # Sidebar, BottomNav, LayoutShell
    plans/              # PlanCard, PlanBuilder, PlanEditor, ExercisePicker
    onboarding/         # Questionnaire, SelectionCard, PlanPreview
  store/                # Zustand stores (user, workout, onboarding)
  data/                 # 205 exercises with search utilities and video links
  lib/                  # Plan generation algorithm
  hooks/                # Hydration hook
```

---

## Deployment

Hosted on [Vercel](https://vercel.com). Pushes to `production` branch auto-deploy to the live site.

```bash
git checkout production
git merge main
git push origin production
```

---

## License

MIT
