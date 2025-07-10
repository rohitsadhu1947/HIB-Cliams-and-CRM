import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { assigned_to } = await req.json();
    if (!assigned_to) {
      return NextResponse.json({ error: "assigned_to is required" }, { status: 400 });
    }
    await sql`
      UPDATE policy_renewals
      SET assigned_to = ${assigned_to}, assigned_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning renewal:", error);
    return NextResponse.json({ error: "Failed to assign renewal" }, { status: 500 });
  }
} 