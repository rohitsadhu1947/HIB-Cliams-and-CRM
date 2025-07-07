import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const source_id = searchParams.get("source_id")
    const assigned_to = searchParams.get("assigned_to")
    const product_category = searchParams.get("product_category")
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    // Build WHERE conditions
    const conditions = []
    const params = []
    let paramIndex = 1

    if (status && status !== "all") {
      conditions.push(`l.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (source_id && source_id !== "all") {
      conditions.push(`l.source_id = $${paramIndex}`)
      params.push(Number.parseInt(source_id))
      paramIndex++
    }

    if (assigned_to && assigned_to !== "all") {
      if (assigned_to === "unassigned") {
        conditions.push("l.assigned_to IS NULL")
      } else {
        conditions.push(`l.assigned_to = $${paramIndex}`)
        params.push(Number.parseInt(assigned_to))
        paramIndex++
      }
    }

    if (product_category && product_category !== "all") {
      conditions.push(`l.product_category = $${paramIndex}`)
      params.push(product_category)
      paramIndex++
    }

    if (search) {
      conditions.push(`(
        l.first_name ILIKE $${paramIndex} OR 
        l.last_name ILIKE $${paramIndex} OR 
        l.email ILIKE $${paramIndex} OR 
        l.company_name ILIKE $${paramIndex} OR
        l.lead_number ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leads l
      ${whereClause}
    `

    const countResult = await sql(countQuery, params)
    const total = Number(countResult[0]?.total || 0)

    // Get leads with pagination
    const leadsQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)
    const leads = await sql(leadsQuery, params)

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      status = "new",
      priority = "medium",
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
    if (product_category && product_subtype) {
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

      if (!validCombinations[product_category as keyof typeof validCombinations]?.includes(product_subtype)) {
        return NextResponse.json(
          { error: `Invalid product subtype '${product_subtype}' for category '${product_category}'` },
          { status: 400 },
        )
      }
    }

    // Generate lead number
    const leadNumberResult = await sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM leads 
      WHERE lead_number LIKE 'LEAD%'
    `

    const nextNumber = leadNumberResult[0]?.next_number || 1
    const lead_number = `LEAD${nextNumber.toString().padStart(6, "0")}`

    const query = `
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone,
        company_name, industry, lead_value, status, priority, assigned_to,
        expected_close_date, notes, product_category, product_subtype,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        NOW(), NOW()
      )
      RETURNING *
    `

    const params = [
      lead_number,
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

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json(
      {
        error: "Failed to create lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
