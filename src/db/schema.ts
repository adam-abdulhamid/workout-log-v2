import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  date,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workoutLogs: many(workoutLogs),
  weightEntries: many(weightEntries),
  injuryEntries: many(injuryEntries),
}));

// ============================================================================
// DAY TEMPLATES (7 days of the week)
// ============================================================================

export const dayTemplates = pgTable("day_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayNumber: integer("day_number").notNull().unique(), // 1-7 for Mon-Sun
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").default(1).notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const dayTemplatesRelations = relations(dayTemplates, ({ many }) => ({
  blockAssignments: many(dayTemplateBlocks),
  workoutLogs: many(workoutLogs),
}));

// ============================================================================
// BLOCKS (Reusable workout components)
// ============================================================================

export const blocks = pgTable("blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"), // strength, pt, cardio, mobility, recovery, rehabilitation, power, accessory
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const blocksRelations = relations(blocks, ({ many }) => ({
  weeks: many(blockWeeks),
  dayAssignments: many(dayTemplateBlocks),
  noteLogs: many(blockNoteLogs),
}));

// ============================================================================
// DAY TEMPLATE BLOCKS (Junction table: which blocks are assigned to which day)
// ============================================================================

export const dayTemplateBlocks = pgTable(
  "day_template_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dayTemplateId: uuid("day_template_id")
      .notNull()
      .references(() => dayTemplates.id, { onDelete: "cascade" }),
    blockId: uuid("block_id")
      .notNull()
      .references(() => blocks.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
  },
  (table) => [unique("unique_day_block").on(table.dayTemplateId, table.blockId)]
);

export const dayTemplateBlocksRelations = relations(
  dayTemplateBlocks,
  ({ one }) => ({
    dayTemplate: one(dayTemplates, {
      fields: [dayTemplateBlocks.dayTemplateId],
      references: [dayTemplates.id],
    }),
    block: one(blocks, {
      fields: [dayTemplateBlocks.blockId],
      references: [blocks.id],
    }),
  })
);

// ============================================================================
// BLOCK WEEKS (6 weeks of progression per block)
// ============================================================================

export const blockWeeks = pgTable(
  "block_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockId: uuid("block_id")
      .notNull()
      .references(() => blocks.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(), // 1-6
    notes: text("notes"),
  },
  (table) => [unique("unique_block_week").on(table.blockId, table.weekNumber)]
);

export const blockWeeksRelations = relations(blockWeeks, ({ one, many }) => ({
  block: one(blocks, {
    fields: [blockWeeks.blockId],
    references: [blocks.id],
  }),
  exercises: many(blockWeekExercises),
}));

// ============================================================================
// BLOCK WEEK EXERCISES (Exercise prescriptions for each week)
// ============================================================================

export const blockWeekExercises = pgTable("block_week_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockWeekId: uuid("block_week_id")
    .notNull()
    .references(() => blockWeeks.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: text("reps"), // String to support ranges like "6-8"
  tempo: text("tempo"), // e.g., "3010"
  rest: text("rest"), // e.g., "2:00-3:00"
  weightGuidance: text("weight_guidance"), // e.g., "RPE 7", "+5lb from week 3"
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const blockWeekExercisesRelations = relations(
  blockWeekExercises,
  ({ one, many }) => ({
    blockWeek: one(blockWeeks, {
      fields: [blockWeekExercises.blockWeekId],
      references: [blockWeeks.id],
    }),
    exerciseLogs: many(exerciseLogs),
    snapshots: many(exerciseSnapshots),
  })
);

// ============================================================================
// WORKOUT LOGS (Daily workout session records)
// ============================================================================

export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  dayTemplateId: uuid("day_template_id").references(() => dayTemplates.id),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workoutLogsRelations = relations(workoutLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutLogs.userId],
    references: [users.id],
  }),
  dayTemplate: one(dayTemplates, {
    fields: [workoutLogs.dayTemplateId],
    references: [dayTemplates.id],
  }),
  exerciseLogs: many(exerciseLogs),
  blockNoteLogs: many(blockNoteLogs),
}));

