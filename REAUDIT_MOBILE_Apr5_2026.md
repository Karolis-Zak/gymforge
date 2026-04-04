# Mobile Re-Audit Report: GymForge
**Platform:** iPhone/Mobile 390x844px  
**Date:** April 5, 2026  
**Scope:** Full application review - re-test of all 9 pages and main user flows  
**Previous Audit:** Late March 2026

---

## Executive Summary

The app has made **substantial progress** since the last audit. The most critical mobile bug (active workout stepper overflow) is now fixed. Core flows like onboarding, weight logging, profile saving, and workout completion now work correctly. The visual system remains cohesive and on-brand.

However, **two new/persistent critical issues** have emerged:

1. **NEW P1**: Homepage is throwing repeated React production errors (#418, #423) during render — a production regression
2. **PERSISTENT P1**: Bottom navigation still overlaps content on long mobile pages (Plans, Edit Plan, Profile, Exercises, Workout)

Additionally, several P2 issues remain around mobile layout density, accessibility, and first-time-user clarity.

**Overall Assessment**: The app is now **functionally viable on mobile** for returning users, but has **stability issues on homepage** and remaining **layout collision problems** that hurt usability on long-form screens.

---

## What's Improved Since Last Audit

### Major Wins

**Active Workout Layout** ✓ FIXED
- Weight/reps controls are now vertically stacked on mobile instead of overflowing horizontally
- The control area is now fully visible and usable
- Set completion flow works: Done → Next Set → Rest Timer
- This was the biggest previous bug and is now resolved

**Onboarding Step 1** ✓ WORKING
- After filling name, age, gender, height, weight, and body type, Next button enables
- Advancing to Step 2 works correctly
- Validation state is now functional (was broken before)

**Weight Logging on Progress** ✓ WORKING
- Entering 82 kg creates a dated recent entry (5 Apr 2026)
- Entry appears in the "Recent entries" list below
- Helper text updates correctly

**Profile Save Flow** ✓ WORKING
- Save button is visible and prominent
- After saving, page switches to a populated summary view
- Success message "Profile updated successfully!" displays
- This is a complete end-to-end improvement from before

**Accessibility Improvements** ✓ IMPROVED
- Delete button now has aria-label="Delete plan"
- Plan editor controls now expose labels: "Move up", "Move down", "Remove [Exercise Name]"
- This makes icon-only actions more accessible

**Horizontal Overflow** ✓ FIXED
- No horizontal scrolling observed on any tested route
- Viewport width matches page bodyScrollWidth
- The responsive stepper layout is working correctly

**Exercise Explorer Payoff** ✓ IMPROVED
- Selecting a muscle group (e.g., Chest) now clearly shows a populated exercise list
- Results display with: exercise name, level badge, equipment type, secondary muscles
- The interaction is meaningful and provides immediate value

---

## Critical Issues (P1)

### Issue: Homepage React Production Errors

**Severity:** P1 (Production Regression)  
**Pages Affected:** `/` (home)  
**Observed Errors:**
- Minified React error #418 (appears multiple times)
- Minified React error #423 (appears at least once)

**Reproduction:**
1. Navigate to homepage at `/`
2. Open browser DevTools Console
3. Observe error messages during initial page load and render

**Expected Behavior:**
- No React errors during render
- Page should load smoothly with no warnings

**Impact:**
- This indicates a hydration mismatch, unstable client-side state, or conditional rendering that differs between server and client
- Error #418 is typically "invalid hook call" or "wrong component type"
- Error #423 is typically related to hydration mismatch
- Production errors reduce reliability and can cause unexpected behavior

**Root Cause Analysis:**
Most likely culprits:
1. **Conditional rendering based on client-only state**: The Dashboard component renders `QuickRepeatWorkout` when `!currentWorkout`, but if the Zustand store hydration differs between server and client, this could cause a mismatch
2. **Emoji characters in JSX**: The "✓" and "⚠️" characters in the Workout Status card (line 177) could differ if text normalization happens differently on server vs client
3. **Date calculations that differ**: The `weekStart` and `thisWeekLogs` calculations use `new Date()` which will differ on server vs client if not memoized correctly

**Recommendation:**
- Wrap the `QuickRepeatWorkout` conditional in a `useEffect` that only renders after client hydration is confirmed
- Alternatively, ensure that `currentWorkout` state is synchronized between server-side render and client hydration
- Test in non-minified environment to get detailed error messages

---

### Issue: Bottom Navigation Overlaps Content Across Multiple Pages

**Severity:** P1 (Blocks Access to Content)  
**Pages Affected:**
- `/plans` (lower card area)
- `/plans/[id]` (edit plan, lower exercises)
- `/profile` (training settings section)
- `/exercises` (lower exercise results)
- `/workout` (active session, lower exercise list)

**Reproduction:**
1. Navigate to `/plans`
2. Scroll to the bottom of the plan list
3. Observe that the final card's CTA row is partially obscured by the fixed bottom nav

**Expected Behavior:**
- All interactive content should remain fully visible above the fixed nav
- There should be visible clearance between page content and nav

**Current State:**
- The bottom padding fix from the last audit (pb-20 → pb-32) has helped but is **insufficient**
- pb-32 = 128px, which provides 64px clearance above the nav (nav height)
- However, this is being applied to the `<main>` padding, not accounting for safe-area insets on notched devices
- Content still visually runs behind the nav on several screens

**Visual Impact:**
- Users cannot confidently click lower buttons and interactive elements
- Pages appear incomplete or cut off
- Reduces confidence that content is fully accessible

**Recommendation:**
- Increase bottom padding to `pb-40` (160px) or `pb-48` (192px) on mobile
- Alternatively, add explicit safe-area padding: `pb-[calc(128px+var(safe-area-bottom))]`
- Consider using `pb-[calc(64px+var(--nav-height))]` with a CSS variable for nav height
- Test on actual mobile devices with notches (iPhone X+) to ensure safe-area is respected

---

## High-Priority Issues (P2)

### Issue: Plan Editor Layout Too Cramped for Mobile

**Severity:** P2 (Reduces Usability)  
**Page:** `/plans/[id]` (edit mode)  
**Screenshots:** Shows exercise rows compressed horizontally and vertically

**Problems:**
- Exercise cards have minimal vertical padding
- Set/Reps/Rest controls are inline and cramped
- Reorder (arrow up/down) and remove buttons are small and hard to target on mobile
- Lower exercise rows sit visually behind the bottom nav
- The editing experience feels risky and uncomfortable

**Reproduction:**
1. Navigate to Plans
2. Select any plan
3. Click the edit/pencil icon
4. Try to interact with lower exercises or reorder controls

**Expected Behavior:**
- Each exercise should be a spacious, tap-friendly mobile card
- Controls should have 44x44px minimum touch targets
- No overlap with bottom nav

**Recommendation:**
- Convert each exercise into a larger stacked mobile card with more padding
- Increase vertical spacing between exercise cards (currently ~3-4px, should be 12-16px)
- Make reorder/remove buttons larger and more obviously interactive
- Consider moving the Save Changes button to sticky positioning above the nav, or add more bottom padding

---

### Issue: Profile Training Settings Obscured by Bottom Nav

**Severity:** P2 (Reduces Clarity)  
**Page:** `/profile`  
**Elements Affected:** Rest day selection, plus/minus controls for rest-time preference

**Problems:**
- The lower training settings section partially hides behind the fixed nav
- The + and - buttons for adjusting rest time have small tap targets
- Users may not realize the lower controls are fully interactive

**Reproduction:**
1. Navigate to `/profile`
2. Scroll to bottom
3. Observe the rest-time controls being visually competed for by the nav

**Recommendation:**
- Add more bottom padding to push the section above the nav
- Increase tap target size of + and - buttons to 44x44px minimum
- Add visual separation between profile form and training settings

---

### Issue: Exercises Page Has Duplicate Interaction Paths

**Severity:** P2 (Semantic Redundancy)  
**Page:** `/exercises`  
**Problem:**
- Both the body-map SVG hotspot AND the muscle chip button below allow selecting the same muscle groups
- Both paths trigger the same action (show exercises for that muscle)
- The duplicate controls make the interaction model noisy and harder to understand

**Reproduction:**
1. Navigate to Exercises
2. Notice that Chest can be tapped both on the SVG body-map AND as a pill button below
3. Both actions filter to the same exercise list

**Impact:**
- Confusing interaction model for new users
- Can complicate accessibility testing and automation
- Unclear which path is the intended primary interaction

**Recommendation:**
- Keep both controls if desired (map for visual learners, chips for quick selection)
- But make the difference between them visually obvious
- Add text like "Or tap a muscle chip:" above the chips to clarify the alternative
- Consider different visual styling or positioning to reduce perceived redundancy

---

### Issue: Progress Page Buries Weight Logging for New Users

**Severity:** P2 (Reduces Discoverability)  
**Page:** `/progress`  
**Problem:**
- For a user with no workout history, the page is very long and mostly empty
- Multiple empty chart sections (Weekly Volume, Workouts Per Week, Volume Distribution, Activity Heatmap)
- Weight logging, which is the most obviously useful zero-data action, appears far down the page
- Users may scroll through many empty sections before finding the logging area

**Reproduction:**
1. Create a new account or clear all completed workouts
2. Navigate to Progress
3. Observe the length and emptiness of the page before reaching the weight logging section

**Expected Behavior:**
- New users should see the most useful zero-data action immediately
- Empty charts should be collapsed or hidden, not shown at full height

**Recommendation:**
- Detect when user has no workout history
- Reorder the page dynamically: show weight logging at the top for zero-data users
- Collapse empty charts into compact placeholder cards instead of full-height sections
- Add helpful text like "Complete 3 workouts to see volume trends" on empty charts

---

### Issue: Homepage Status Message Inconsistency

**Severity:** P2 (Confuses User Intent)  
**Page:** `/` (home)  
**Problem:**
- The Workout Status card shows "✓ On Track" but the stats below say "0/3 workouts this week • 3 remaining"
- These two pieces of information are contradictory: being "on track" while having 0/3 workouts seems inconsistent
- New users may misinterpret the status

**Root Cause:**
The `onTrack` logic at line 165 of Dashboard.tsx:
```typescript
const onTrack = plannedWorkoutsThisWeek > 0 && thisWeekLogs.length >= Math.ceil(plannedWorkoutsThisWeek * (new Date().getDay() / 7))
```

If today is early in the week (e.g., Monday), the expected-by-now count is low, so 0 completed workouts might still be "on track".

**Recommendation:**
- Simplify the status message to be less misleading for new users
- Use "On Schedule" only if progress actually matches or exceeds the expected pace
- Consider using a more neutral message early in the week like "Get your first workout in" instead of "On Track"

---

## Medium-Priority Issues (P3)

### Issue: History Page Empty State Too Passive

**Severity:** P3 (Low Engagement)  
**Page:** `/history`  
**Problem:**
- When there are no completed workouts, the page only says "No workouts yet"
- There is no action or recovery path offered
- Users have no next steps beyond "complete a workout"

**Recommendation:**
- Add a CTA button like "Start a Workout" or "Browse Plans"
- Show recently created or recommended plans that user can start immediately
- Link back to the Exercises or Plans page

---

### Issue: Get Started Validation Still Mostly Implicit

**Severity:** P3 (Friction in Onboarding)  
**Page:** `/get-started` → Step 1 and beyond  
**Problem:**
- While the required fields are now clear (name, body type), the form doesn't explicitly state what's required before the button becomes disabled
- Users must discover by trial that body type is needed
- No visible "required" indicator or completion guidance

**Recommendation:**
- Add explicit "* Required" labels next to required fields
- Show an inline progress indicator or completion % (e.g., "2 of 2 required fields")
- Consider adding a small helper text under the Next button: "Complete all required fields to continue"

---

## Visual Audit

### Typography

**What's Working:**
- Heading hierarchy is clear and readable
- No obvious font-loading failures
- Body text is legible

**Issues:**
- Small metadata text (exercise counts, volume totals, set counts) is still slightly too faint
- Density in plan cards and editor rows compresses the visual hierarchy
- Mobile line-height on small labels could be increased slightly

**Recommendations:**
- Increase contrast on small metadata text from text-text-muted to text-text-secondary
- Add line-height increase to small text: line-height-1.5 instead of tight default
- Consider font-size: 13px (text-[13px]) instead of 12px for secondary labels in dense cards

---

### Colors

**What's Working:**
- Cyan primary (#00d4ff) remains strong and readable
- Purple accent (#a855f7) is vibrant and intentional
- Dark background keeps focus on content
- Green success state is clear

**Issues:**
- Muted text (text-text-muted) sometimes blends with dark card backgrounds
- Disabled button state could have higher contrast

**Recommendations:**
- Increase muted text lightness slightly
- Make disabled buttons more visually distinct with border or pattern

---

### Buttons & Touch Targets

**What's Working:**
- Primary cyan CTAs are obvious
- Main action buttons (Begin Workout, Save Changes, Log) are prominent

**Issues:**
- Small icon controls (plan editor reorder/remove) are below 44x44px ideal
- Profile +/- rest controls are cramped
- Some passive cards still look slightly tappable

**Recommendations:**
- Increase icon button size to 44x44px minimum on mobile
- Add more spacing around small controls
- Reduce visual emphasis on passive stat cards

---

## Functional Verification Results

### ✓ Confirmed Working

| Flow | Result | Notes |
|------|--------|-------|
| Route loading | All 9 pages load | Home has JS errors but still renders |
| Onboarding Step 1 → Step 2 | Works | Required fields validation working |
| Plans → Start | Works | Workout pre-start screen loads |
| Begin Workout | Works | Active workout state opens |
| Complete Set | Works | Set completion advances to rest timer |
| Rest → Next Set | Works | Navigates to next set correctly |
| Exercises: Select Muscle | Works | Shows populated exercise list |
| Weight Logging | Works | Creates dated entry (5 Apr 2026) |
| Profile Save | Works | Success message displays |
| Profile Summary View | Works | Post-save populated state shows |

### ⚠️ Not Fully Verified

| Item | Reason |
|------|--------|
| Full 9-step onboarding completion | Passed Step 1-2, but didn't complete all 9 steps |
| Recovery log confirmation | UI present but endpoint interaction incomplete in this pass |
| Plan deletion with confirmation | Delete button present but didn't fully test confirmation flow |
| Mobile deep-linking (plan IDs, workout resume) | Not tested in this pass |

---

## Priority Fix Roadmap

### Phase 1 (CRITICAL - Immediate)

1. **Fix homepage React errors** (P1)
   - Investigate hydration mismatch on Dashboard component
   - Likely fix: Wrap QuickRepeatWorkout in useEffect for client-only rendering
   - Estimated effort: 1 hour
   - Impact: Removes production errors, stabilizes homepage

2. **Increase bottom nav clearance** (P1)
   - Increase pb-20 → pb-40 or pb-48 on mobile
   - Apply safe-area-inset offset for notched devices
   - Estimated effort: 30 minutes
   - Impact: Unblocks content on all long pages

### Phase 2 (High - This Sprint)

3. **Rework plan editor mobile layout** (P2)
   - Increase exercise card padding and spacing
   - Stack sets/reps/rest controls vertically on mobile
   - Increase icon button sizes to 44x44px
   - Estimated effort: 2 hours
   - Impact: Makes plan editing comfortable on mobile

4. **Fix profile bottom spacing and controls** (P2)
   - Add extra bottom padding
   - Increase +/- button size
   - Separate training settings visually
   - Estimated effort: 1 hour
   - Impact: Makes profile fully usable

5. **Simplify progress page for zero-data users** (P2)
   - Detect empty state and reorder sections
   - Collapse empty charts
   - Move weight logging higher
   - Estimated effort: 1.5 hours
   - Impact: Improves first-time-user clarity

### Phase 3 (Medium - Next Sprint)

6. **Improve exercises page affordance** (P3)
   - Reduce visual redundancy between map and chips
   - Add clearer instruction text
   - Estimated effort: 45 minutes

7. **Fix status message consistency** (P3)
   - Simplify on-track logic for early-week accuracy
   - Estimated effort: 30 minutes

8. **Improve history empty state** (P3)
   - Add CTA buttons and recovery actions
   - Estimated effort: 30 minutes

---

## Detailed Issue Tracking

| Issue ID | Title | Severity | Page | Status | Fix Priority |
|----------|-------|----------|------|--------|--------------|
| H-001 | Homepage React production errors | P1 | Home | NEW | IMMEDIATE |
| NAV-001 | Bottom nav overlaps content | P1 | Plans, Edit, Profile, Exercises, Workout | PERSISTENT | IMMEDIATE |
| EDITOR-001 | Plan editor layout cramped | P2 | Edit Plan | PERSISTENT | Sprint 1 |
| PROFILE-001 | Training settings obscured | P2 | Profile | PERSISTENT | Sprint 1 |
| EXERCISES-001 | Duplicate interaction paths | P2 | Exercises | NEW | Sprint 1 |
| PROGRESS-001 | Weight logging buried for new users | P2 | Progress | PERSISTENT | Sprint 1 |
| HOME-001 | Status message inconsistency | P2 | Home | NEW | Sprint 2 |
| GET-STARTED-001 | Implicit validation in onboarding | P3 | Get Started | PERSISTENT | Sprint 2 |
| HISTORY-001 | Empty state too passive | P3 | History | PERSISTENT | Sprint 2 |
| EXERCISES-002 | Weak initial affordance | P3 | Exercises | PERSISTENT | Sprint 2 |

---

## Build & Deployment Status

- **Build:** ✓ Passes (all 12 routes generate correctly)
- **Console Errors:** ⚠️ React errors #418, #423 on homepage
- **Responsive Design:** ✓ No horizontal overflow (fixed)
- **Navigation:** ✓ All routes accessible
- **Accessibility:** ✓ Improved, but some small touch targets remain

---

## Conclusion

GymForge has made **real progress** on core functionality and mobile usability. The app is now **viable for returning users** on mobile. However, the **homepage React errors are a production regression** that must be fixed immediately, and the **bottom-nav overlap is still limiting usability** on several key screens.

The next push should focus on:
1. Stabilizing the homepage (React errors)
2. Fixing bottom-nav overlap universally
3. Improving mobile layout density on editing and form-heavy screens

Once these P1 and P2 issues ship, the mobile experience will be competitive and polished.

---

## Appendix: Test Environment Details

- **Tested At:** April 5, 2026, afternoon local time
- **Viewport:** 390×844px (iPhone SE/13 mini emulation)
- **Network:** Simulated
- **Browser:** Chrome DevTools mobile emulation
- **Tested Routes:** 9/9 main routes
- **Tested Flows:** Onboarding, Plans, Workout, Exercises, Progress, Profile
- **Login State:** Tested with existing account (some data present)
- **No Cache Bust:** Used live Vercel deployment

