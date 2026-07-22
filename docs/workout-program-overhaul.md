# Workout Program Overhaul

## Purpose

Redesign the current rehabilitation-heavy weekly schedule around three primary lifting days, one dedicated cardio day, daily physical-therapy work, and a consistent daily stretching practice.

This document records the approved program and its production implementation path. The account-scoped installer at `scripts/apply-workout-overhaul.ts` writes the program to Weeks 1–6 with identical prescriptions; the cycle's Week 7 lookup uses Week 6 unchanged.

## Weekly Structure

| Day | Focus | Main blocks |
| --- | --- | --- |
| Monday | Leg day | Hip-focused warmup, Leg PT, Main Strength, Strength Accessories, Core |
| Tuesday | Recovery | Recovery PT |
| Wednesday | Recovery | Recovery PT |
| Thursday | Push/Pull + Core A | Shoulder/Core Warmup, Upper PT, Main Strength, Push/Pull Accessories, Core |
| Friday | Recovery | Recovery PT |
| Saturday | Push/Pull + Core B | Shoulder/Core Warmup, Upper PT, Main Strength, Push/Pull Accessories, Core |
| Sunday | Dedicated cardio | 60-minute Cardio, Cardio-Day PT |

Daily Stretching is assigned to all seven days but sits outside the main workout.

## Block-Level Decisions

### Lifting days

- Every lifting session begins with an approximately 10-minute preparation block.
- PT remains a distinct block rather than being hidden inside the warmup.
- Main strength and accessory work remain separate blocks.
- Every lifting session ends its main workout with a dedicated core block.
- Stretching happens separately from the main workout.

### Recovery days

- Tuesday, Wednesday, and Friday contain a dedicated PT block.
- They also contain the same Daily Stretching block used throughout the week.

### Cardio day

- Sunday contains a single 60-minute main Cardio block.
- A distinct PT block and the shared Daily Stretching block are also assigned.

## Daily Stretching Block

The same five movements are performed every day:

1. Couch Stretch
2. 90/90 Glute Stretch with Slow Transitions
3. Back Rolling / T-Spine Stretching
4. World’s Greatest Stretch
5. Reverse Plank

No target durations are prescribed. Each movement has an independent stopwatch in the workout Stretch Block, with one timer active at a time.

## Stretch-Timer Feature

Stretch time is stored as a cumulative total per user, date, and stretch.

- Each stretch uses an open-ended Start/Stop stopwatch.
- Only one stopwatch can run at a time; starting another stops the active timer.
- Time remains unsaved until the user saves the Stretch Block.
- Reopening a date loads its saved totals and permits additional time.
- The Stretch Block shows today's cumulative time and the current week's total.
- `/dashboard/stretching` shows daily and weekly trends plus overall and per-stretch totals.

## Production Program

- Monday: hip-focused warmup, Hip PT, two strength supersets, calf/side-plank superset, shared core circuit, Daily Stretching.
- Tuesday, Wednesday, Friday: Recovery PT and Daily Stretching.
- Thursday: upper-body warmup, Hip PT, three Push/Pull A supersets, shared core circuit, Daily Stretching.
- Saturday: upper-body warmup, Hip PT, three Push/Pull B supersets, shared core circuit, Daily Stretching.
- Sunday: Cardio and Daily Stretching.
- Weeks 1–6 are intentionally identical. Week 7 uses the Week 6 prescription without program-level reductions.

## Current Artifacts

- `workout-program-planner.html` provides the interactive top-down visualization.
- This document is the durable record of confirmed decisions and open questions.

## Implementation Boundary

The application schema, timer UI, statistics UI, and account-scoped program installer are implemented in the repository. Database migration and installer execution remain explicit deployment operations; pushing application code alone does not mutate personalized program data.
