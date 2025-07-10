import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    // Get old status
    const old = await sql`SELECT status FROM policy_renewals WHERE id = ${id}`;
    const oldStatus = old[0]?.status || null;
    // Update status
    await sql`
      UPDATE policy_renewals
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
    // Log to status history
    await sql`
      INSERT INTO renewal_status_history (renewal_id, old_status, new_status, changed_by, changed_at)
      VALUES (${id}, ${oldStatus}, ${status}, NULL, NOW())
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating renewal status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
} 