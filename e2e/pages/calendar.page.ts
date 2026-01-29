import { type Page, type Locator, expect } from "@playwright/test";

export class CalendarPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly todayButton: Locator;
  readonly weekTab: Locator;
  readonly monthTab: Locator;
  readonly dateRangeDisplay: Locator;
  readonly loadingIndicator: Locator;
  readonly legend: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "Workout Calendar" });
    this.prevButton = page.locator("button").filter({ has: page.locator("svg.lucide-chevron-left") });
    this.nextButton = page.locator("button").filter({ has: page.locator("svg.lucide-chevron-right") });
    this.todayButton = page.getByRole("button", { name: "Today" });
    this.weekTab = page.getByRole("tab", { name: "Week" });
    this.monthTab = page.getByRole("tab", { name: "Month" });
    this.dateRangeDisplay = page.locator("h2");
    this.loadingIndicator = page.getByText("Loading...");
    this.legend = page.locator(".flex.items-center.gap-4.text-xs");
  }

  async goto() {
    await this.page.goto("/calendar");
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
  }

  async switchToWeekView() {
    await this.weekTab.click();
    await this.waitForCalendarLoad();
  }

  async switchToMonthView() {
    await this.monthTab.click();
    await this.waitForCalendarLoad();
  }

  async goToPreviousWeek() {
    await this.prevButton.click();
    await this.waitForCalendarLoad();
  }

  async goToNextWeek() {
    await this.nextButton.click();
    await this.waitForCalendarLoad();
  }

  async goToToday() {
    await this.todayButton.click();
    await this.waitForCalendarLoad();
  }

  private async waitForCalendarLoad() {
    // Wait for loading indicator to disappear
    await this.page.waitForTimeout(100);
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
    // Give content time to render
    await this.page.waitForTimeout(500);
  }

  async waitForWeekContent(): Promise<boolean> {
    // Check if week view content loaded (date range h2 has text)
    try {
      await this.page.waitForFunction(
        () => {
          const h2 = document.querySelector("h2");
          return h2 && h2.textContent && h2.textContent.trim().length > 0;
        },
        { timeout: 5000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async clickDay(dayNumber: number) {
    // In week view, click on the day button
    const dayButton = this.page.locator(`button:has-text("${dayNumber}")`).first();
    await dayButton.click();
  }

  async getDateRangeText(): Promise<string> {
    const text = await this.dateRangeDisplay.textContent();
    return text?.trim() || "";
  }

  getDayCell(dayNumber: number): Locator {
    return this.page.locator(`button:has-text("${dayNumber}")`).first();
  }

  getCompletedDays(): Locator {
    // Days with filled completion dots
    return this.page.locator(".rounded-full.bg-primary");
  }

  getDeloadDays(): Locator {
    // Days with deload border styling
    return this.page.locator("[class*='border-accent']");
  }

  async prepareForScreenshot() {
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
    // Hide any dynamic date content if needed
    await this.page.evaluate(() => {
      // Optionally mask dynamic dates for consistent screenshots
    });
  }
}
