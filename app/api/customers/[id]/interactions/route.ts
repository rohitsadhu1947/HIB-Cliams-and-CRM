import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    const body = await request.json()

    const { interactionType, subject, summary, followUpRequired, agentId } = body

    // Insert new interaction
    const result = await sql`
      INSERT INTO customer_interactions (
        customer_id,
        interaction_type,
        subject,
        interaction_summary,
        agent_id,
        follow_up_required,
        resolution_status
      ) VALUES (
        ${customerId},
        ${interactionType},
        ${subject},
        ${summary},
        ${agentId || 1},
        ${followUpRequired === "yes"},
        'open'
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      interaction: result[0],
    })
  } catch (error) {
    console.error("Error logging interaction:", error)
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 })
  }
}
