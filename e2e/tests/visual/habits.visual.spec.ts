import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

test.describe("Habits Page", () => {
  test.beforeEach(async ({ habitsPage }) => {
    await habitsPage.goto();
  });

  test("default state", async ({ habitsPage, page }, testInfo) => {
    await habitsPage.prepareForScreenshot();

    // Verify key elements
    await expect(habitsPage.pageTitle).toBeVisible();
    await expect(habitsPage.manageButton).toBeVisible();

    await saveScreenshot(page, testInfo, "habits-default");
  });

  test("manage mode", async ({ habitsPage, page }, testInfo) => {
    await habitsPage.enterManageMode();
    await habitsPage.prepareForScreenshot();

    // Verify manage mode elements
    await expect(habitsPage.doneButton).toBeVisible();
    await expect(habitsPage.newHabitInput).toBeVisible();
    await expect(habitsPage.addHabitButton).toBeVisible();

    await saveScreenshot(page, testInfo, "habits-manage-mode");
  });

  test("manage button toggles mode", async ({ habitsPage }) => {
    await expect(habitsPage.manageButton).toBeVisible();

    await habitsPage.enterManageMode();
    await expect(habitsPage.doneButton).toBeVisible();

    await habitsPage.exitManageMode();
    await expect(habitsPage.manageButton).toBeVisible();
  });

  test("completion stats shown when habits exist", async ({ habitsPage }) => {
    const hasHabits = await habitsPage.hasHabits();
    if (hasHabits) {
      const stats = await habitsPage.getCompletionStats();
      expect(stats).not.toBeNull();
      if (stats) {
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.completed).toBeGreaterThanOrEqual(0);
        expect(stats.completed).toBeLessThanOrEqual(stats.total);
      }
    }
  });
});
