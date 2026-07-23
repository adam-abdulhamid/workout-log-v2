import { test as setup } from "@playwright/test";

/**
 * Seeds test data for the E2E test user.
 * This runs after auth.setup.ts and uses the authenticated session.
 */
setup("seed test data", async ({ request }) => {
  const baseURL = "http://localhost:3000";

  // Check if habits already exist (avoid duplicate seeding)
  const habitsResponse = await request.get(`${baseURL}/api/habits`);
  const existingHabits = await habitsResponse.json();

  if (existingHabits.length === 0) {
    console.log("Seeding habits...");
    // Create test habits
    const habits = ["Morning Workout", "Drink Water", "Read 30 mins", "Stretch"];
    for (const name of habits) {
      await request.post(`${baseURL}/api/habits`, {
        data: { name },
      });
    }
  }

  // Check if weight entries exist
  const weightResponse = await request.get(`${baseURL}/api/weight-entries`);
  const existingWeight = await weightResponse.json();

  if (existingWeight.length === 0) {
    console.log("Seeding weight entries...");
    // Create weight entries for the past 30 days
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Simulate weight fluctuation between 175-180 lbs
      const weight = 175 + Math.random() * 5;
      await request.post(`${baseURL}/api/weight-entries`, {
        data: {
          weightLb: Math.round(weight * 10) / 10,
          date: date.toISOString(),
        },
      });
    }
  }

  // Check if blocks exist
  const blocksResponse = await request.get(`${baseURL}/api/blocks`);
  const existingBlocks = await blocksResponse.json();

  if (existingBlocks.length === 0) {
    console.log("Seeding blocks...");

    // Create a sample block
    const blockResponse = await request.post(`${baseURL}/api/blocks`, {
      data: {
        name: "Upper Body A",
        description: "Push-focused upper body workout",
        category: "strength",
      },
    });
    const block = await blockResponse.json();

    if (block.id) {
      // Add exercises for week 1
      await request.put(`${baseURL}/api/blocks/${block.id}/week/1`, {
        data: {
          notes: "Week 1 - Foundation",
          exercises: [
            { order: 1, name: "Bench Press", sets: 4, reps: "6-8", tempo: "3010", rest: "2:00" },
            { order: 2, name: "Overhead Press", sets: 3, reps: "8-10", tempo: "3010", rest: "2:00" },
            { order: 3, name: "Incline DB Press", sets: 3, reps: "10-12", tempo: "2010", rest: "90s" },
            { order: 4, name: "Tricep Pushdown", sets: 3, reps: "12-15", tempo: "2010", rest: "60s" },
          ],
        },
      });
    }

    // Create another block
    const block2Response = await request.post(`${baseURL}/api/blocks`, {
      data: {
        name: "Lower Body A",
        description: "Quad-focused lower body workout",
        category: "strength",
      },
    });
    const block2 = await block2Response.json();

    if (block2.id) {
      await request.put(`${baseURL}/api/blocks/${block2.id}/week/1`, {
        data: {
          notes: "Week 1 - Foundation",
          exercises: [
            { order: 1, name: "Back Squat", sets: 4, reps: "5-6", tempo: "3010", rest: "3:00" },
            { order: 2, name: "Romanian Deadlift", sets: 3, reps: "8-10", tempo: "3010", rest: "2:00" },
            { order: 3, name: "Leg Press", sets: 3, reps: "10-12", tempo: "2010", rest: "2:00" },
            { order: 4, name: "Leg Curl", sets: 3, reps: "12-15", tempo: "2010", rest: "60s" },
          ],
        },
      });
    }
  }

  // Check if day templates exist
  const dayTemplatesResponse = await request.get(`${baseURL}/api/day-templates`);
  const existingDayTemplates = await dayTemplatesResponse.json();

  if (!existingDayTemplates || existingDayTemplates.length === 0) {
    console.log("Seeding day templates...");

    // Get the blocks we just created
    const blocksRes = await request.get(`${baseURL}/api/blocks`);
    const blocks = await blocksRes.json();

    const upperBlock = blocks.find((b: { name: string }) => b.name === "Upper Body A");
    const lowerBlock = blocks.find((b: { name: string }) => b.name === "Lower Body A");

    // Create day templates for the week
    const dayNames = [
      { dayNumber: 1, name: "Upper A" },
      { dayNumber: 2, name: "Lower A" },
      { dayNumber: 3, name: "Rest" },
      { dayNumber: 4, name: "Upper B" },
      { dayNumber: 5, name: "Lower B" },
      { dayNumber: 6, name: "Active Recovery" },
      { dayNumber: 7, name: "Rest" },
    ];

    for (const day of dayNames) {
      // Create the day template
      await request.post(`${baseURL}/api/day-templates`, {
        data: {
          dayNumber: day.dayNumber,
          name: day.name,
        },
      });

      // Assign blocks to workout days
      if (day.name.includes("Upper") && upperBlock) {
        await request.post(`${baseURL}/api/day-templates/${day.dayNumber}/blocks`, {
          data: { blockId: upperBlock.id },
        });
      } else if (day.name.includes("Lower") && lowerBlock) {
        await request.post(`${baseURL}/api/day-templates/${day.dayNumber}/blocks`, {
          data: { blockId: lowerBlock.id },
        });
      }
    }
  }

  console.log("Test data seeding complete!");
});
