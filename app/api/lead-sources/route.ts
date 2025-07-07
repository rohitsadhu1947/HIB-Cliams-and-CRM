import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching lead sources from database...")

    const result = await sql`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources 
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Lead sources query result:", result)

    return NextResponse.json({
      sources: result,
      count: result.length,
    })
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch lead sources",
        details: error instanceof Error ? error.message : "Unknown error",
        sources: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
