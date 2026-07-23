import { type Page, type Locator, expect } from "@playwright/test";

export class WeightTrackerPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly weightInput: Locator;
  readonly lbButton: Locator;
  readonly kgButton: Locator;
  readonly logWeighInButton: Locator;
  readonly latestWeighInText: Locator;
  readonly errorMessage: Locator;
  readonly chartContainer: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByText("Weight Tracking").first();
    this.weightInput = page.locator('input[type="number"]').first();
    this.lbButton = page.getByRole("button", { name: "lb", exact: true });
    this.kgButton = page.getByRole("button", { name: "kg", exact: true });
    this.logWeighInButton = page.getByRole("button", { name: /log weigh-in/i });
    this.latestWeighInText = page.getByText(/Latest:/);
    this.errorMessage = page.locator(".text-destructive");
    this.chartContainer = page.locator(".rounded-lg.border").filter({ has: page.locator("svg") });
    this.loadingIndicator = page.getByText("Loading...");
  }

  async goto() {
    await this.page.goto("/dashboard/weight-tracker");
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  // Unit selection
  async selectLb() {
    await this.lbButton.click();
  }

  async selectKg() {
    await this.kgButton.click();
  }

  async getCurrentUnit(): Promise<"lb" | "kg"> {
    // The selected button has bg-card styling
    const lbSelected = await this.lbButton.evaluate((el) =>
      el.classList.contains("bg-card")
    );
    return lbSelected ? "lb" : "kg";
  }

  // Weight entry
  async enterWeight(weight: number) {
    await this.weightInput.fill(String(weight));
  }

  async logWeighIn(weight: number, unit?: "lb" | "kg") {
    if (unit === "kg") {
      await this.selectKg();
    } else if (unit === "lb") {
      await this.selectLb();
    }
    await this.enterWeight(weight);
    await this.logWeighInButton.click();
    await this.page.waitForTimeout(1000); // Wait for save
  }

  async getLatestWeighIn(): Promise<string | null> {
    if (await this.latestWeighInText.isVisible()) {
      return this.latestWeighInText.textContent();
    }
    return null;
  }

  // Range selection
  getRangeButton(range: "30 days" | "90 days" | "1 year" | "All"): Locator {
    return this.page.getByRole("button", { name: range, exact: true });
  }

  async selectRange(range: "30 days" | "90 days" | "1 year" | "All") {
    await this.getRangeButton(range).click();
    await this.page.waitForTimeout(300); // Wait for chart update
  }

  async getCurrentRange(): Promise<string> {
    const ranges = ["30 days", "90 days", "1 year", "All"] as const;
    for (const range of ranges) {
      const button = this.getRangeButton(range);
      const isSelected = await button.evaluate((el) =>
        el.classList.contains("bg-card")
      );
      if (isSelected) {
        return range;
      }
    }
    return "30 days";
  }

  // Chart
  async isChartVisible(): Promise<boolean> {
    return this.chartContainer.isVisible();
  }

  async waitForChartLoad() {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
    // Wait for chart SVG to be rendered
    await this.page.waitForTimeout(500);
  }

  // Error handling
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return this.errorMessage.textContent();
    }
    return null;
  }

  async prepareForScreenshot() {
    await this.waitForChartLoad();
    await this.page.waitForTimeout(500);
  }
}
