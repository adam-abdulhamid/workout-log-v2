import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

/**
 * Responsive tests that run across all viewport configurations (mobile, desktop, desktop-large).
 * Screenshots are saved for UI review.
 */

test.describe("Responsive Screenshots", () => {
  test("calendar page", async ({ calendarPage, page }, testInfo) => {
    await calendarPage.goto();
    await calendarPage.switchToWeekView();
    await calendarPage.prepareForScreenshot();

    // Verify page loaded
    await expect(calendarPage.weekTab).toBeVisible();

    await saveScreenshot(page, testInfo, "responsive-calendar");
  });

  test("weight tracker page", async ({ weightTrackerPage, page }, testInfo) => {
    await weightTrackerPage.goto();
    await weightTrackerPage.prepareForScreenshot();

    // Verify page loaded
    await expect(weightTrackerPage.pageTitle).toBeVisible();

    await saveScreenshot(page, testInfo, "responsive-weight-tracker");
  });

  test("habits page", async ({ habitsPage, page }, testInfo) => {
    await habitsPage.goto();
    await habitsPage.prepareForScreenshot();

    // Verify page loaded
    await expect(habitsPage.pageTitle).toBeVisible();

    await saveScreenshot(page, testInfo, "responsive-habits");
  });

  test("health documents page", async ({ healthDocsPage, page }, testInfo) => {
    await healthDocsPage.goto();
    await healthDocsPage.prepareForScreenshot();

    // Verify page loaded
    await expect(healthDocsPage.pageTitle).toBeVisible();

    await saveScreenshot(page, testInfo, "responsive-health-docs");
  });
});

test.describe("Mobile-specific UI", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!testInfo.project.name.includes("mobile")) {
      test.skip();
    }
  });

  test("navigation is compact", async ({ calendarPage }) => {
    await calendarPage.goto();
    await expect(calendarPage.prevButton).toBeVisible();
    await expect(calendarPage.nextButton).toBeVisible();
  });

  test("workout action bar is fixed at bottom", async ({ workoutPage, page }) => {
    const testDate = new Date().toISOString().split("T")[0];
    await workoutPage.goto(testDate);

    const isCompleted = await workoutPage.isCompleted();
    if (!isCompleted) {
      const saveButton = workoutPage.saveProgressButton;
      const box = await saveButton.boundingBox();
      const viewportSize = page.viewportSize();

      if (box && viewportSize) {
        // Button should be near the bottom of the viewport
        expect(box.y + box.height).toBeGreaterThan(viewportSize.height - 100);
      }
    }
  });
});

test.describe("Desktop-specific UI", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name.includes("mobile")) {
      test.skip();
    }
  });

  test("calendar shows day labels", async ({ calendarPage, page }) => {
    await calendarPage.goto();
    await calendarPage.switchToWeekView();
    await expect(page.getByText("Mon", { exact: true })).toBeVisible();
  });

  test("weight tracker chart has reasonable width", async ({ weightTrackerPage }) => {
    await weightTrackerPage.goto();

    const chartContainer = weightTrackerPage.chartContainer;
    if (await chartContainer.isVisible()) {
      const box = await chartContainer.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });
});
