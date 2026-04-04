# Mobile Audit Report: GymForge
**Platform:** iPhone/Mobile 390x844px  
**Date:** April 2026  
**Scope:** Full application review (9 pages, all major user flows)

---

## Executive Summary

GymForge has a strong visual identity and coherent design system, but the mobile experience is **not yet production-tight**. Critical P1 issues prevent core functionality on mobile (bottom nav overlap, workout input clipping). P2 issues reduce clarity and usability (hidden validation, cramped layouts, unlabeled controls). P3 issues hurt onboarding and new-user experience (weak affordances, empty states).

**Recommendation:** Fix P1 issues immediately (they block functionality). P2 issues should follow in the next pass. P3 improvements should ship after P1/P2 are stable.

---

## What's Working Well

### Visual & Design System
- **Cyan primary color** works excellently for CTAs against dark background
- **Purple accent** adds energy and fits the brand personality
- **Dark background** keeps the app focused and on-theme
- **Consistent component patterns**: rounded cards (rounded-2xl), repeated spacing, section headers, status badges
- **Typography hierarchy** is clear: large display headings, readable body text, muted supporting text
- **Green difficulty badges** have good contrast and readability

### Navigation & Routing
- All 9 main routes load successfully on mobile: `/`, `/get-started`, `/plans`, `/workout`, `/exercises`, `/progress`, `/history`, `/profile`
- **Bottom nav** is easy to interpret with clear labels
- **Dashboard** summary is scannable and readable
- **Plans list** cards are visually distinct and easy to scan

### Core Flows (Verified Working)
- Plans → Start → Begin Workout opens correctly
- Preview plan opens editable plan template
- Weight logging on Progress creates dated entries and updates UI state
- No obvious 4xx/5xx errors or console exceptions during mobile testing

### Content Quality
- **Onboarding landing** is visually strong with good emotional framing and clear single CTA
- **Recovery card** on dashboard is distinct and useful
- **Exercise list preview** on plan cards shows useful metadata
- **Form fields** are generally well-labeled and have sensible placeholders

---

## Critical Issues (P1) - Block Core Functionality

### Issue 1: Fixed Bottom Nav Covers Content on Long Pages

**Affected Pages:**
- Plans list (lowers section cut off)
- Plan detail / edit (lower controls covered)
- Profile (save button area obscured)
- Active workout (exercise list cut off)

**Root Cause:** Main content uses `pb-20` (80px padding), but BottomNav is `h-16` (64px) with fixed positioning. Only 16px clearance = content gets covered when scrolling to bottom.

**Reproduction:**
1. Navigate to `/plans`
2. Scroll to bottom of plan cards
3. Last card row is obscured by the nav bar

**Expected Behavior:** All clickable content should remain above the fixed nav with adequate clearance.

**Fix:** Increase bottom padding to `pb-32` (128px) on mobile, which provides 64px clearance buffer above nav.

---

### Issue 2: Active Workout Stepper Layout Overflows Mobile Viewport

**Page:** `/workout` (active session)  
**Component:** `ExerciseFocusCard` → input controls row

**Problem:** Weight/reps controls are laid out horizontally:
```
[−] [weight: 20] [+]  ×  [−] [reps: 10] [+]
```

On a 390px viewport, this exceeds available width and controls clip off left/right edges.

**Reproduction:**
1. Plans → Start → Begin Workout
2. Look at weight and reps input area
3. Minus/plus buttons and inputs are partially cut off at edges

**Visual Impact:** The most important interaction area on the page (set tracking) looks broken and is difficult to interact with.

**Expected Behavior:** All controls fully visible and accessible on mobile.

**Fix:** Stack controls vertically on mobile (flex-col), keep horizontal layout only on tablets and desktop (md:flex-row). Hide the × separator on mobile.

---

## High-Priority Issues (P2) - Reduce Clarity, Usability

### Issue 3: Onboarding Has Hidden Validation

**Page:** `/get-started` → Step 1 (About You)  
**Component:** Step1AboutYou

**Problem:** The Next button is disabled until user selects BOTH:
1. Name (text input)
2. Body type (selection card)

However, there is **no inline explanation** when the button is disabled, so users don't know what's blocking them.

**Reproduction:**
1. Start onboarding → get to Step 1
2. Fill in Age, Gender, Height, Weight
3. Don't fill Name or Body Type
4. Next button stays disabled with no explanation

**User Experience Impact:** Form appears "stuck" or broken. User has no idea what additional input is needed.

