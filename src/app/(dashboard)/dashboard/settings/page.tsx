import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackSettings } from "@/components/feedback/feedback-settings";

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();

  let isFeedbackUser = false;
  if (clerkId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
    isFeedbackUser = dbUser?.isFeedbackUser ?? false;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-wider uppercase">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings content goes here.
          </p>
        </CardContent>
      </Card>

      {isFeedbackUser && (
        <Card>
          <CardHeader>
            <CardTitle>Developer</CardTitle>
            <CardDescription>
              Options for feedback and testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackSettings />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
