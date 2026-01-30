import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { desc, eq } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(neon(databaseUrl), { schema });

async function main() {
  const feedbackItems = await db
    .select({
      id: schema.feedbackEntries.id,
      description: schema.feedbackEntries.description,
      url: schema.feedbackEntries.url,
      status: schema.feedbackEntries.status,
      screenshotPreview: schema.feedbackEntries.screenshot,
      createdAt: schema.feedbackEntries.createdAt,
    })
    .from(schema.feedbackEntries)
    .where(eq(schema.feedbackEntries.status, "open"))
    .orderBy(desc(schema.feedbackEntries.createdAt));

  console.log("Found " + feedbackItems.length + " open feedback entries:\n");

  for (const item of feedbackItems) {
    console.log("─".repeat(60));
    console.log("ID: " + item.id);
    console.log("Status: " + item.status);
    console.log("URL: " + item.url);
    console.log("Description: " + (item.description || "(no description)"));
    console.log("Created: " + item.createdAt);

    // Show screenshot info (truncated base64)
    if (item.screenshotPreview) {
      const screenshotLen = item.screenshotPreview.length;
      console.log("Screenshot: " + screenshotLen + " chars (base64 encoded)");
      // Show image type from data URL prefix
      const match = item.screenshotPreview.match(/^data:([^;]+);/);
      if (match) {
        console.log("  Image type: " + match[1]);
      }
    }
    console.log();
  }
}

main().catch(console.error);
