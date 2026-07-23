import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(neon(databaseUrl), { schema });

async function main() {
  const ids = process.argv.slice(2);

  if (ids.length === 0) {
    console.error("Usage: npx tsx scripts/fix-feedback.ts <id1> [id2] [id3] ...");
    console.error("Example: npx tsx scripts/fix-feedback.ts 743bc550-50b3-4e3d-932e-8eebbf186eae");
    process.exit(1);
  }

  console.log(`Marking ${ids.length} feedback item(s) as fixed...\n`);

  for (const id of ids) {
    const [updated] = await db
      .update(schema.feedbackEntries)
      .set({ status: "fixed", updatedAt: new Date() })
      .where(eq(schema.feedbackEntries.id, id))
      .returning({ id: schema.feedbackEntries.id, description: schema.feedbackEntries.description });

    if (updated) {
      console.log(`✓ Fixed: ${updated.description || "(no description)"} (${id.slice(0, 8)})`);
    } else {
      console.log(`✗ Not found: ${id}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
