import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching users from database...")

    const rows = await sql`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Users query result:", rows)
    console.log("Number of users found:", rows.length)

    return NextResponse.json({
      users: rows,
      count: rows.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [], // Return empty array as fallback
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role = "user", is_active = true } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO users (name, email, role, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${role}, ${is_active}, NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