**Expected Behavior:** Show inline validation message listing required fields.

**Fix:** Add an inline alert/banner above the Next button showing:
- ⚠️ Required: Add your name
- ⚠️ Required: Select your build type

---

### Issue 4: Icon-Only Delete Button Not Labeled

**Page:** `/plans`  
**Component:** PlanCard

**Problem:** Delete button (trash icon) has no `aria-label`, making it inaccessible to screen readers and unclear to new users.

**Reproduction:**
1. Navigate to Plans
2. Look at action row on any plan card
3. Trash icon is visible but has no hover tooltip or label

**Expected Behavior:** All icon-only actions should have descriptive aria-labels and ideally a tooltip or visible label.

**Fix:** Add `aria-label="Delete plan"` to the delete button.

---

### Issue 5: Plan Edit Page is Too Cramped on Mobile

**Page:** `/plans/[id]` (edit view)  
**Component:** PlanEditor

**Problem:**
- Exercise rows are compressed horizontally
- Sets/Reps/Rest controls are tightly packed
- Lower controls sit near or under the bottom nav
- Text labels are small and hard to read

**Reproduction:**
1. Plans → Select a plan → Click edit (pencil icon)
2. Scroll through exercise list
3. Try to interact with lower rows

**User Experience Impact:** Editing feels risky and cramped. Touch targets are small.

**Expected Behavior:** Comfortable spacing for mobile editing; larger touch targets.

**Improvements Needed:**
- Increase horizontal/vertical spacing in exercise rows
- Stack Sets/Reps/Rest vertically on mobile (currently inline)
- Increase button/input sizes to meet 44x44px minimum touch target
- Increase bottom padding to clear nav

---

### Issue 6: Secondary Muscle Labels Have Insufficient Contrast

**Page:** `/exercises`  
**Component:** ExerciseList

**Problem:** Secondary muscle group labels are displayed in small, muted text that is hard to read against the dark card background.

**Reproduction:**
1. Navigate to Exercises
2. Tap a muscle group (e.g., chest)
3. Look at the exercise results
4. Secondary muscle labels are faint and hard to distinguish

**Expected Behavior:** All text should meet WCAG AA contrast standards.

**Fix:** Increase contrast on secondary labels; consider using a lighter shade or slightly larger font.

---

## Medium-Priority Issues (P3) - Improve New-User Experience

### Issue 7: Exercises Page Has Weak Affordance

**Page:** `/exercises`  
**Component:** BodyMap

**Problem:**
- The page prominently displays the body map but doesn't clearly communicate "what happens when I tap?"
- The text "Tap a muscle group to see exercises" is small and could be more prominent
- After tapping, the transition to showing exercises could be more obvious
- No visual feedback/loading state

**User Experience Impact:** New users may not understand the interactive pattern. Low confidence in what the page does.

**Expected Behavior:** Clear, obvious call-to-action; visual feedback on interaction.

**Improvements Needed:**
- Add stronger affordance hint (e.g., "Select a muscle to explore exercises")
- Add subtle animation or highlight when muscle is tapped
- Show exercise results immediately and prominently below the map
- Consider adding "Try tapping: Chest" or similar example

---

### Issue 8: Progress Page is Too Long for New Users

**Page:** `/progress`  
**Component:** WorkoutProgress

**Problem:**
- Multiple empty charts (Weekly Volume, Workouts Per Week, Activity Heatmap, Volume Distribution)
- No data guidance until after scrolling far down
- Weight logging is buried below empty charts
- Page is overwhelming for someone with minimal logged workouts

**Reproduction:**
1. Create new account → Start workout → Log one set
2. Navigate to Progress
3. Scroll through multiple empty chart sections

**User Experience Impact:** Cognitive overload. User doesn't immediately see "what should I do here?" The one useful action (weight logging) is hidden.

**Improvements Needed:**
- Move weight logging section to the **top** for new users (show it before charts)
- Collapse or hide empty charts with helpful CTA ("Complete 3 workouts to see trends")
- Use progressive disclosure: show only charts with data
- Add clear empty state guidance at the top

---

## Visual & Design Issues

### Typography

**Good:**
- Hierarchy is clear and readable
- Headings use display font with appropriate sizing
- Body text is legible at default sizes

**Issues:**
- Some small labels (text-[10px], text-[9px]) are at the edge of readability on mobile
- In dense views (Plans, Plan Edit), meta text gets lost
- Form labels in Step1 are readable but could have more breathing room

