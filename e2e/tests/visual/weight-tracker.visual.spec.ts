import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

test.describe("Weight Tracker Page", () => {
  test.beforeEach(async ({ weightTrackerPage }) => {
    await weightTrackerPage.goto();
  });

  test("default state", async ({ weightTrackerPage, page }, testInfo) => {
    await weightTrackerPage.prepareForScreenshot();

    // Verify key elements
    await expect(weightTrackerPage.pageTitle).toBeVisible();
    await expect(weightTrackerPage.weightInput).toBeVisible();
    await expect(weightTrackerPage.logWeighInButton).toBeVisible();

    await saveScreenshot(page, testInfo, "weight-tracker-default");
  });

  test("30 day range", async ({ weightTrackerPage, page }, testInfo) => {
    await weightTrackerPage.selectRange("30 days");
    await weightTrackerPage.prepareForScreenshot();

    // Verify range is selected
    expect(await weightTrackerPage.getCurrentRange()).toBe("30 days");

    await saveScreenshot(page, testInfo, "weight-tracker-30-days");
  });

  test("90 day range", async ({ weightTrackerPage, page }, testInfo) => {
    await weightTrackerPage.selectRange("90 days");
    await weightTrackerPage.prepareForScreenshot();

    // Verify range is selected
    expect(await weightTrackerPage.getCurrentRange()).toBe("90 days");

    await saveScreenshot(page, testInfo, "weight-tracker-90-days");
  });

  test("all time range", async ({ weightTrackerPage, page }, testInfo) => {
    await weightTrackerPage.selectRange("All");
    await weightTrackerPage.prepareForScreenshot();

    // Verify range is selected
    expect(await weightTrackerPage.getCurrentRange()).toBe("All");

    await saveScreenshot(page, testInfo, "weight-tracker-all-time");
  });

  test("unit toggle switches between lb and kg", async ({ weightTrackerPage }) => {
    await weightTrackerPage.selectLb();
    expect(await weightTrackerPage.getCurrentUnit()).toBe("lb");

    await weightTrackerPage.selectKg();
    expect(await weightTrackerPage.getCurrentUnit()).toBe("kg");
  });

  test("input field accepts weight values", async ({ weightTrackerPage }) => {
    await weightTrackerPage.enterWeight(180.5);
    const value = await weightTrackerPage.weightInput.inputValue();
    expect(value).toBe("180.5");
  });
});
