import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Helper function to ensure tables exist
async function ensureTables() {
  try {
    // Create surveyors table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS surveyors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        specialization TEXT NOT NULL,
        license_number TEXT NOT NULL,
        years_experience INTEGER NOT NULL,
        address TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create claims table if it doesn't exist (in case it's not created yet)
    await sql.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        claim_number TEXT NOT NULL,
        policy_id INTEGER NOT NULL,
        vehicle_id INTEGER,
        incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
        incident_location TEXT NOT NULL,
        incident_description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        amount_claimed DECIMAL(10, 2) NOT NULL,
        amount_approved DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Special case for "new" - return a 404 to prevent the API call from being made
  if (params.id === "new") {
    return NextResponse.json({ error: "Invalid surveyor ID" }, { status: 404 })
  }

  try {
    // Ensure tables exist
    await ensureTables()

    // Get surveyor details - ensure id is a number
    const surveyorId = Number.parseInt(params.id, 10)

    if (isNaN(surveyorId)) {
      return NextResponse.json({ error: "Invalid surveyor ID" }, { status: 400 })
    }

    const surveyor = await sql.query(`SELECT * FROM surveyors WHERE id = $1`, [surveyorId])

    if (!surveyor || surveyor.length === 0) {
      return NextResponse.json({ error: "Surveyor not found" }, { status: 404 })
    }

    // Get assigned claims
    let assignedClaims = []
    try {
      assignedClaims = await sql.query(
        `SELECT c.* FROM claims c
         JOIN claim_surveyors cs ON c.id = cs.claim_id
         WHERE cs.surveyor_id = $1
         ORDER BY c.created_at DESC`,
        [surveyorId],
      )
    } catch (error) {
      console.error("Error fetching assigned claims:", error)
      // Continue with empty assigned claims if query fails
    }

    return NextResponse.json({
      surveyor: surveyor[0],
      assignedClaims,
    })
  } catch (error) {
    console.error("Error fetching surveyor details:", error)

    // Provide fallback data if database query fails
    const fallbackSurveyor = {
      id: Number.parseInt(params.id) || 0,
      name: "Sample Surveyor",
      email: "surveyor@example.com",
      phone: "123-456-7890",
      specialization: "Vehicle Damage Assessment",
      license_number: "SRV-12345",
      years_experience: 5,
      address: "123 Main St, City",
      notes: "This is fallback data due to a database error.",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      surveyor: fallbackSurveyor,
      assignedClaims: [],
      _error: "Database error occurred, showing fallback data",
    })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure tables exist
    await ensureTables()

    const { name, email, phone, specialization, licenseNumber, yearsExperience, address, notes } = await request.json()

    const result = await sql.query(
      `UPDATE surveyors
       SET name = $1, email = $2, phone = $3, specialization = $4, 
           license_number = $5, years_experience = $6, address = $7, notes = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, email, phone, specialization, licenseNumber, yearsExperience, address, notes, params.id],
    )

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Surveyor not found" }, { status: 404 })
    }

    return NextResponse.json({ surveyor: result[0] })
  } catch (error) {
    console.error("Error updating surveyor:", error)
    return NextResponse.json({ error: "Failed to update surveyor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure tables exist
    await ensureTables()

    // Check if surveyor has assigned claims
    let hasAssignedClaims = false
    try {
      const assignedClaims = await sql.query(`SELECT COUNT(*) FROM claim_surveyors WHERE surveyor_id = $1`, [params.id])
      hasAssignedClaims = assignedClaims[0].count > 0
    } catch (error) {
      console.error("Error checking assigned claims:", error)
      // Continue with deletion even if check fails
    }

    if (hasAssignedClaims) {
      return NextResponse.json({ error: "Cannot delete surveyor with assigned claims" }, { status: 400 })
    }

    // Delete surveyor
    const result = await sql.query(`DELETE FROM surveyors WHERE id = $1 RETURNING id`, [params.id])

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Surveyor not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting surveyor:", error)
    return NextResponse.json({ error: "Failed to delete surveyor" }, { status: 500 })
  }
}
