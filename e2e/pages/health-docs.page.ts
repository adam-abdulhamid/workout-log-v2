import { type Page, type Locator, expect } from "@playwright/test";
import * as path from "path";

export class HealthDocsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly titleInput: Locator;
  readonly dateInput: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly documentsLabel: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByText("Health Documents").first();
    this.titleInput = page.locator('input[placeholder*="DEXA Scan"]');
    this.dateInput = page.locator('input[type="date"]');
    this.fileInput = page.locator('input[type="file"][accept="application/pdf"]');
    this.uploadButton = page.getByRole("button", { name: /upload document/i });
    this.documentsLabel = page.getByText("Documents");
    this.loadingIndicator = page.getByText("Loading documents...");
    this.emptyState = page.getByText("No documents yet.");
    this.errorMessage = page.locator(".text-destructive");
  }

  async goto() {
    await this.page.goto("/dashboard/health-documents");
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
  }

  // Upload form
  async fillUploadForm(data: { title: string; date: string; filePath?: string }) {
    await this.titleInput.fill(data.title);
    await this.dateInput.fill(data.date);

    if (data.filePath) {
      await this.fileInput.setInputFiles(data.filePath);
    }
  }

  async uploadDocument(data: { title: string; date: string; filePath: string }) {
    await this.fillUploadForm(data);
    await this.uploadButton.click();
    await this.page.waitForTimeout(2000); // Wait for upload to complete
  }

  async isUploadButtonEnabled(): Promise<boolean> {
    return this.uploadButton.isEnabled();
  }

  // Document list
  getDocumentItems(): Locator {
    return this.page
      .locator("button.rounded-lg.border")
      .filter({ has: this.page.locator("svg.lucide-file-text") });
  }

  getDocumentButton(title: string): Locator {
    return this.page.locator("button.rounded-lg.border").filter({ hasText: title });
  }

  async hasDocuments(): Promise<boolean> {
    return !(await this.emptyState.isVisible());
  }

  async getDocumentCount(): Promise<number> {
    return this.getDocumentItems().count();
  }

  // Document viewer dialog
  async openDocument(title: string) {
    await this.getDocumentButton(title).click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  getDocumentDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  getDialogTitle(): Locator {
    return this.getDocumentDialog().locator("[class*='DialogTitle'], h2").first();
  }

  getDialogDownloadButton(): Locator {
    return this.getDocumentDialog()
      .locator("button")
      .filter({ has: this.page.locator("svg.lucide-download") });
  }

  getDialogDeleteButton(): Locator {
    return this.getDocumentDialog()
      .locator("button")
      .filter({ has: this.page.locator("svg.lucide-trash-2") });
  }

  getPdfIframe(): Locator {
    return this.getDocumentDialog().locator("iframe");
  }

  getMobilePdfFallback(): Locator {
    return this.getDocumentDialog().getByText("PDF may not display on mobile.");
  }

  getOpenPdfButton(): Locator {
    return this.getDocumentDialog().getByRole("button", { name: /open pdf/i });
  }

  async closeDialog() {
    // Click outside the dialog or press Escape
    await this.page.keyboard.press("Escape");
    await expect(this.getDocumentDialog()).toBeHidden();
  }

  async downloadDocument() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.getDialogDownloadButton().click();
    return downloadPromise;
  }

  async deleteDocument() {
    await this.getDialogDeleteButton().click();
    await this.page.waitForTimeout(1000); // Wait for deletion
    await expect(this.getDocumentDialog()).toBeHidden();
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
    await this.page.waitForTimeout(500);
  }
}
