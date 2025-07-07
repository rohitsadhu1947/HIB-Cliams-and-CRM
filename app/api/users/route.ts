import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== USERS API GET: Starting request ===")

    // Check if users table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `
    console.log("Users table exists:", tableExists[0]?.exists)

    if (!tableExists[0]?.exists) {
      console.log("Creating users table...")
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Insert sample users
      await sql`
        INSERT INTO users (name, email, role) VALUES
        ('John Smith', 'john.smith@company.com', 'admin'),
        ('Sarah Johnson', 'sarah.johnson@company.com', 'manager'),
        ('Mike Davis', 'mike.davis@company.com', 'agent'),
        ('Lisa Wilson', 'lisa.wilson@company.com', 'agent'),
        ('Tom Brown', 'tom.brown@company.com', 'agent')
      `
      console.log("Users table created with sample data")
    }

    const users = await sql`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users 
      WHERE is_active = true 
      ORDER BY name
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
      INSERT INTO users (name, email, role, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${role}, ${is_active}, NOW(), NOW())
      RETURNING *
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
