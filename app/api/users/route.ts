import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== USERS API: Starting request ===")

    // Check if users table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `
    console.log("Users table exists:", tableExists[0]?.exists)

    if (!tableExists[0]?.exists) {
      console.log("Creating users table...")
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Insert sample users
      await sql`
        INSERT INTO users (name, email, role, is_active) VALUES
        ('John Smith', 'john.smith@company.com', 'admin', true),
        ('Sarah Johnson', 'sarah.johnson@company.com', 'manager', true),
        ('Mike Davis', 'mike.davis@company.com', 'agent', true),
        ('Lisa Wilson', 'lisa.wilson@company.com', 'agent', true)
      `
      console.log("Users table created and seeded")
    }

    // Fetch users
    const users = await sql`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users 
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Users fetched:", users.length, "records")
    console.log("Sample user:", users[0])

    return NextResponse.json({
      users: users,
      count: users.length,
      success: true,
    })
  } catch (error) {
    console.error("=== USERS API ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

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

export async function POST(request: Request) {
  try {
    console.log("=== USERS POST: Starting request ===")

    const body = await request.json()
    console.log("Request body:", body)

    const { name, email, role = "user", is_active = true } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO users (name, email, role, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${role}, ${is_active}, NOW(), NOW())
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `

    console.log("User created:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("=== USERS POST ERROR ===")
    console.error("Error:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
