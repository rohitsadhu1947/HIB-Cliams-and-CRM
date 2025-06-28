import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const claimId = params.id
    const body = await request.json()

    // Add note
    const newNote = await sql`
      INSERT INTO claim_notes (
        claim_id, note_text, created_by
      ) VALUES (
        ${claimId}, 
        ${body.noteText}, 
        ${body.createdBy}
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      note: newNote[0],
    })
  } catch (error) {
    console.error("Error adding note:", error)
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 })
  }
}
