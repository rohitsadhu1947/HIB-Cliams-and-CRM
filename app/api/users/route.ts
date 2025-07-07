import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== USERS API GET: Starting request ===")

    // Get users from the existing users table
    const users = await sql`
      SELECT id, full_name as name, email, role, is_active, created_at, updated_at
      FROM users 
      WHERE is_active = true 
      ORDER BY full_name
    `

    console.log("Users fetched:", users.length, "records")
    return NextResponse.json({ users, success: true })
  } catch (error) {
    console.error("=== USERS API ERROR ===")
    console.error("Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
        users: [],
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role = "user", is_active = true } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO users (full_name, email, role, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${role}, ${is_active}, NOW(), NOW())
      RETURNING id, full_name as name, email, role, is_active, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
