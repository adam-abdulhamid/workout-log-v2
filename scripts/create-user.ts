import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const result = await db.insert(users).values({
    clerkId: "user_38G4jOdD3MuMpppYrhsbdTzw6JF",
    email: "adam.m.abdulhamid@gmail.com",
  }).returning();

  console.log("User created:", result[0]);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
