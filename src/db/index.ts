import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// During build time, DATABASE_URL may not be available. We use a proxy that
// throws only when the db is actually accessed, allowing the build to complete.
export const db: DrizzleDB = databaseUrl
  ? drizzle(neon(databaseUrl), { schema })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error("DATABASE_URL environment variable is not set");
        },
      },
    ) as DrizzleDB);

export type Database = typeof db;
