# Workout Program Overhaul

## Purpose

Redesign the current rehabilitation-heavy weekly schedule around three primary lifting days, one dedicated cardio day, daily physical-therapy work, and a consistent daily stretching practice.

This document records the decisions made during planning. It is not yet an implementation specification for the production workout data.

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

The same four movements are performed every day:

1. Couch Stretch
2. 90/90 Glute Stretch with Slow Transitions
3. Back Rolling / T-Spine Stretching
4. World’s Greatest Stretch

Durations, sides, sets, and coaching notes have not yet been specified.

## Future Stretch-Timer Feature

The desired direction is a simple in-app timer for individual stretches, plus a place to review cumulative weekly stretching statistics.

Before implementation, the following requirements still need decisions:

- Whether each stretch uses a countdown target, an open-ended stopwatch, or both
- How unilateral stretches record left and right sides
- Whether pausing and resuming creates one effort or multiple efforts
- What marks a stretch or daily stretching block as complete
- Which weekly statistics matter: total time, time per stretch, days completed, adherence percentage, or streaks
- Where weekly statistics should appear in the application

No timer, tracking schema, API, or statistics UI has been implemented yet.

## Remaining Program Work

The next planning pass should define blocks in this order:

1. Hip-Focused Warmup
2. Leg PT
3. Leg Main Strength
4. Leg Strength Accessories
5. Leg Core
6. Upper Warmup and PT
7. Push/Pull A and B strength work
8. Push/Pull accessories and core
9. Recovery-day and cardio-day PT assignments

## Current Artifacts

- `workout-program-planner.html` provides the interactive top-down visualization.
- This document is the durable record of confirmed decisions and open questions.

## Implementation Boundary

The production database and application workout schedule remain unchanged. The plan should be confirmed at the exercise level before replacing the current live program.
