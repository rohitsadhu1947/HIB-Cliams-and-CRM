import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)

    const query = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `

    const { rows } = await sql.query(query, [leadId])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)
    const body = await request.json()

    const {
      source_id,
      first_name,
      last_name,
      email,
      phone,
      company_name,
      industry,
      lead_value,
      status,
      priority,
      assigned_to,
      expected_close_date,
      notes,
    } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    const query = `
      UPDATE leads SET
        source_id = $1,
        first_name = $2,
        last_name = $3,
        email = $4,
        phone = $5,
        company_name = $6,
        industry = $7,
        lead_value = $8,
        status = $9,
        priority = $10,
        assigned_to = $11,
        expected_close_date = $12,
        notes = $13,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `

    const { rows } = await sql.query(query, [
      source_id || null,
      first_name,
      last_name,
      email || null,
      phone || null,
      company_name || null,
      industry || null,
      lead_value || null,
      status,
      priority,
      assigned_to || null,
      expected_close_date || null,
      notes || null,
      leadId,
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)

    const query = `DELETE FROM leads WHERE id = $1 RETURNING *`
    const { rows } = await sql.query(query, [leadId])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
