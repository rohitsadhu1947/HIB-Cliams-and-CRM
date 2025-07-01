import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// TypeScript interfaces
interface Lead {
  id: number
  lead_number: string
  source_id?: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  industry?: string
  lead_value?: number
  status: string
  priority: string
  assigned_to?: number
  assigned_at?: string
  expected_close_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface LeadWithRelations extends Lead {
  source_name?: string
  assigned_user_name?: string
}

interface CreateLeadRequest {
  source_id?: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  industry?: string
  lead_value?: number
  status?: string
  priority?: string
  assigned_to?: number
  expected_close_date?: string
  notes?: string
}

interface PaginatedResponse<T> {
  leads: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const sourceId = searchParams.get("source_id")
    const assignedTo = searchParams.get("assigned_to")

    const offset = (page - 1) * limit

    // Build WHERE conditions and params
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(
        `(l.first_name ILIKE $${paramIndex} OR l.last_name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.company_name ILIKE $${paramIndex})`,
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      conditions.push(`l.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (sourceId) {
      conditions.push(`l.source_id = $${paramIndex}`)
      params.push(Number.parseInt(sourceId))
      paramIndex++
    }

    if (assignedTo) {
      if (assignedTo === "unassigned") {
        conditions.push(`l.assigned_to IS NULL`)
        // Do NOT increment paramIndex or add to params
      } else {
        conditions.push(`l.assigned_to = $${paramIndex}`)
        params.push(Number.parseInt(assignedTo))
        paramIndex++
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Log the count query and params for debugging
    const countQuery = `SELECT COUNT(*) as total FROM leads l ${whereClause}`
    console.log("Count Query:", countQuery, params)

    // Defensive count query
    let countRows
    try {
      countRows = await sql.query(countQuery, params)
    } catch (err) {
      console.error("SQL error in count query:", err)
      return NextResponse.json({ error: "SQL error in count query" }, { status: 500 })
    }

    if (!countRows[0] || countRows[0].total === undefined || countRows[0].total === null) {
      console.error("Count query returned no rows or invalid result:", countRows)
      return NextResponse.json({ error: "Count query failed" }, { status: 500 })
    }

    const total = Number.parseInt(countRows[0].total)

    // Get leads with pagination
    const leadsQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.full_name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const leadsParams = [...params, limit, offset]
    console.log("Leads Query:", leadsQuery, leadsParams)

    let rows
    try {
      rows = await sql.query(leadsQuery, leadsParams)
    } catch (err) {
      console.error("SQL error in leads query:", err)
      return NextResponse.json({ error: "SQL error in leads query" }, { status: 500 })
    }

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      leads: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLeadRequest = await request.json()
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
    } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Validate field lengths
    if (first_name.length > 100 || last_name.length > 100) {
      return NextResponse.json({ error: "Name fields must be less than 100 characters" }, { status: 400 })
    }

    // Check for duplicate email if provided
    if (email) {
      const { rows: duplicateRows } = await sql.query("SELECT id FROM leads WHERE email = $1", [email])
      if (duplicateRows.length > 0) {
        return NextResponse.json({ error: "A lead with this email already exists" }, { status: 409 })
      }
    }

    // Generate lead number
    const { rows: leadNumberRows } = await sql.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 6) AS INTEGER)), 0) + 1 as next_number FROM leads WHERE lead_number LIKE 'LEAD-%'",
      [],
    )

    let nextNumber = 1
    if (leadNumberRows[0] && leadNumberRows[0].next_number) {
      nextNumber = leadNumberRows[0].next_number
    }

    const leadNumber = `LEAD-${String(nextNumber).padStart(6, "0")}`

    // Insert lead
    const insertQuery = `
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone,
        company_name, industry, lead_value, status, priority, assigned_to,
        expected_close_date, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *
    `

    console.log("Insert Lead Query:", insertQuery)
    console.log("Insert Lead Params:", [
      leadNumber,
      source_id || null,
      first_name.trim(),
      last_name.trim(),
      email?.trim() || null,
      phone?.trim() || null,
      company_name?.trim() || null,
      industry?.trim() || null,
      lead_value || null,
      status,
      priority,
      assigned_to || null,
      expected_close_date || null,
      notes?.trim() || null,
    ])

    const { rows: insertRows } = await sql.query(insertQuery, [
      leadNumber,
      source_id || null,
      first_name.trim(),
      last_name.trim(),
      email?.trim() || null,
      phone?.trim() || null,
      company_name?.trim() || null,
      industry?.trim() || null,
      lead_value || null,
      status,
      priority,
      assigned_to || null,
      expected_close_date || null,
      notes?.trim() || null,
    ])

    if (insertRows.length === 0) {
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    // Fetch the created lead with related data
    const createdLeadQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `

    console.log("Created Lead Query:", createdLeadQuery, [insertRows[0].id])

    const { rows: createdLeadRows } = await sql.query(createdLeadQuery, [insertRows[0].id])

    if (createdLeadRows.length === 0) {
      return NextResponse.json(insertRows[0], { status: 201 })
    }

    return NextResponse.json(createdLeadRows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "A lead with this information already exists" }, { status: 409 })
      }

      if (error.message.includes("foreign key")) {
        return NextResponse.json({ error: "Invalid reference to related data" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
