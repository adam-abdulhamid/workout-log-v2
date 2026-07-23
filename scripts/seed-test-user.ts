import dotenv from "dotenv";
dotenv.config();

import { clerkClient } from "@clerk/nextjs/server";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function seedTestUser() {
  const testEmail = process.env.E2E_TEST_EMAIL;

  if (!testEmail) {
    console.error("Missing E2E_TEST_EMAIL in environment");
    process.exit(1);
  }

  console.log(`Looking up test user: ${testEmail}`);

  // Find user in Clerk by email
  const client = await clerkClient();
  const clerkUsers = await client.users.getUserList({
    emailAddress: [testEmail],
  });

  if (clerkUsers.data.length === 0) {
    console.error(`No Clerk user found with email: ${testEmail}`);
    process.exit(1);
  }

  const clerkUser = clerkUsers.data[0];
  console.log(`Found Clerk user: ${clerkUser.id}`);

  // Insert into database
  await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email: testEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    })
    .onConflictDoNothing();

  console.log("Test user seeded successfully");
  process.exit(0);
}

seedTestUser().catch((err) => {
  console.error("Failed to seed test user:", err);
  process.exit(1);
});
