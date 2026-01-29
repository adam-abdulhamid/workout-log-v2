import { Page, TestInfo } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "../screenshots");

/**
 * Saves a screenshot to both:
 * 1. The persistent screenshots directory (e2e/screenshots/{viewport}/{name}.png)
 * 2. The test report as an attachment
 *
 * The screenshots directory is overwritten on each test run.
 */
export async function saveScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  const viewport = testInfo.project.name; // e.g., "mobile-chrome", "desktop-chrome"
  const viewportDir = path.join(SCREENSHOTS_DIR, viewport);

  // Ensure directory exists
  if (!fs.existsSync(viewportDir)) {
    fs.mkdirSync(viewportDir, { recursive: true });
  }

  const filePath = path.join(viewportDir, `${name}.png`);

  // Take and save screenshot to disk
  await page.screenshot({ path: filePath, fullPage: true });

  // Also attach to test report
  const screenshot = fs.readFileSync(filePath);
  await testInfo.attach(name, { body: screenshot, contentType: "image/png" });
}

/**
 * Clears all screenshots from previous runs.
 * Call this once at the start of the test suite.
 */
export function clearScreenshots(): void {
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    fs.rmSync(SCREENSHOTS_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
