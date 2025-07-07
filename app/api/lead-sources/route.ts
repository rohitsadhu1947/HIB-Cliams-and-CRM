import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching lead sources from database...")

    // Test database connection first
    const testResult = await sql`SELECT 1 as test`
    console.log("Database connection test:", testResult)

    const rows = await sql`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Lead sources query result:", rows)
    console.log("Number of lead sources found:", rows.length)

    // Return the data in the expected format
    return NextResponse.json({
      sources: rows,
      count: rows.length,
    })
  } catch (error) {
    console.error("Error fetching lead sources:", error)

    // Return detailed error information
    return NextResponse.json(
      {
        error: "Failed to fetch lead sources",
        details: error instanceof Error ? error.message : "Unknown error",
        sources: [], // Return empty array as fallback
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, is_active = true } = body

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
      VALUES (${name.trim()}, ${description || null}, ${is_active}, NOW(), NOW())
      RETURNING *
    `

    console.log("Created lead source:", rows[0])
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A lead source with this name already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: "Failed to create lead source",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
