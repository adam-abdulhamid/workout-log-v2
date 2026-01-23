import { db } from "@/db";
import { users, dayTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_DAY_NAMES = [
  "Day 1 - Push",
  "Day 2 - Pull",
  "Day 3 - Legs",
  "Day 4 - Upper",
  "Day 5 - Lower",
  "Day 6 - Full Body",
  "Day 7 - Active Recovery",
];

/**
 * Get the user from the database by Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
}

/**
 * Ensure day templates exist for a user.
 * Creates default templates for days 1-7 if they don't exist.
 * Returns all day templates for the user.
 */
export async function ensureUserDayTemplates(userId: string) {
  // Check what day templates exist for this user
  const existing = await db.query.dayTemplates.findMany({
    where: eq(dayTemplates.userId, userId),
  });

  const existingDays = new Set(existing.map((t) => t.dayNumber));

  // Create missing day templates
  const toCreate: { userId: string; dayNumber: number; name: string }[] = [];
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    if (!existingDays.has(dayNum)) {
      toCreate.push({
        userId,
        dayNumber: dayNum,
        name: DEFAULT_DAY_NAMES[dayNum - 1],
      });
    }
  }

  if (toCreate.length > 0) {
    await db.insert(dayTemplates).values(toCreate);
  }

  // Return all templates (including newly created)
  return db.query.dayTemplates.findMany({
    where: eq(dayTemplates.userId, userId),
  });
}

/**
 * Get a specific day template for a user
 */
export async function getUserDayTemplate(userId: string, dayNumber: number) {
  return db.query.dayTemplates.findFirst({
    where: and(
      eq(dayTemplates.userId, userId),
      eq(dayTemplates.dayNumber, dayNumber)
    ),
  });
}