// ============================================================================
// WEIGHT ENTRIES
// ============================================================================

export const weightEntries = pgTable("weight_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  weightLb: real("weight_lb").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  user: one(users, {
    fields: [weightEntries.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// INJURY ENTRIES
// ============================================================================

export const injuryEntries = pgTable("injury_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const injuryEntriesRelations = relations(injuryEntries, ({ one }) => ({
  user: one(users, {
    fields: [injuryEntries.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// EXERCISE LOGS (Individual set performance)
// ============================================================================

export const exerciseLogs = pgTable("exercise_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutLogId: uuid("workout_log_id")
    .notNull()
    .references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => blockWeekExercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"),
  notes: text("notes"),
});

export const exerciseLogsRelations = relations(exerciseLogs, ({ one }) => ({
  workoutLog: one(workoutLogs, {
    fields: [exerciseLogs.workoutLogId],
    references: [workoutLogs.id],
  }),
  exercise: one(blockWeekExercises, {
    fields: [exerciseLogs.exerciseId],
    references: [blockWeekExercises.id],
  }),
}));

// ============================================================================
// BLOCK NOTE LOGS (Per-block session notes)
// ============================================================================

export const blockNoteLogs = pgTable("block_note_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutLogId: uuid("workout_log_id")
    .notNull()
    .references(() => workoutLogs.id, { onDelete: "cascade" }),
  blockId: uuid("block_id")
    .notNull()
    .references(() => blocks.id, { onDelete: "cascade" }),
  notes: text("notes"),
});

export const blockNoteLogsRelations = relations(blockNoteLogs, ({ one }) => ({
  workoutLog: one(workoutLogs, {
    fields: [blockNoteLogs.workoutLogId],
    references: [workoutLogs.id],
  }),
  block: one(blocks, {
    fields: [blockNoteLogs.blockId],
    references: [blocks.id],
  }),
}));

// ============================================================================
// EXERCISE SNAPSHOTS (Historical preservation of exercise definitions)
// ============================================================================

export const exerciseSnapshots = pgTable("exercise_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseLogId: uuid("exercise_log_id")
    .notNull()
    .references(() => exerciseLogs.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull(), // Original exercise ID at time of logging
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: text("reps"),
  tempo: text("tempo"),
  rest: text("rest"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exerciseSnapshotsRelations = relations(
  exerciseSnapshots,
  ({ one }) => ({
    exerciseLog: one(exerciseLogs, {
      fields: [exerciseSnapshots.exerciseLogId],
      references: [exerciseLogs.id],
    }),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type DayTemplate = typeof dayTemplates.$inferSelect;
export type NewDayTemplate = typeof dayTemplates.$inferInsert;

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;

export type DayTemplateBlock = typeof dayTemplateBlocks.$inferSelect;
export type NewDayTemplateBlock = typeof dayTemplateBlocks.$inferInsert;

export type BlockWeek = typeof blockWeeks.$inferSelect;
export type NewBlockWeek = typeof blockWeeks.$inferInsert;

export type BlockWeekExercise = typeof blockWeekExercises.$inferSelect;
export type NewBlockWeekExercise = typeof blockWeekExercises.$inferInsert;

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type NewWorkoutLog = typeof workoutLogs.$inferInsert;

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type NewExerciseLog = typeof exerciseLogs.$inferInsert;

export type BlockNoteLog = typeof blockNoteLogs.$inferSelect;
export type NewBlockNoteLog = typeof blockNoteLogs.$inferInsert;

export type ExerciseSnapshot = typeof exerciseSnapshots.$inferSelect;
export type NewExerciseSnapshot = typeof exerciseSnapshots.$inferInsert;

export type InjuryEntry = typeof injuryEntries.$inferSelect;
export type NewInjuryEntry = typeof injuryEntries.$inferInsert;
