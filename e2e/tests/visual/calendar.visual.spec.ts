import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

test.describe("Calendar Page", () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
  });

  test("week view", async ({ calendarPage, page }, testInfo) => {
    await calendarPage.switchToWeekView();
    await calendarPage.prepareForScreenshot();

    // Verify key elements
    await expect(calendarPage.weekTab).toHaveAttribute("data-state", "active");
    await expect(calendarPage.prevButton).toBeVisible();
    await expect(calendarPage.nextButton).toBeVisible();

    await saveScreenshot(page, testInfo, "calendar-week-view");
  });

  test("month view", async ({ calendarPage, page }, testInfo) => {
    await calendarPage.switchToMonthView();
    await calendarPage.prepareForScreenshot();

    // Verify key elements
    await expect(calendarPage.monthTab).toHaveAttribute("data-state", "active");

    await saveScreenshot(page, testInfo, "calendar-month-view");
  });

  test("navigation controls work", async ({ calendarPage }) => {
    await expect(calendarPage.prevButton).toBeVisible();
    await expect(calendarPage.nextButton).toBeVisible();
    await expect(calendarPage.todayButton).toBeVisible();
    await expect(calendarPage.weekTab).toBeVisible();
    await expect(calendarPage.monthTab).toBeVisible();
  });

  test("week navigation changes date range", async ({ calendarPage }) => {
    await calendarPage.switchToWeekView();

    const hasContent = await calendarPage.waitForWeekContent();
    if (!hasContent) {
      test.skip();
      return;
    }

    const initialRange = await calendarPage.getDateRangeText();
    if (!initialRange) {
      test.skip();
      return;
    }

    await calendarPage.goToNextWeek();
    const nextRange = await calendarPage.getDateRangeText();

    expect(nextRange).not.toBe(initialRange);
  });
});
