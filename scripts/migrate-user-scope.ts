import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";

const USER_ID = "ef4ef366-beb8-4140-b5a1-26335c0d2812";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const sql = neon(databaseUrl);

  console.log("Starting migration to user-scoped blocks and day_templates...\n");

  // Step 1: Add nullable userId column to day_templates
  console.log("1. Adding user_id column to day_templates (nullable)...");
  try {
    await sql`ALTER TABLE day_templates ADD COLUMN IF NOT EXISTS user_id UUID`;
    console.log("   ✓ Added user_id column to day_templates");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ user_id column already exists in day_templates");
    } else {
      throw e;
    }
  }

  // Step 2: Add nullable userId column to blocks
  console.log("2. Adding user_id column to blocks (nullable)...");
  try {
    await sql`ALTER TABLE blocks ADD COLUMN IF NOT EXISTS user_id UUID`;
    console.log("   ✓ Added user_id column to blocks");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ user_id column already exists in blocks");
    } else {
      throw e;
    }
  }

  // Step 3: Update existing rows in day_templates with the user ID
  console.log("3. Updating existing day_templates with user_id...");
  const dayTemplatesResult = await sql`
    UPDATE day_templates
    SET user_id = ${USER_ID}::uuid
    WHERE user_id IS NULL
    RETURNING id
  `;
  console.log(`   ✓ Updated ${dayTemplatesResult.length} day_templates rows`);

  // Step 4: Update existing rows in blocks with the user ID
  console.log("4. Updating existing blocks with user_id...");
  const blocksResult = await sql`
    UPDATE blocks
    SET user_id = ${USER_ID}::uuid
    WHERE user_id IS NULL
    RETURNING id
  `;
  console.log(`   ✓ Updated ${blocksResult.length} blocks rows`);

  // Step 5: Drop old unique constraint on day_templates.day_number
  console.log("5. Dropping old unique constraint on day_templates.day_number...");
  try {
    await sql`ALTER TABLE day_templates DROP CONSTRAINT IF EXISTS day_templates_day_number_unique`;
    console.log("   ✓ Dropped day_templates_day_number_unique constraint");
  } catch (e) {
    console.log("   ✓ Constraint may not exist, continuing...");
  }

  // Step 6: Drop old unique constraint on blocks.name
  console.log("6. Dropping old unique constraint on blocks.name...");
  try {
    await sql`ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_name_unique`;
    console.log("   ✓ Dropped blocks_name_unique constraint");
  } catch (e) {
    console.log("   ✓ Constraint may not exist, continuing...");
  }

  // Step 7: Add foreign key constraint and NOT NULL to day_templates.user_id
  console.log("7. Adding NOT NULL and foreign key to day_templates.user_id...");
  await sql`ALTER TABLE day_templates ALTER COLUMN user_id SET NOT NULL`;
  try {
    await sql`
      ALTER TABLE day_templates
      ADD CONSTRAINT day_templates_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `;
    console.log("   ✓ Added foreign key constraint to day_templates");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ Foreign key already exists");
    } else {
      throw e;
    }
  }

  // Step 8: Add foreign key constraint and NOT NULL to blocks.user_id
  console.log("8. Adding NOT NULL and foreign key to blocks.user_id...");
  await sql`ALTER TABLE blocks ALTER COLUMN user_id SET NOT NULL`;
  try {
    await sql`
      ALTER TABLE blocks
      ADD CONSTRAINT blocks_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `;
    console.log("   ✓ Added foreign key constraint to blocks");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ Foreign key already exists");
    } else {
      throw e;
    }
  }

  // Step 9: Add new unique constraint on day_templates (user_id, day_number)
  console.log("9. Adding unique constraint on day_templates (user_id, day_number)...");
  try {
    await sql`
      ALTER TABLE day_templates
      ADD CONSTRAINT unique_user_day
      UNIQUE (user_id, day_number)
    `;
    console.log("   ✓ Added unique_user_day constraint");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ unique_user_day constraint already exists");
    } else {
      throw e;
    }
  }

  // Step 10: Add new unique constraint on blocks (user_id, name)
  console.log("10. Adding unique constraint on blocks (user_id, name)...");
  try {
    await sql`
      ALTER TABLE blocks
      ADD CONSTRAINT unique_user_block_name
      UNIQUE (user_id, name)
    `;
    console.log("   ✓ Added unique_user_block_name constraint");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes("already exists")) {
      console.log("   ✓ unique_user_block_name constraint already exists");
    } else {
      throw e;
    }
  }

  // Step 11: Add indexes
  console.log("11. Adding indexes...");
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_day_templates_user ON day_templates (user_id)`;
    console.log("   ✓ Added idx_day_templates_user index");
  } catch (e) {
    console.log("   ✓ Index may already exist");
  }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_blocks_user ON blocks (user_id)`;
    console.log("   ✓ Added idx_blocks_user index");
  } catch (e) {
    console.log("   ✓ Index may already exist");
  }

  console.log("\n✅ Migration completed successfully!");
  console.log(`   - day_templates now scoped to user ${USER_ID}`);
  console.log(`   - blocks now scoped to user ${USER_ID}`);

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
