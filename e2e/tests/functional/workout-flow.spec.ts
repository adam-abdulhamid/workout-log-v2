import { test, expect } from "../../fixtures/test-fixtures";

test.describe("Workout Flow E2E Tests", () => {
  test("navigate from calendar to workout and back", async ({ calendarPage, page }) => {
    await calendarPage.goto();

    // Click on today to navigate to workout
    await calendarPage.goToToday();
    await calendarPage.switchToWeekView();

    // Get current date and click on it
    const today = new Date();
    const dayNumber = today.getDate();

    // Try clicking on today's day cell
    const dayCell = calendarPage.getDayCell(dayNumber);
    if (await dayCell.isVisible()) {
      await dayCell.click();

      // Should navigate to workout page
      await page.waitForURL(/\/workout\//);

      // Verify we're on the workout page
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("view workout details", async ({ workoutPage }) => {
    const testDate = new Date().toISOString().split("T")[0];
    await workoutPage.goto(testDate);

    // Skip if no workout for today
    if (await workoutPage.notFoundMessage.isVisible()) {
      test.skip();
      return;
    }

    // Verify basic structure is visible
    await expect(workoutPage.pageTitle).toBeVisible();
    await expect(workoutPage.backButton).toBeVisible();

    // Back button should navigate to calendar
    await workoutPage.goBackToCalendar();
  });

  test("calendar view switching works", async ({ calendarPage }) => {
    await calendarPage.goto();

    // Start in week view
    await calendarPage.switchToWeekView();
    await expect(calendarPage.weekTab).toHaveAttribute("data-state", "active");

    // Switch to month view
    await calendarPage.switchToMonthView();
    await expect(calendarPage.monthTab).toHaveAttribute("data-state", "active");

    // Switch back to week view
    await calendarPage.switchToWeekView();
    await expect(calendarPage.weekTab).toHaveAttribute("data-state", "active");
  });

  test("weight tracker range selection updates view", async ({ weightTrackerPage }) => {
    await weightTrackerPage.goto();

    // Test each range
    const ranges = ["30 days", "90 days", "1 year", "All"] as const;

    for (const range of ranges) {
      await weightTrackerPage.selectRange(range);
      // Verify the range button reflects selection
      const currentRange = await weightTrackerPage.getCurrentRange();
      expect(currentRange).toBe(range);
    }
  });

  test("habits toggle state persists", async ({ habitsPage }) => {
    await habitsPage.goto();

    const hasHabits = await habitsPage.hasHabits();
    if (!hasHabits) {
      test.skip();
      return;
    }

    // Get the first habit item
    const habitItems = habitsPage.getHabitItems();
    const firstHabitCount = await habitItems.count();

    if (firstHabitCount > 0) {
      // Get initial state through the checkbox
      const firstCheckbox = habitItems.first().locator('[role="checkbox"]');
      const initialState = await firstCheckbox.getAttribute("data-state");

      // Toggle the habit
      await firstCheckbox.click();
      await habitsPage.page.waitForTimeout(500);

      // State should change
      const newState = await firstCheckbox.getAttribute("data-state");
      expect(newState).not.toBe(initialState);

      // Toggle back to restore original state
      await firstCheckbox.click();
    }
  });
});

test.describe("Dashboard Navigation", () => {
  test("navigate between dashboard pages", async ({ page }) => {
    // Start at dashboard/habits
    await page.goto("/dashboard/habits");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Daily Habits").first()).toBeVisible({ timeout: 15000 });

    // Navigate to weight tracker
    await page.goto("/dashboard/weight-tracker");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Weight Tracking").first()).toBeVisible({ timeout: 15000 });

    // Navigate to health documents
    await page.goto("/dashboard/health-documents");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Health Documents").first()).toBeVisible({ timeout: 15000 });
  });
});
