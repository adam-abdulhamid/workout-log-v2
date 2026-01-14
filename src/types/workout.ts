/**
 * Workout Type Definitions
 *
 * Extended types used throughout the application for API responses,
 * component props, and business logic.
 */

// Types for the Workout Log application

// ============================================================================
// CALENDAR TYPES
// ============================================================================

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day: number;
  workoutName: string;
  completed: boolean;
  isDeload: boolean;
  prescriptionWeek: number;
  isToday?: boolean;
}

export interface CalendarWeek {
  weekStart: string;
  weekEnd: string;
  days: CalendarDay[];
}

// ============================================================================
// WORKOUT TYPES
// ============================================================================

export interface WorkoutExercise {
  id: string;
  order: number;
  name: string;
  sets: number | null;
  reps: string | null;
  tempo: string | null;
  rest: string | null;
  weightGuidance: string | null;
  notes: string | null;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  category: string | null;
  exercises: WorkoutExercise[];
  existingNote?: string | null;
}

export interface WorkoutData {
  date: string;
  dayName: string;
  dayNumber: number;
  prescriptionWeek: number;
  isDeload: boolean;
  isCompleted: boolean;
  blocks: WorkoutBlock[];
}

// ============================================================================
// EXERCISE LOG TYPES
// ============================================================================

export interface ExerciseLogEntry {
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  notes?: string | null;
}

export interface BlockNoteEntry {
  blockId: string;
  notes: string;
}

export interface WorkoutLogPayload {
  exercises: ExerciseLogEntry[];
  blockNotes: BlockNoteEntry[];
  completed: boolean;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

export interface ExerciseHistoryEntry {
  date: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  prescribed?: {
    name: string | null;
    sets: number | null;
    reps: string | null;
    tempo: string | null;
    rest: string | null;
  } | null;
}

// ============================================================================
// ADMIN TYPES - BLOCKS
// ============================================================================

export interface BlockSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  exerciseCount: number;
  daysUsed: string[];
  version: number;
  lastModified: string | null;
}

export interface BlockWeekData {
  weekNumber: number;
  id: string | null;
  notes: string | null;
  exercises: WorkoutExercise[];
}

export interface BlockDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  version: number;
  lastModified: string | null;
  weeks: BlockWeekData[];
  daysUsed: Array<{ dayNumber: number; name: string }>;
}

export interface CreateBlockPayload {
  name: string;
  description?: string;
  category?: string;
}

export interface UpdateBlockPayload {
  name?: string;
  description?: string;
  category?: string;
}

export interface UpdateWeekPayload {
  notes?: string;
  exercises?: Array<{
    id?: string;
    order: number;
    name: string;
    sets?: number | null;
    reps?: string | null;
    tempo?: string | null;
    rest?: string | null;
    weightGuidance?: string | null;
    notes?: string | null;
  }>;
  deletedExercises?: string[];
}

export interface CopyWeekPayload {
  sourceWeek: number;
  targetWeeks: number[];
}

// ============================================================================
// ADMIN TYPES - DAY TEMPLATES
// ============================================================================

export interface DayTemplateSummary {
  id: string;
  dayNumber: number;
  name: string;
  description: string | null;
  version: number;
  blocks: Array<{
    id: string;
    name: string;
    category: string | null;
    order: number;
  }>;
}

export interface DayTemplateDetail {
  id: string;
  dayNumber: number;
  name: string;
  description: string | null;
  version: number;
  blocks: Array<{
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    order: number;
  }>;
}

export interface UpdateDayTemplatePayload {
  name?: string;
  description?: string;
}

export interface UpdateDayBlocksPayload {
  blocks: Array<{
    id: string;
    order?: number;
  }>;
}

// ============================================================================
// CATEGORY OPTIONS
// ============================================================================

export const BLOCK_CATEGORIES = [
  "strength",
  "pt",
  "cardio",
  "mobility",
  "recovery",
  "rehabilitation",
  "power",
  "accessory",
] as const;

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
