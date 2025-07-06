import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Product categories and their subtypes
const PRODUCT_CATEGORIES = {
  Motor: ["2w", "4w", "CV"],
  Health: ["Individual", "Family", "Group", "Critical Illness"],
  Life: ["Term", "ULIP", "Endowment", "Others"],
  Travel: ["Domestic", "International", "Student", "Business"],
  Pet: ["Dog", "Cat", "Exotic"],
  Cyber: ["Individual", "SME", "Corporate"],
  Corporate: ["Property", "Liability", "Marine", "Engineering"],
  Marine: ["Cargo", "Hull", "Liability"],
} as const

type ProductCategory = keyof typeof PRODUCT_CATEGORIES
type ProductSubtype = (typeof PRODUCT_CATEGORIES)[ProductCategory][number]

const validateProductCategory = (category: string): category is ProductCategory => {
  return Object.keys(PRODUCT_CATEGORIES).includes(category)
}

const validateProductSubtype = (category: ProductCategory, subtype: string): boolean => {
  return PRODUCT_CATEGORIES[category].includes(subtype as any)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

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

    const rows = await sql(query, [leadId])

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
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

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
      product_category,
      product_subtype,
    } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Validate product category and subtype
    if (product_category && !validateProductCategory(product_category)) {
      return NextResponse.json({ error: "Invalid product category" }, { status: 400 })
    }

    if (product_category && product_subtype && !validateProductSubtype(product_category, product_subtype)) {
      return NextResponse.json({ error: "Invalid product subtype for the selected category" }, { status: 400 })
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
        product_category = $14,
        product_subtype = $15,
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `

    const rows = await sql(query, [
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
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

    const leadId = Number.parseInt(params.id)

    const query = `DELETE FROM leads WHERE id = $1 RETURNING *`
    const rows = await sql(query, [leadId])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
