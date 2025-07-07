import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching lead sources...")

    const query = `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources
      WHERE is_active = true
      ORDER BY name ASC
    `

    const rows = await sql(query)
    console.log("Lead sources fetched:", rows.length)

    return NextResponse.json({ sources: rows })
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch lead sources",
        details: error instanceof Error ? error.message : "Unknown error",
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

    const query = `
      INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `

    const rows = await sql(query, [name, description || null, is_active])

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)
    return NextResponse.json(
      {
        error: "Failed to create lead source",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
