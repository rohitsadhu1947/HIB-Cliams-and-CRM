import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Helper function to ensure tables exist
async function ensureTables() {
  try {
    // Create claim_surveyors join table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS claim_surveyors (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER NOT NULL,
        surveyor_id INTEGER NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(claim_id, surveyor_id)
      )
    `)
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
    // Continue execution even if table creation fails
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure tables exist
    await ensureTables()

    const claimId = params.id
    const { surveyorId } = await request.json()

    // Validate inputs
    if (!surveyorId) {
      return NextResponse.json({ error: "Surveyor ID is required" }, { status: 400 })
    }

    // Check if claim exists
    const claim = await sql.query(`SELECT id FROM claims WHERE id = $1`, [claimId])
    if (!claim || claim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Check if surveyor exists
    const surveyor = await sql.query(`SELECT id FROM surveyors WHERE id = $1`, [surveyorId])
    if (!surveyor || surveyor.length === 0) {
      return NextResponse.json({ error: "Surveyor not found" }, { status: 404 })
    }

    // Remove any existing assignments for this claim
    await sql.query(`DELETE FROM claim_surveyors WHERE claim_id = $1`, [claimId])

    // Assign surveyor to claim
    const result = await sql.query(
      `INSERT INTO claim_surveyors (claim_id, surveyor_id)
       VALUES ($1, $2)
       RETURNING *`,
      [claimId, surveyorId],
    )

    return NextResponse.json({
      success: true,
      assignment: result[0],
    })
  } catch (error) {
    console.error("Error assigning surveyor:", error)
    return NextResponse.json({ error: "Failed to assign surveyor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure tables exist
    await ensureTables()

    const claimId = params.id

    // Get assigned surveyor
    const assignment = await sql.query(
      `SELECT cs.*, s.name as surveyor_name, s.email as surveyor_email, s.phone as surveyor_phone
       FROM claim_surveyors cs
       JOIN surveyors s ON cs.surveyor_id = s.id
       WHERE cs.claim_id = $1`,
      [claimId],
    )

    if (!assignment || assignment.length === 0) {
      return NextResponse.json({ assigned: false })
    }

    return NextResponse.json({
      assigned: true,
      assignment: assignment[0],
    })
  } catch (error) {
    console.error("Error getting assigned surveyor:", error)
    return NextResponse.json({ error: "Failed to get assigned surveyor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure tables exist
    await ensureTables()

    const claimId = params.id

    // Remove assignment
    const result = await sql.query(`DELETE FROM claim_surveyors WHERE claim_id = $1 RETURNING id`, [claimId])

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "No assignment found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error removing surveyor assignment:", error)
    return NextResponse.json({ error: "Failed to remove surveyor assignment" }, { status: 500 })
  }
}
