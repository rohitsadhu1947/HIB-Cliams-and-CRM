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
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
    // Continue execution even if table creation fails
  }
}

export async function GET() {
  try {
    // Ensure tables exist
    await ensureTables()

    // Get all surveyors
    const surveyors = await sql.query(`
      SELECT * FROM surveyors 
      ORDER BY name ASC
    `)

    return NextResponse.json({ surveyors })
  } catch (error) {
    console.error("Error fetching surveyors:", error)

    // Return empty array if database query fails
    return NextResponse.json({
      surveyors: [],
      _error: "Database error occurred, showing empty list",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure tables exist
    await ensureTables()

    const { name, email, phone, specialization, licenseNumber, yearsExperience, address, notes } = await request.json()

    // Validate required fields
    if (!name || !email || !phone || !specialization || !licenseNumber || !yearsExperience || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert yearsExperience to integer
    const yearsExperienceInt = Number.parseInt(yearsExperience, 10)
    if (isNaN(yearsExperienceInt)) {
      return NextResponse.json({ error: "Years of experience must be a number" }, { status: 400 })
    }

    // Insert new surveyor
    const result = await sql.query(
      `INSERT INTO surveyors (
        name, email, phone, specialization, license_number, 
        years_experience, address, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, email, phone, specialization, licenseNumber, yearsExperienceInt, address, notes || ""],
    )

    return NextResponse.json({ surveyor: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating surveyor:", error)
    return NextResponse.json({ error: "Failed to create surveyor" }, { status: 500 })
  }
}
