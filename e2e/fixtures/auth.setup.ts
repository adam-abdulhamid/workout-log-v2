import { test as setup, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { clearScreenshots } from "./screenshot-helper";

const authDir = path.join(__dirname, "../.auth");
const authFile = path.join(authDir, "user.json");

setup("authenticate", async ({ page }) => {
  // Clear screenshots from previous run
  clearScreenshots();

  // Ensure auth directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Wait for Clerk to load
  await page.waitForSelector('[data-clerk-portal-root], input[name="identifier"]', {
    timeout: 10000,
  });

  // Fill in test credentials from environment variables
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables are required for authentication"
    );
  }

  // Enter email
  await page.fill('input[name="identifier"]', testEmail);
  await page.click('button[data-localization-key="formButtonPrimary"]');

  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });

  // Enter password
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[data-localization-key="formButtonPrimary"]');

  // Wait for redirect to /calendar after login
  await page.waitForURL('**/calendar', { timeout: 30000 });

  // Verify we're logged in by checking for the user menu button
  await expect(page.getByRole('button', { name: /open user menu/i })).toBeVisible({
    timeout: 10000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
