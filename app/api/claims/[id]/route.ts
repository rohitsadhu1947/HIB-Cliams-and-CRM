import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get claim details
    const claim = await sql`
      SELECT c.*, p.policy_number, ph.name as policy_holder_name, 
             v.make, v.model, v.registration_number
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      JOIN policy_holders ph ON p.policy_holder_id = ph.id
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE c.id = ${id}
    `

    if (!claim || claim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Get documents
    const documents = await sql`
      SELECT * FROM documents
      WHERE claim_id = ${id}
      ORDER BY created_at DESC
    `

    // Get notes
    const notes = await sql`
      SELECT * FROM claim_notes
      WHERE claim_id = ${id}
      ORDER BY created_at DESC
    `

    // Get survey
    const survey = await sql`
      SELECT cs.*, s.name as surveyor_name
      FROM claim_surveys cs
      JOIN surveyors s ON cs.surveyor_id = s.id
      WHERE cs.claim_id = ${id}
    `

    // Get payment
    const payment = await sql`
      SELECT * FROM payments
      WHERE claim_id = ${id}
    `

    return NextResponse.json({
      claim: claim[0],
      documents,
      notes,
      survey: survey.length > 0 ? survey[0] : null,
      payment: payment.length > 0 ? payment[0] : null,
    })
  } catch (error) {
    console.error("Error fetching claim details:", error)
    return NextResponse.json({ error: "Failed to fetch claim details" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Update claim
    const updatedClaim = await sql`
      UPDATE claims
      SET status = ${body.status},
          approved_amount = ${body.approvedAmount || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!updatedClaim || updatedClaim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      claim: updatedClaim[0],
    })
  } catch (error) {
    console.error("Error updating claim:", error)
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 })
  }
}
