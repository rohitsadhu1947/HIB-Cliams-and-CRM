import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Ensure tables exist with correct column names
async function ensureTables() {
  try {
    // Check if table exists first
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'claim_surveys'
      );
    `

    // If table doesn't exist, create it with the correct column names
    if (!tableExists[0].exists) {
      await sql`
        CREATE TABLE claim_surveys (
          id SERIAL PRIMARY KEY,
          claim_id INTEGER NOT NULL,
          surveyor_id INTEGER NOT NULL,
          survey_date DATE NOT NULL,
          location TEXT,
          report TEXT,
          amount DECIMAL(12,2),
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(claim_id)
        )
      `
      console.log("Created claim_surveys table with correct column names")
    } else {
      // Table exists, check if we need to add columns with new names
      try {
        // Try to add columns if they don't exist (will fail silently if they do)
        await sql`
          ALTER TABLE claim_surveys 
          ADD COLUMN IF NOT EXISTS location TEXT,
          ADD COLUMN IF NOT EXISTS report TEXT,
          ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2)
        `
      } catch (error) {
        console.error("Error adding columns:", error)
      }
    }

    return true
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
    return false
  }
}

// GET: Fetch survey details for a claim
export async function GET(request: Request, { params }: { params: { id: string } }) {
  await ensureTables()

  try {
    const id = params.id

    // Get survey details - use correct column names
    const surveys = await sql`
      SELECT 
        cs.*, 
        s.name as surveyor_name,
        COALESCE(s.specialization, 'General') as surveyor_specialization
      FROM claim_surveys cs
      JOIN surveyors s ON cs.surveyor_id = s.id
      WHERE cs.claim_id = ${id}
    `

    if (surveys.length === 0) {
      // Check if a surveyor is assigned but no survey details yet
      const assignments = await sql`
        SELECT 
          cs.*, 
          s.name as surveyor_name
        FROM claim_surveyors cs
        JOIN surveyors s ON cs.surveyor_id = s.id
        WHERE cs.claim_id = ${id}
      `

      if (assignments.length > 0) {
        return NextResponse.json({
          survey: null,
          assignedSurveyor: {
            id: assignments[0].surveyor_id,
            name: assignments[0].surveyor_name,
            specialization: "General", // Default value
          },
        })
      }

      return NextResponse.json({ survey: null, assignedSurveyor: null })
    }

    // Map database column names to expected property names
    const surveyData = {
      ...surveys[0],
      survey_date: surveys[0].survey_date,
      survey_location: surveys[0].location,
      survey_report: surveys[0].report,
      survey_amount: surveys[0].amount,
    }

    return NextResponse.json({
      survey: surveyData,
      assignedSurveyor: {
        id: surveys[0].surveyor_id,
        name: surveys[0].surveyor_name,
        specialization: surveys[0].surveyor_specialization || "General",
      },
    })
  } catch (error) {
    console.error("Error fetching survey details:", error)
    return NextResponse.json({ error: "Failed to fetch survey details" }, { status: 500 })
  }
}

// POST: Create or update survey details
export async function POST(request: Request, { params }: { params: { id: string } }) {
  await ensureTables()

  try {
    const id = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.surveyorId || !body.surveyDate) {
      return NextResponse.json({ error: "Surveyor ID and survey date are required" }, { status: 400 })
    }

    // Check if survey already exists
    const existingSurvey = await sql`
      SELECT * FROM claim_surveys WHERE claim_id = ${id}
    `

    let survey

    if (existingSurvey.length > 0) {
      // Update existing survey - use correct column names
      survey = await sql`
        UPDATE claim_surveys
        SET 
          surveyor_id = ${body.surveyorId},
          survey_date = ${body.surveyDate},
          location = ${body.surveyLocation || null},
          report = ${body.surveyReport || null},
          amount = ${body.surveyAmount || null},
          status = ${body.status || "pending"},
          updated_at = CURRENT_TIMESTAMP
        WHERE claim_id = ${id}
        RETURNING *
      `
    } else {
      // Create new survey - use correct column names
      survey = await sql`
        INSERT INTO claim_surveys (
          claim_id, 
          surveyor_id, 
          survey_date, 
          location, 
          report, 
          amount, 
          status
        )
        VALUES (
          ${id},
          ${body.surveyorId},
          ${body.surveyDate},
          ${body.surveyLocation || null},
          ${body.surveyReport || null},
          ${body.surveyAmount || null},
          ${body.status || "pending"}
        )
        RETURNING *
      `
    }

    // Update claim status if survey is completed
    if (body.status === "completed") {
      await sql`
        UPDATE claims
        SET status = 'surveyed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    // Map database column names to expected property names for response
    const surveyData = {
      ...survey[0],
      survey_location: survey[0].location,
      survey_report: survey[0].report,
      survey_amount: survey[0].amount,
    }

    return NextResponse.json({
      success: true,
      survey: surveyData,
    })
  } catch (error) {
    console.error("Error saving survey details:", error)
    return NextResponse.json({ error: "Failed to save survey details" }, { status: 500 })
  }
}

// DELETE: Remove survey details
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Delete survey
    await sql`
      DELETE FROM claim_surveys
      WHERE claim_id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting survey:", error)
    return NextResponse.json({ error: "Failed to delete survey" }, { status: 500 })
  }
}
