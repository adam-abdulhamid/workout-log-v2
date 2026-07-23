import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

test.describe("Workout Page", () => {
  test("today's workout", async ({ workoutPage, page }, testInfo) => {
    const testDate = new Date().toISOString().split("T")[0];
    await workoutPage.goto(testDate);

    await workoutPage.prepareForScreenshot();

    // Verify key elements
    await expect(workoutPage.pageTitle).toBeVisible();
    await expect(workoutPage.backButton).toBeVisible();

    await saveScreenshot(page, testInfo, "workout-today");
  });

  test("past date workout", async ({ workoutPage, page }, testInfo) => {
    // Use a past date - the app shows workouts for any date based on cycle
    await workoutPage.goto("2024-01-15");
    await workoutPage.prepareForScreenshot();

    // Verify page loaded with workout template
    await expect(workoutPage.pageTitle).toBeVisible();
    await expect(workoutPage.backButton).toBeVisible();

    await saveScreenshot(page, testInfo, "workout-past-date");
  });

  test("header elements visible", async ({ workoutPage }) => {
    const testDate = new Date().toISOString().split("T")[0];
    await workoutPage.goto(testDate);

    await expect(workoutPage.backButton).toBeVisible();
    await expect(workoutPage.pageTitle).toBeVisible();
  });

  test("action bar visible when not completed", async ({ workoutPage }) => {
    const testDate = new Date().toISOString().split("T")[0];
    await workoutPage.goto(testDate);

    const isCompleted = await workoutPage.isCompleted();
    if (!isCompleted) {
      await expect(workoutPage.saveProgressButton).toBeVisible();
      await expect(workoutPage.markCompleteButton).toBeVisible();
    }
  });
});
