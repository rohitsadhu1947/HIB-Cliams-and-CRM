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
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
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
  status?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
  priority?: "low" | "medium" | "high" | "urgent"
  assigned_to?: number
  expected_close_date?: string
  notes?: string
}

interface PaginatedResponse<T> {
  data: T[]
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
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
}

function isValidStatus(status: string): boolean {
  const validStatuses = ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
  return validStatuses.includes(status)
}

function isValidPriority(priority: string): boolean {
  const validPriorities = ["low", "medium", "high", "urgent"]
  return validPriorities.includes(priority)
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString === date.toISOString().split("T")[0]
}

function validateCreateData(data: CreateLeadRequest): string[] {
  const errors: string[] = []

  if (!data.first_name || data.first_name.trim().length === 0) {
    errors.push("First name is required")
  }

  if (!data.last_name || data.last_name.trim().length === 0) {
    errors.push("Last name is required")
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push("Invalid phone number format")
  }

  if (
    data.lead_value !== undefined &&
    data.lead_value !== null &&
    (data.lead_value < 0 || data.lead_value > 10000000)
  ) {
    errors.push("Lead value must be between 0 and 10,000,000")
  }

  if (data.status && !isValidStatus(data.status)) {
    errors.push(
      "Invalid status. Must be one of: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost",
    )
  }

  if (data.priority && !isValidPriority(data.priority)) {
    errors.push("Invalid priority. Must be one of: low, medium, high, urgent")
  }

  if (data.expected_close_date && !isValidDate(data.expected_close_date)) {
    errors.push("Invalid expected close date format. Use YYYY-MM-DD")
  }

  if (
    data.source_id !== undefined &&
    data.source_id !== null &&
    (!Number.isInteger(data.source_id) || data.source_id <= 0)
  ) {
    errors.push("Source ID must be a positive integer")
  }

  if (
    data.assigned_to !== undefined &&
    data.assigned_to !== null &&
    (!Number.isInteger(data.assigned_to) || data.assigned_to <= 0)
  ) {
    errors.push("Assigned to must be a positive integer")
  }

  return errors
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
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100) // Max 100 per page

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json({ error: "Page must be a positive integer" }, { status: 400 })
    }

    if (limit < 1) {
      return NextResponse.json({ error: "Limit must be a positive integer" }, { status: 400 })
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

    let countQuery = `
      SELECT COUNT(*) as total
      FROM leads l
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    // Add filters
    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
      }
      const statusCondition = ` AND l.status = $${paramIndex}`
      query += statusCondition
      countQuery += statusCondition
      params.push(status)
      paramIndex++
    }

    if (assignedTo) {
      const assignedToId = Number.parseInt(assignedTo)
      if (isNaN(assignedToId)) {
        return NextResponse.json({ error: "Invalid assigned_to filter. Must be a number." }, { status: 400 })
      }
      const assignedCondition = ` AND l.assigned_to = $${paramIndex}`
      query += assignedCondition
      countQuery += assignedCondition
      params.push(assignedToId)
      paramIndex++
    }

    if (sourceId) {
      const sourceIdNum = Number.parseInt(sourceId)
      if (isNaN(sourceIdNum)) {
        return NextResponse.json({ error: "Invalid source_id filter. Must be a number." }, { status: 400 })
      }
      const sourceCondition = ` AND l.source_id = $${paramIndex}`
      query += sourceCondition
      countQuery += sourceCondition
      params.push(sourceIdNum)
      paramIndex++
    }

    if (search) {
      const searchCondition = ` AND (
        l.first_name ILIKE $${paramIndex} OR 
        l.last_name ILIKE $${paramIndex} OR 
        l.company_name ILIKE $${paramIndex} OR
        l.email ILIKE $${paramIndex} OR
        l.lead_number ILIKE $${paramIndex}
      )`
      query += searchCondition
      countQuery += searchCondition
      params.push(`%${search}%`)
      paramIndex++
    }

    // Get total count
    const countResult = await sql(countQuery, params)
    const total = Number.parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    // Add ordering and pagination
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    // Execute the main query
    const result = await sql(query, params)

    const response: PaginatedResponse<LeadWithRelations> = {
      data: result as LeadWithRelations[],
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

    // Validate the input data
    const validationErrors = validateCreateData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    // Check for duplicate email
    if (body.email) {
      const existingLead = await sql("SELECT id FROM leads WHERE email = $1", [body.email])
      if (existingLead.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    // Validate foreign key constraints
    if (body.source_id) {
      const sourceExists = await sql("SELECT id FROM lead_sources WHERE id = $1", [body.source_id])
      if (sourceExists.length === 0) {
        return NextResponse.json({ error: "Invalid source_id. Lead source does not exist." }, { status: 400 })
      }
    }

    if (body.assigned_to) {
      const userExists = await sql("SELECT id FROM users WHERE id = $1", [body.assigned_to])
      if (userExists.length === 0) {
        return NextResponse.json({ error: "Invalid assigned_to. User does not exist." }, { status: 400 })
      }
    }

    // Generate unique lead number
    const leadNumber = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Set defaults
    const status = body.status || "new"
    const priority = body.priority || "medium"
    const assignedAt = body.assigned_to ? new Date().toISOString() : null

    const query = `
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone, 
        company_name, industry, lead_value, status, priority, 
        assigned_to, assigned_at, expected_close_date, notes,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `

    const now = new Date().toISOString()
    const result = await sql(query, [
      leadNumber,
      body.source_id || null,
      body.first_name,
      body.last_name,
      body.email || null,
      body.phone || null,
      body.company_name || null,
      body.industry || null,
      body.lead_value || null,
      status,
      priority,
      body.assigned_to || null,
      assignedAt,
      body.expected_close_date || null,
      body.notes || null,
      now,
      now,
    ])

    if (result.length === 0) {
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

    const createdLead = await sql(createdLeadQuery, [result[0].id])

    return NextResponse.json(createdLead[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Lead with this information already exists" }, { status: 409 })
    }

    if (error instanceof Error && error.message.includes("foreign key constraint")) {
      return NextResponse.json({ error: "Invalid reference to related data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
