import { type Page, type Locator, expect } from "@playwright/test";

export class HabitsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly completionText: Locator;
  readonly manageButton: Locator;
  readonly doneButton: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;
  readonly newHabitInput: Locator;
  readonly addHabitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByText("Daily Habits").first();
    this.completionText = page.getByText(/of \d+ completed today/);
    this.manageButton = page.getByRole("button", { name: /manage/i });
    this.doneButton = page.getByRole("button", { name: /done/i });
    this.loadingIndicator = page.getByText("Loading habits...");
    this.emptyState = page.getByText("No habits yet. Add one below.");
    this.newHabitInput = page.locator('input[placeholder="New habit name..."]');
    this.addHabitButton = page.getByRole("button", { name: /add/i });
    this.errorMessage = page.locator(".text-destructive");
  }

  async goto() {
    await this.page.goto("/dashboard/habits");
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
  }

  // Manage mode
  async enterManageMode() {
    if (await this.manageButton.isVisible()) {
      await this.manageButton.click();
      await expect(this.doneButton).toBeVisible();
    }
  }

  async exitManageMode() {
    if (await this.doneButton.isVisible()) {
      await this.doneButton.click();
      await expect(this.manageButton).toBeVisible();
    }
  }

  async isInManageMode(): Promise<boolean> {
    return this.doneButton.isVisible();
  }

  // Habits
  getHabitItems(): Locator {
    return this.page.locator(".rounded-lg.border").filter({ has: this.page.locator('[role="checkbox"]') });
  }

  getHabitCheckbox(habitName: string): Locator {
    return this.page
      .locator(".rounded-lg.border")
      .filter({ hasText: habitName })
      .locator('[role="checkbox"]');
  }

  getHabitLabel(habitName: string): Locator {
    return this.page
      .locator(".rounded-lg.border")
      .filter({ hasText: habitName })
      .locator("label, span")
      .filter({ hasText: habitName });
  }

  getHabitEditButton(habitName: string): Locator {
    return this.page
      .locator(".rounded-lg.border")
      .filter({ hasText: habitName })
      .locator("button")
      .filter({ has: this.page.locator("svg.lucide-pencil") });
  }

  getHabitDeleteButton(habitName: string): Locator {
    return this.page
      .locator(".rounded-lg.border")
      .filter({ hasText: habitName })
      .locator("button")
      .filter({ has: this.page.locator("svg.lucide-trash-2") });
  }

  async toggleHabit(habitName: string) {
    await this.getHabitCheckbox(habitName).click();
    await this.page.waitForTimeout(500); // Wait for state update
  }

  async isHabitCompleted(habitName: string): Promise<boolean> {
    const checkbox = this.getHabitCheckbox(habitName);
    const state = await checkbox.getAttribute("data-state");
    return state === "checked";
  }

  // Add habit
  async addHabit(name: string) {
    // Make sure we're in manage mode
    if (!(await this.isInManageMode())) {
      await this.enterManageMode();
    }
    await this.newHabitInput.fill(name);
    await this.addHabitButton.click();
    await this.page.waitForTimeout(500); // Wait for save
  }

  // Edit habit
  async editHabit(oldName: string, newName: string) {
    if (!(await this.isInManageMode())) {
      await this.enterManageMode();
    }
    await this.getHabitEditButton(oldName).click();
    await expect(this.page.getByRole("dialog")).toBeVisible();

    const dialog = this.page.getByRole("dialog");
    await dialog.locator("input").fill(newName);
    await dialog.getByRole("button", { name: /save/i }).click();
    await expect(dialog).toBeHidden();
  }

  // Delete habit
  async deleteHabit(habitName: string) {
    if (!(await this.isInManageMode())) {
      await this.enterManageMode();
    }
    await this.getHabitDeleteButton(habitName).click();
    await this.page.waitForTimeout(500); // Wait for delete
  }

  // Stats
  async getCompletionStats(): Promise<{ completed: number; total: number } | null> {
    const text = await this.completionText.textContent();
    if (!text) return null;

    const match = text.match(/(\d+) of (\d+)/);
    if (match) {
      return {
        completed: parseInt(match[1], 10),
        total: parseInt(match[2], 10),
      };
    }
    return null;
  }

  async hasHabits(): Promise<boolean> {
    return !(await this.emptyState.isVisible());
  }

  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async prepareForScreenshot() {
    await this.page.waitForTimeout(500);
  }
}
