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

// Feedback items to mark as fixed
const feedbackToFix = [
  { id: "0c6c8051-b19c-490d-8311-28f8797a03ff", description: "Block card hover highlighting" },
  { id: "ea8652c8-c17b-4dc9-858b-e193b5f6feff", description: "Weight tracker line thickness" },
  { id: "f7a419d5-b1ab-4632-a05b-67f62dd16d9d", description: "Block export failure" },
  { id: "f462d275-4f72-4ab2-837a-0632d1096e1c", description: "Block list formatting" },
  { id: "d8369a40-9813-471f-a91b-ece9b4ffdfa9", description: "Feedback toggle text cutoff" },
  { id: "011b4846-0149-4463-9148-c594d66e624d", description: "Weight tracker line thickness (duplicate)" },
];

async function main() {
  console.log("Updating feedback statuses to 'fixed'...\n");

  for (const item of feedbackToFix) {
    const [updated] = await db
      .update(schema.feedbackEntries)
      .set({ status: "fixed", updatedAt: new Date() })
      .where(eq(schema.feedbackEntries.id, item.id))
      .returning();

    if (updated) {
      console.log("Fixed: " + item.description + " (" + item.id.slice(0, 8) + ")");
    } else {
      console.log("Not found: " + item.id);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
