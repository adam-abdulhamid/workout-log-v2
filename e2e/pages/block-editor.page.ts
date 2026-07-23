import { type Page, type Locator, expect } from "@playwright/test";

export class BlockEditorPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly saveButton: Locator;
  readonly nameInput: Locator;
  readonly categorySelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly copyWeekButton: Locator;
  readonly addExerciseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator("button").filter({ has: page.locator("svg.lucide-arrow-left") });
    this.pageTitle = page.locator("h1").first();
    this.exportButton = page.getByRole("button", { name: /export/i });
    this.importButton = page.getByRole("button", { name: /import/i });
    this.saveButton = page.getByRole("button", { name: /save/i });
    this.nameInput = page.locator("#name");
    this.categorySelect = page.locator("#category");
    this.descriptionTextarea = page.locator("#description");
    this.copyWeekButton = page.locator("button").filter({ has: page.locator("svg.lucide-copy") });
    this.addExerciseButton = page.getByRole("button", { name: /add exercise/i });
  }

  async goto(blockId: string) {
    await this.page.goto(`/admin/blocks/${blockId}`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.nameInput).toBeVisible();
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL(/\/admin\/blocks$/);
  }

  // Block metadata
  async setName(name: string) {
    await this.nameInput.fill(name);
  }

  async setCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  async setDescription(description: string) {
    await this.descriptionTextarea.fill(description);
  }

  async getName(): Promise<string> {
    return (await this.nameInput.inputValue()) || "";
  }

  async getCategory(): Promise<string> {
    return (await this.categorySelect.inputValue()) || "";
  }

  // Week tabs
  getWeekTab(weekNumber: number): Locator {
    return this.page.getByRole("tab", { name: `Week ${weekNumber}` });
  }

  async switchToWeek(weekNumber: number) {
    await this.getWeekTab(weekNumber).click();
    await this.page.waitForTimeout(300); // Wait for tab transition
  }

  async getActiveWeek(): Promise<number> {
    for (let i = 1; i <= 6; i++) {
      const tab = this.getWeekTab(i);
      const isSelected = await tab.getAttribute("data-state");
      if (isSelected === "active") {
        return i;
      }
    }
    return 1;
  }

  // Week notes
  getWeekNotesTextarea(): Locator {
    return this.page.locator('textarea[placeholder*="Notes for this week"]');
  }

  async setWeekNotes(notes: string) {
    await this.getWeekNotesTextarea().fill(notes);
  }

  // Exercise management
  getExerciseRows(): Locator {
    return this.page.locator("tbody tr");
  }

  getExerciseNameInput(rowIndex: number): Locator {
    return this.getExerciseRows().nth(rowIndex).locator('input[placeholder="Exercise name"]');
  }

  getExerciseSetsInput(rowIndex: number): Locator {
    return this.getExerciseRows().nth(rowIndex).locator('input[type="number"]').first();
  }

  getExerciseRepsInput(rowIndex: number): Locator {
    return this.getExerciseRows().nth(rowIndex).locator('input[placeholder="8-10"]');
  }

  getExerciseTempoInput(rowIndex: number): Locator {
    return this.getExerciseRows().nth(rowIndex).locator('input[placeholder="3010"]');
  }

  getExerciseRestInput(rowIndex: number): Locator {
    return this.getExerciseRows().nth(rowIndex).locator('input[placeholder="2:00"]');
  }

  getExerciseDeleteButton(rowIndex: number): Locator {
    return this.getExerciseRows()
      .nth(rowIndex)
      .locator("button")
      .filter({ has: this.page.locator("svg.lucide-trash-2") });
  }

  async addExercise() {
    await this.addExerciseButton.click();
    await this.page.waitForTimeout(200);
  }

  async fillExercise(
    rowIndex: number,
    data: {
      name?: string;
      sets?: number;
      reps?: string;
      tempo?: string;
      rest?: string;
    }
  ) {
    if (data.name) {
      await this.getExerciseNameInput(rowIndex).fill(data.name);
    }
    if (data.sets !== undefined) {
      await this.getExerciseSetsInput(rowIndex).fill(String(data.sets));
    }
    if (data.reps) {
      await this.getExerciseRepsInput(rowIndex).fill(data.reps);
    }
    if (data.tempo) {
      await this.getExerciseTempoInput(rowIndex).fill(data.tempo);
    }
    if (data.rest) {
      await this.getExerciseRestInput(rowIndex).fill(data.rest);
    }
  }

  async deleteExercise(rowIndex: number) {
    await this.getExerciseDeleteButton(rowIndex).click();
    await this.page.waitForTimeout(200);
  }

  // Copy week dialog
  async openCopyWeekDialog() {
    await this.copyWeekButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  getCopyWeekDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  async selectWeekToCopy(weekNumber: number) {
    const dialog = this.getCopyWeekDialog();
    await dialog.getByRole("button", { name: String(weekNumber) }).click();
  }

  async confirmCopyWeek() {
    const dialog = this.getCopyWeekDialog();
    await dialog.getByRole("button", { name: /copy/i }).click();
    await expect(dialog).toBeHidden();
  }

  async cancelCopyWeek() {
    const dialog = this.getCopyWeekDialog();
    await dialog.getByRole("button", { name: /cancel/i }).click();
  }

  // Import dialog
  async openImportDialog() {
    await this.importButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  getImportDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  async pasteMarkdownAndImport(markdown: string) {
    const dialog = this.getImportDialog();
    await dialog.locator("textarea").fill(markdown);
    await dialog.getByRole("button", { name: /import/i }).click();
    await expect(dialog).toBeHidden();
  }

  // Actions
  async save() {
    await this.saveButton.click();
    // Wait for save to complete
    await this.page.waitForTimeout(1000);
  }

  async exportBlock() {
    await this.exportButton.click();
    // The export typically triggers a download or clipboard action
    await this.page.waitForTimeout(500);
  }

  async prepareForScreenshot() {
    await this.page.waitForTimeout(500);
  }
}
