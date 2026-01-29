import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, healthDocuments } from "@/db/schema";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only select metadata columns, exclude pdfData to avoid sending multi-MB payloads
  const documents = await db
    .select({
      id: healthDocuments.id,
      title: healthDocuments.title,
      documentDate: healthDocuments.documentDate,
      createdAt: healthDocuments.createdAt,
      updatedAt: healthDocuments.updatedAt,
    })
    .from(healthDocuments)
    .where(eq(healthDocuments.userId, user.id))
    .orderBy(desc(healthDocuments.documentDate));

  return NextResponse.json(documents, {
    headers: {
      "Cache-Control": "private, max-age=0, stale-while-revalidate=60",
    },
  });
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const payload = await request.json();
  const title = payload?.title?.trim();
  const documentDate = payload?.documentDate;
  const pdfData = payload?.pdfData;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!documentDate) {
    return NextResponse.json(
      { error: "Document date is required" },
      { status: 400 }
    );
  }

  if (!pdfData) {
    return NextResponse.json({ error: "PDF data is required" }, { status: 400 });
  }

  const [document] = await db
    .insert(healthDocuments)
    .values({
      userId: user.id,
      title,
      documentDate: new Date(documentDate),
      pdfData,
    })
    .returning();

  return NextResponse.json(document);
}
