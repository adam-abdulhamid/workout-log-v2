import { type Page, type Locator, expect } from "@playwright/test";

export class WorkoutPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly dateSubtitle: Locator;
  readonly deloadBadge: Locator;
  readonly completedBadge: Locator;
  readonly editButton: Locator;
  readonly saveProgressButton: Locator;
  readonly markCompleteButton: Locator;
  readonly loadingIndicator: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator("button").filter({ has: page.locator("svg.lucide-arrow-left") });
    this.pageTitle = page.locator("h1").first();
    this.dateSubtitle = page.locator("p.text-muted-foreground").first();
    this.deloadBadge = page.getByText("Deload Week");
    this.completedBadge = page.getByText("Completed").first();
    this.editButton = page.getByRole("button", { name: /edit/i });
    this.saveProgressButton = page.getByRole("button", { name: /save progress/i });
    this.markCompleteButton = page.getByRole("button", { name: /mark complete/i });
    this.loadingIndicator = page.getByText("Loading workout...");
    this.notFoundMessage = page.getByText("Workout not found for this date.");
  }

  async goto(date: string) {
    await this.page.goto(`/workout/${date}`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 15000 });
    // Wait for either title or not found message
    await expect(this.pageTitle.or(this.notFoundMessage)).toBeVisible({ timeout: 10000 });
  }

  async goBackToCalendar() {
    await this.backButton.click();
    await this.page.waitForURL(/\/calendar/);
  }

  // Block management
  getBlock(blockName: string): Locator {
    return this.page.locator(`[role="button"]:has-text("${blockName}")`).first();
  }

  getBlockCollapsibleTrigger(blockName: string): Locator {
    return this.page
      .locator("[data-slot='card']")
      .filter({ hasText: blockName })
      .locator("button")
      .first();
  }

  async expandBlock(blockName: string) {
    const block = this.getBlockCollapsibleTrigger(blockName);
    const isExpanded = await block.locator("svg.lucide-chevron-down").isVisible();
    if (!isExpanded) {
      await block.click();
      await this.page.waitForTimeout(300);
    }
  }

  async collapseBlock(blockName: string) {
    const block = this.getBlockCollapsibleTrigger(blockName);
    const isExpanded = await block.locator("svg.lucide-chevron-down").isVisible();
    if (isExpanded) {
      await block.click();
      await this.page.waitForTimeout(300);
    }
  }

  // Exercise management
  getExerciseRow(exerciseName: string): Locator {
    return this.page.locator("div").filter({ hasText: exerciseName }).first();
  }

  getHistoryButton(exerciseName: string): Locator {
    return this.getExerciseRow(exerciseName).getByRole("button", { name: /history/i });
  }

  // Set inputs
  getSetInputs(exerciseName: string): {
    repsInputs: Locator;
    weightInputs: Locator;
  } {
    const exerciseSection = this.page.locator("div").filter({ hasText: exerciseName });
    return {
      repsInputs: exerciseSection.locator('input[placeholder="Reps"]'),
      weightInputs: exerciseSection.locator('input[placeholder="lbs"]'),
    };
  }

  async fillSetInput(exerciseName: string, setIndex: number, reps: number, weight: number) {
    const { repsInputs, weightInputs } = this.getSetInputs(exerciseName);
    await repsInputs.nth(setIndex).fill(String(reps));
    await weightInputs.nth(setIndex).fill(String(weight));
  }

  // Block notes
  getBlockNotesTextarea(blockName: string): Locator {
    return this.page
      .locator("[data-slot='card']")
      .filter({ hasText: blockName })
      .locator('textarea[placeholder*="notes"]');
  }

  async fillBlockNotes(blockName: string, notes: string) {
    const textarea = this.getBlockNotesTextarea(blockName);
    await textarea.fill(notes);
  }

  // Actions
  async saveProgress() {
    await this.saveProgressButton.click();
    await this.page.waitForTimeout(1000); // Wait for save
  }

  async markComplete() {
    await this.markCompleteButton.click();
    await expect(this.completedBadge).toBeVisible({ timeout: 5000 });
  }

  async enableEditing() {
    if (await this.editButton.isVisible()) {
      await this.editButton.click();
    }
  }

  // Status checks
  async isCompleted(): Promise<boolean> {
    return this.completedBadge.isVisible();
  }

  async isDeload(): Promise<boolean> {
    return this.deloadBadge.isVisible();
  }

  async prepareForScreenshot() {
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
    // Expand all blocks for full view
  }
}
