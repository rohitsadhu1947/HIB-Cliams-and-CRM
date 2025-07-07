import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== LEADS [ID] GET: Starting request ===")
    console.log("Lead ID:", params.id)

    const leadId = Number.parseInt(params.id)
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ${leadId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    console.log("Lead found:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("=== LEADS [ID] GET ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch lead",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== LEADS [ID] PUT: Starting request ===")
    console.log("Lead ID:", params.id)

    const leadId = Number.parseInt(params.id)
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("Update data:", JSON.stringify(body, null, 2))

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
      product_category,
      product_subtype,
    } = body

    // Validation
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE leads SET
        source_id = ${source_id || null},
        first_name = ${first_name},
        last_name = ${last_name},
        email = ${email || null},
        phone = ${phone || null},
        company_name = ${company_name || null},
        industry = ${industry || null},
        lead_value = ${lead_value || null},
        status = ${status},
        priority = ${priority},
        assigned_to = ${assigned_to || null},
        expected_close_date = ${expected_close_date || null},
        notes = ${notes || null},
        product_category = ${product_category || null},
        product_subtype = ${product_subtype || null},
        updated_at = NOW()
      WHERE id = ${leadId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    console.log("Lead updated:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("=== LEADS [ID] PUT ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== LEADS [ID] DELETE: Starting request ===")
    console.log("Lead ID:", params.id)

    const leadId = Number.parseInt(params.id)
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM leads 
      WHERE id = ${leadId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    console.log("Lead deleted:", result[0])
    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error("=== LEADS [ID] DELETE ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        error: "Failed to delete lead",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
