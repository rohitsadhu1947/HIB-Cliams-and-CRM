import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== LEAD SOURCES API: Starting request ===")

    // First, let's check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_sources'
      );
    `
    console.log("Lead sources table exists:", tableExists[0]?.exists)

    if (!tableExists[0]?.exists) {
      console.log("Creating lead_sources table...")
      await sql`
        CREATE TABLE lead_sources (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Insert sample data
      await sql`
        INSERT INTO lead_sources (name, description, is_active) VALUES
        ('Website', 'Leads from company website', true),
        ('Social Media', 'Leads from social platforms', true),
        ('Referral', 'Customer referrals', true),
        ('Cold Calling', 'Cold calling campaigns', true),
        ('Email Marketing', 'Email campaigns', true)
      `
      console.log("Lead sources table created and seeded")
    }

    // Now fetch the data
    const sources = await sql`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources 
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Lead sources fetched:", sources.length, "records")
    console.log("Sample source:", sources[0])

    return NextResponse.json({
      sources: sources,
      count: sources.length,
      success: true,
    })
  } catch (error) {
    console.error("=== LEAD SOURCES API ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to fetch lead sources",
        details: error instanceof Error ? error.message : String(error),
        sources: [],
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("=== LEAD SOURCES POST: Starting request ===")

    const body = await request.json()
    console.log("Request body:", body)

    const { name, description, is_active = true } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
      VALUES (${name}, ${description || null}, ${is_active}, NOW(), NOW())
      RETURNING id, name, description, is_active, created_at, updated_at
    `

    console.log("Lead source created:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("=== LEAD SOURCES POST ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        error: "Failed to create lead source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
