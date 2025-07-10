import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const renewals = await sql`
      SELECT r.*, p.policy_number, p.end_date, p.policy_type, p.status as policy_status, ph.name as policy_holder_name, u.full_name as assigned_to_name
      FROM policy_renewals r
      JOIN policies p ON r.policy_id = p.id
      JOIN policy_holders ph ON p.policy_holder_id = ph.id
      LEFT JOIN users u ON r.assigned_to = u.id
      WHERE r.renewal_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY r.renewal_date ASC
    `;
    return NextResponse.json({ renewals });
  } catch (error) {
    console.error("API: Error fetching renewals:", error);
    return NextResponse.json({ error: "Failed to fetch renewals" }, { status: 500 });
  }
} 