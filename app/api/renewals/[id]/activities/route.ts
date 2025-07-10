import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const activities = await sql`
      SELECT * FROM renewal_activities WHERE renewal_id = ${id} ORDER BY activity_date DESC, id DESC
    `;
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { activity_type, subject, description, next_follow_up_date } = await req.json();
    if (!activity_type) {
      return NextResponse.json({ error: "activity_type is required" }, { status: 400 });
    }
    await sql`
      INSERT INTO renewal_activities (renewal_id, activity_type, subject, description, next_follow_up_date, activity_date, created_at)
      VALUES (${id}, ${activity_type}, ${subject}, ${description}, ${next_follow_up_date}, NOW(), NOW())
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding activity:", error);
    return NextResponse.json({ error: "Failed to add activity" }, { status: 500 });
  }
} 