import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching users from database...")

    const result = await sql`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users 
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Users query result:", result)

    return NextResponse.json({
      users: result,
      count: result.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role = "user", password, is_active = true } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO users (name, email, role, password_hash, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${role}, ${password || "temp_password"}, ${is_active}, NOW(), NOW())
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
