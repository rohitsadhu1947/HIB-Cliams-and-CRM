import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== LEAD SOURCES API GET: Starting request ===")

    // Check if lead_sources table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_sources'
      )
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
        INSERT INTO lead_sources (name, description) VALUES
        ('Website', 'Leads from company website'),
        ('Social Media', 'Leads from social media platforms'),
        ('Referral', 'Leads from customer referrals'),
        ('Cold Calling', 'Leads from cold calling campaigns'),
        ('Email Marketing', 'Leads from email campaigns'),
        ('Trade Shows', 'Leads from trade shows and events'),
        ('Online Ads', 'Leads from online advertising'),
        ('Partner', 'Leads from business partners')
      `
      console.log("Lead sources table created with sample data")
    }

    const sources = await sql`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources 
      WHERE is_active = true 
      ORDER BY name
    `

    console.log("Lead sources fetched:", sources.length, "records")
    return NextResponse.json({ sources, success: true })
  } catch (error) {
    console.error("=== LEAD SOURCES API ERROR ===")
    console.error("Error:", error)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, is_active = true } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
      VALUES (${name}, ${description || null}, ${is_active}, NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)
    return NextResponse.json(
      {
        error: "Failed to create lead source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
