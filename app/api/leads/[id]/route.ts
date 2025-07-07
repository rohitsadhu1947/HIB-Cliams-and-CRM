import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

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

    const result = await sql(query, [id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

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
      product_category,
      product_subtype,
    } = body

    // Validation
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Validate product category and subtype combination
    const validCombinations = {
      Motor: ["2w", "4w", "CV"],
      Health: ["Individual", "Family", "Group", "Critical Illness"],
      Life: ["Term", "ULIP", "Endowment", "Others"],
      Travel: ["Domestic", "International", "Student", "Business"],
      Pet: ["Dog", "Cat", "Exotic"],
      Cyber: ["Individual", "SME", "Corporate"],
      Corporate: ["Property", "Liability", "Marine", "Engineering"],
      Marine: ["Cargo", "Hull", "Liability"],
    }

    if (product_category && product_subtype && !validCombinations[product_category]?.includes(product_subtype)) {
      return NextResponse.json(
        { error: `Invalid product subtype '${product_subtype}' for category '${product_category}'` },
        { status: 400 },
      )
    }

    const query = `
      UPDATE leads 
      SET 
        source_id = $2,
        first_name = $3,
        last_name = $4,
        email = $5,
        phone = $6,
        company_name = $7,
        industry = $8,
        lead_value = $9,
        status = $10,
        priority = $11,
        assigned_to = $12,
        expected_close_date = $13,
        notes = $14,
        product_category = $15,
        product_subtype = $16,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `

    const params = [
      id,
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
      product_category || null,
      product_subtype || null,
    ]

    const result = await sql(query, params)

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

    const query = `DELETE FROM leads WHERE id = $1 RETURNING *`
    const result = await sql(query, [id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json(
      {
        error: "Failed to delete lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
