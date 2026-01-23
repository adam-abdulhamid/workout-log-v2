import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { desc } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(neon(databaseUrl), { schema });

async function main() {
  const feedbackItems = await db
    .select()
    .from(schema.feedbackEntries)
    .orderBy(desc(schema.feedbackEntries.createdAt));

  const outputDir = "/tmp/feedback-screenshots";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Saving " + feedbackItems.length + " screenshots to " + outputDir + "\n");

  for (const item of feedbackItems) {
    const filename = "feedback-" + item.id.slice(0, 8) + ".png";
    const filepath = path.join(outputDir, filename);

    // Extract base64 data from data URL
    const base64Data = item.screenshot.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    fs.writeFileSync(filepath, buffer);

    console.log("─".repeat(60));
    console.log("ID: " + item.id);
    console.log("Status: " + item.status);
    console.log("URL: " + item.url);
    console.log("Description: " + (item.description || "(no description)"));
    console.log("Screenshot saved: " + filepath);
    console.log();
  }

  console.log("Done! Open screenshots with: open " + outputDir);
}

main().catch(console.error);