**Recommendations:**
- Audit all text below 12px and consider increasing to text-xs (12px) minimum
- Increase line-height on small labels for better readability
- Add more vertical padding between form sections on mobile

---

### Colors

**Good:**
- Cyan (#00d4ff) primary is vibrant and has excellent contrast on dark
- Purple accent (#a855f7) is energetic and fits brand
- Green (#22c55e) success state is clear
- Red (#ef4444) danger state is obvious

**Issues:**
- Some secondary/muted text (text-text-muted) is close to low-contrast territory
- Disabled buttons could have higher contrast so disabled state is more obvious
- On dark cards, some UI elements (borders, disabled states) blend together

**Recommendations:**
- Review text-text-muted shade; consider slightly lighter color
- Increase disabled button opacity or add border to make state clearer
- Ensure all interactive elements have sufficient contrast even when inactive

---

### Buttons

**Good:**
- Primary buttons (cyan background) are obvious and easy to spot
- Consistent sizing and spacing
- Clear active/hover states

**Issues:**
- Some pages have too many buttons competing (plans list: Start, Preview, Edit, Delete on one row)
- Icon-only buttons (edit, delete) are too subtle without labels
- Some interactive elements (dashboard stat tiles) look tappable but may not navigate
- Touch targets on small icon buttons are below 44x44px ideal

**Recommendations:**
- Differentiate button hierarchy more aggressively: primary → secondary → tertiary → ghost
- Add visible labels to all icon actions on mobile, or increase icon button size to 44x44px
- Only style elements as buttons if they navigate or trigger actions; remove button styling from static content
- Use visually distinct styles for destructive actions (delete)

---

## Page-by-Page Breakdown

### Home / Dashboard

**Good:**
- Quick start cards are scannable
- Recovery card is distinct and useful
- Layout structure is clear

**Bad:**
- Dense information at top competes for attention
- Stat tiles look clickable but unclear if they navigate

**Suggestions:**
- Reduce initial cognitive load; show one primary card and collapse rest
- Make stat tiles either clearly interactive with visible destination, or style as static content
- Add "Recent workouts" section above fold for returning users

---

### Get Started / Onboarding

**Good:**
- Strong hero image and emotional framing
- Single clear CTA ("Start")
- Step-by-step structure is logical

**Bad:**
- Step 1 validation is hidden (no feedback on why Next is disabled)
- Form state is not self-explanatory
- No visual progress indicator showing which step user is on

**Suggestions:**
- Add inline validation feedback (see P2 Issue 3)
- Show step progress at top (Step 1 of 9)
- Make required fields more obvious (e.g., red asterisk)
- Consider grouping related fields visually

---

### Plans List

**Good:**
- Cards are easy to scan
- Start and Preview CTAs are clear
- Search placement makes sense

**Bad:**
- Bottom nav overlaps lower card area (P1 Issue 1)
- Icon buttons are subtle and unlabeled (P2 Issue 4)
- Cards feel slightly cramped vertically
- No delete confirmation dialog

**Suggestions:**
- Fix bottom padding (P1)
- Add aria-labels to all icon buttons
- Add confirmation dialog before delete
- Increase vertical spacing between card rows
- Consider collapsing Edit/Delete into a "more" menu on mobile

---

### Plan Detail / Edit

**Good:**
- Structure is clear: metadata, then exercises
- Edit form is functional

**Bad:**
- Too cramped for mobile editing (P2 Issue 5)
- Bottom nav overlaps content
- Exercise rows are compressed
- Sets/Reps/Rest controls are inline and hard to use

**Suggestions:**
- Fix bottom padding (P1)
- Stack Sets/Reps/Rest vertically on mobile
- Increase row height and padding
- Make save button sticky above nav
- Consider hiding bottom nav during edit mode

---

### Workout (Pre-Start)

**Good:**
- Summary is clear and readable
- Exercise list shows good metadata
- Large primary CTA (Begin Workout) is obvious
- This is a good model for information density on mobile

**Bad:**
- Nothing broken here, but keep this layout structure for active workout too

---

### Active Workout (In-Session)

**Good:**
- Session state is clear (current set, total sets)
- Timer and progress are visible
- Primary Done button is obvious
- Exercise swap feature is useful

**Bad:**
- **Critical: Weight/reps controls overflow** (P1 Issue 2)
- Exercise list below controls is cut off by bottom nav
- Guide video toggle is small
- Unilateral exercise (per-side) mode UI is cramped

**Suggestions:**
- Fix stepper layout (P1) - stack controls vertically on mobile
- Fix bottom padding
- Consider full-screen overlay for this view (hide nav/sidebar)
- Larger touch targets for Left/Right side buttons

---

### Exercises

**Good:**
- Clean page structure
- Front/Back toggle is easy to understand
- Muscle group pills are readable

**Bad:**
- Weak affordance for interaction (P3 Issue 7)
- Body map dominates without showing payoff
- First-screen utility is low
- No example/empty state guidance

**Suggestions:**
- Add stronger CTA hint ("Select a muscle to explore exercises")
- Show example exercises immediately after muscle selection
- Use animation/highlight to show muscle was selected
- Consider showing a few example exercises on first load
- Improve contrast on unselected muscle chips

---

### Progress

**Good:**
- Comprehensive dashboard approach (stats, charts, weight, recovery)
- Weight logging works and creates dated entries
- Layout structure is clear

**Bad:**
- **Too long and mostly empty for new users** (P3 Issue 8)
- Important action (weight logging) is buried
- Multiple empty chart sections create cognitive overload
- No guidance on what to do next

**Suggestions:**
- Move weight logging to the top
- Collapse empty charts with helpful CTA
- Show only charts with data
- Add empty state guidance
- Consider showing daily goal/recommendation

---

### History

**Good:**
- Structure is clear
- No visual bugs
- Clean empty state message

**Bad:**
- Very low usefulness when empty
- No CTA or next steps

**Suggestions:**
- Add "Start a workout" CTA in empty state
- Show "Recent templates you can start"
- Link back to Plans page
- Consider showing sample workout if no history

---

### Profile

**Good:**
- Clean, straightforward layout
- Form fields are well-labeled
- Save button is prominent
- Theme toggle works

**Bad:**
- Lower content sits too close to or under bottom nav (P1 Issue 1)
- Rest-time control area is cramped
- Plus/minus buttons are small targets

**Suggestions:**
- Fix bottom padding (P1)
- Increase spacing between form groups
- Make number stepper buttons larger (44x44px)
- Consider segmented control or slider for rest time preference

---

## Fix Priority & Implementation Order

### Phase 1 (Critical - Ship Now)
1. **Fix bottom nav overlap** - Increase pb-20 → pb-32 on main content
2. **Fix workout stepper clipping** - Stack controls vertically on mobile
3. **Add validation feedback** - Step 1 required field messages
4. **Label delete button** - Add aria-label to plan delete

**Estimated effort:** 1-2 hours | **Impact:** Unblocks core workflows

### Phase 2 (High - Ship This Sprint)
1. Rework plan edit layout - Stack Sets/Reps/Rest vertically
2. Increase touch targets on profile number steppers
3. Add example/affordance hint on Exercises page
4. Reorganize Progress page for new users

**Estimated effort:** 4-6 hours | **Impact:** Improves usability across 4+ pages

### Phase 3 (Medium - Ship Next Sprint)
1. Add delete confirmation dialogs
2. Improve Progress empty states
3. Improve History empty state with CTA
4. Review and increase all text contrast

**Estimated effort:** 6-8 hours | **Impact:** Polish and accessibility

---

## Accessibility Issues

- [ ] Icon-only buttons lack aria-labels (Plan delete, Exercise delete actions)
- [ ] Form validation is hidden (Step 1 required fields)
- [ ] Touch targets below 44x44px (icon buttons, number steppers)
- [ ] Some text contrast close to WCAG AA threshold
- [ ] No form progress indicator (which step out of total)
- [ ] Missing alt text on some icon buttons

---

## Browser & Device Notes

- **Viewport tested:** 390×844px (iPhone SE/13 size)
- **No console errors** during navigation and basic interactions
- **No 4xx/5xx responses** during audit period
- **localStorage persistence** working correctly
- **Zustand state** hydrating properly (no hydration mismatches observed)

---

## Conclusion

GymForge has a **strong foundation** with good design consistency, clear navigation, and working core flows. The critical issues are **mobile-specific layout problems** (bottom nav, stepper overflow) that are fixable with responsive design improvements. Once P1 issues ship, the app will be mobile-functional. P2 and P3 improvements will elevate it from functional to delightful.

**Recommended Next Step:** Ship Phase 1 fixes immediately, then gather mobile user feedback on Phases 2-3 priorities.
