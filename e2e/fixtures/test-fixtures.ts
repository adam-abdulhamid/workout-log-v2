import { test as base } from "@playwright/test";
import { CalendarPage } from "../pages/calendar.page";
import { WorkoutPage } from "../pages/workout.page";
import { BlockEditorPage } from "../pages/block-editor.page";
import { WeightTrackerPage } from "../pages/weight-tracker.page";
import { HabitsPage } from "../pages/habits.page";
import { HealthDocsPage } from "../pages/health-docs.page";

type TestFixtures = {
  calendarPage: CalendarPage;
  workoutPage: WorkoutPage;
  blockEditorPage: BlockEditorPage;
  weightTrackerPage: WeightTrackerPage;
  habitsPage: HabitsPage;
  healthDocsPage: HealthDocsPage;
};

export const test = base.extend<TestFixtures>({
  calendarPage: async ({ page }, use) => {
    const calendarPage = new CalendarPage(page);
    await use(calendarPage);
  },

  workoutPage: async ({ page }, use) => {
    const workoutPage = new WorkoutPage(page);
    await use(workoutPage);
  },

  blockEditorPage: async ({ page }, use) => {
    const blockEditorPage = new BlockEditorPage(page);
    await use(blockEditorPage);
  },

  weightTrackerPage: async ({ page }, use) => {
    const weightTrackerPage = new WeightTrackerPage(page);
    await use(weightTrackerPage);
  },

  habitsPage: async ({ page }, use) => {
    const habitsPage = new HabitsPage(page);
    await use(habitsPage);
  },

  healthDocsPage: async ({ page }, use) => {
    const healthDocsPage = new HealthDocsPage(page);
    await use(healthDocsPage);
  },
});

export { expect } from "@playwright/test";
