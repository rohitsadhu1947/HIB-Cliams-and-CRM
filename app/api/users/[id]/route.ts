import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    const userResult = await sql.query(
      `SELECT 
        id, 
        full_name as name, 
        email, 
        role, 
        CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
        created_at
      FROM users
      WHERE id = $1`,
      [userId],
    )

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user activity (mock data for now)
    const activities = [
      { action: "Logged in", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { action: "Updated profile", timestamp: new Date(Date.now() - 86400000).toISOString() },
      { action: "Approved claim #CLM-2023-001", timestamp: new Date(Date.now() - 172800000).toISOString() },
    ]

    return NextResponse.json({
      user: userResult[0],
      activities,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const { name, email, role, status } = await request.json()
    const isActive = status === "active"

    const result = await sql.query(
      `UPDATE users
       SET full_name = $1, email = $2, role = $3, is_active = $4
       WHERE id = $5
       RETURNING id, full_name as name, email, role, 
                 CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
                 created_at`,
      [name, email, role, isActive, userId],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    const result = await sql.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId])

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
