import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const query = `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM lead_sources
      WHERE is_active = true
      ORDER BY name ASC
    `

    const { rows } = await sql.query(query, [])

    return NextResponse.json({ sources: rows })
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json({ error: "Failed to fetch lead sources" }, { status: 500 })
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

    const { rows } = await sql.query(query, [name, description || null, is_active])

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)
    return NextResponse.json({ error: "Failed to create lead source" }, { status: 500 })
  }
}
