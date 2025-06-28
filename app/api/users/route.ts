import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if we need to seed sample users
    const userCount = await sql.query(`SELECT COUNT(*) as count FROM users`)

    if (userCount[0].count === "0") {
      // Seed sample users
      await sql.query(`
        INSERT INTO users (full_name, email, role, is_active)
        VALUES 
          ('Admin User', 'admin@example.com', 'admin', true),
          ('Claims Manager', 'manager@example.com', 'claims_manager', true),
          ('Claims Adjuster', 'adjuster@example.com', 'claims_adjuster', true)
      `)
    }

    const users = await sql.query(`
      SELECT 
        id, 
        full_name as name, 
        email, 
        role, 
        CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
        created_at
      FROM users
      ORDER BY full_name
    `)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role, status } = await request.json()
    const isActive = status === "active"

    const result = await sql.query(
      `INSERT INTO users (full_name, email, role, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name as name, email, role, 
                 CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
                 created_at`,
      [name, email, role, isActive],
    )

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
