import { test, expect } from "../../fixtures/test-fixtures";
import { saveScreenshot } from "../../fixtures/screenshot-helper";

test.describe("Health Documents Page", () => {
  test.beforeEach(async ({ healthDocsPage }) => {
    await healthDocsPage.goto();
  });

  test("default state", async ({ healthDocsPage, page }, testInfo) => {
    await healthDocsPage.prepareForScreenshot();

    // Verify key elements
    await expect(healthDocsPage.pageTitle).toBeVisible();
    await expect(healthDocsPage.uploadButton).toBeVisible();

    await saveScreenshot(page, testInfo, "health-docs-default");
  });

  test("upload form elements visible", async ({ healthDocsPage }) => {
    await expect(healthDocsPage.titleInput).toBeVisible();
    await expect(healthDocsPage.dateInput).toBeVisible();
    await expect(healthDocsPage.fileInput).toBeVisible();
    await expect(healthDocsPage.uploadButton).toBeVisible();
  });

  test("upload button disabled without required fields", async ({ healthDocsPage }) => {
    await expect(healthDocsPage.uploadButton).toBeDisabled();
  });

  test("documents list state", async ({ healthDocsPage, page }, testInfo) => {
    const hasDocuments = await healthDocsPage.hasDocuments();
    if (hasDocuments) {
      const count = await healthDocsPage.getDocumentCount();
      expect(count).toBeGreaterThan(0);
    } else {
      await expect(healthDocsPage.emptyState).toBeVisible();
    }

    await saveScreenshot(page, testInfo, "health-docs-list");
  });

  test("document dialog opens when clicked", async ({ healthDocsPage, page }, testInfo) => {
    const hasDocuments = await healthDocsPage.hasDocuments();
    if (!hasDocuments) {
      test.skip();
      return;
    }

    // Click the first document
    const firstDoc = healthDocsPage.getDocumentItems().first();
    await firstDoc.click();

    await expect(healthDocsPage.getDocumentDialog()).toBeVisible();
    await healthDocsPage.prepareForScreenshot();

    await saveScreenshot(page, testInfo, "health-docs-dialog");
  });
});
