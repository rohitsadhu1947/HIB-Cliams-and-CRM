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
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
  priority: "low" | "medium" | "high" | "urgent"
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
  status?: Lead["status"]
  priority?: Lead["priority"]
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

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
}

const validateLeadValue = (value: number): boolean => {
  return value >= 0 && value <= 999999999
}

const validateStatus = (status: string): status is Lead["status"] => {
  return ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].includes(status)
}

const validatePriority = (priority: string): priority is Lead["priority"] => {
  return ["low", "medium", "high", "urgent"].includes(priority)
}

const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date > new Date("1900-01-01")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assigned_to")
    const sourceId = searchParams.get("source_id")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 })
    }

    // Build the base query
    let query = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramCount = 0

    // Add filters
    if (status && validateStatus(status)) {
      paramCount++
      query += ` AND l.status = $${paramCount}`
      params.push(status)
    }

    if (assignedTo) {
      paramCount++
      if (assignedTo === "unassigned") {
        query += ` AND l.assigned_to IS NULL`
      } else {
        query += ` AND l.assigned_to = $${paramCount}`
        params.push(Number.parseInt(assignedTo))
      }
    }

    if (sourceId) {
      paramCount++
      query += ` AND l.source_id = $${paramCount}`
      params.push(Number.parseInt(sourceId))
    }

    if (search) {
      paramCount++
      query += ` AND (
        l.first_name ILIKE $${paramCount} OR 
        l.last_name ILIKE $${paramCount} OR 
        l.email ILIKE $${paramCount} OR
        l.company_name ILIKE $${paramCount} OR
        l.lead_number ILIKE $${paramCount}
      )`
      params.push(`%${search}%`)
    }

    // Get total count for pagination
    const countQuery = query.replace(
      "SELECT l.*, ls.name as source_name, u.name as assigned_user_name",
      "SELECT COUNT(*)",
    )

    const { rows: countRows } = await sql.query(countQuery, params)
    const total = Number(countRows[0].count)
    const totalPages = Math.ceil(total / limit)

    // Add ordering and pagination
    query += ` ORDER BY l.created_at DESC`
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push((page - 1) * limit)

    const { rows } = await sql.query(query, params)

    const response: PaginatedResponse<LeadWithRelations> = {
      leads: rows as LeadWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json(response)
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

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate phone format if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Validate lead value if provided
    if (lead_value !== undefined && !validateLeadValue(lead_value)) {
      return NextResponse.json({ error: "Lead value must be between 0 and 999,999,999" }, { status: 400 })
    }

    // Validate status and priority
    if (!validateStatus(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    if (!validatePriority(priority)) {
      return NextResponse.json({ error: "Invalid priority value" }, { status: 400 })
    }

    // Validate expected close date if provided
    if (expected_close_date && !validateDate(expected_close_date)) {
      return NextResponse.json({ error: "Invalid expected close date" }, { status: 400 })
    }

    // Check for duplicate email if provided
    if (email) {
      const { rows: existingLead } = await sql.query("SELECT id FROM leads WHERE email = $1", [email])

      if (existingLead.length > 0) {
        return NextResponse.json({ error: "A lead with this email already exists" }, { status: 409 })
      }
    }

    // Validate foreign key constraints
    if (source_id) {
      const { rows: sourceExists } = await sql.query("SELECT id FROM lead_sources WHERE id = $1 AND is_active = true", [
        source_id,
      ])

      if (sourceExists.length === 0) {
        return NextResponse.json({ error: "Invalid or inactive lead source" }, { status: 400 })
      }
    }

    if (assigned_to) {
      const { rows: userExists } = await sql.query("SELECT id FROM users WHERE id = $1", [assigned_to])

      if (userExists.length === 0) {
        return NextResponse.json({ error: "Invalid assigned user" }, { status: 400 })
      }
    }

    // Generate unique lead number
    const leadNumber = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Insert the new lead
    const insertQuery = `
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone, 
        company_name, industry, lead_value, status, priority, assigned_to,
        assigned_at, expected_close_date, notes, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    const { rows } = await sql.query(insertQuery, [
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
      assigned_to ? new Date().toISOString() : null,
      expected_close_date || null,
      notes?.trim() || null,
    ])

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
    const { rows: createdLeadRows } = await sql.query(createdLeadQuery, [rows[0].id])

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
