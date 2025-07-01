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
  assigned_user_email?: string
}

interface UpdateLeadRequest {
  source_id?: number
  first_name?: string
  last_name?: string
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

function validateUpdateData(data: UpdateLeadRequest): string[] {
  const errors: string[] = []

  if (data.first_name !== undefined && (!data.first_name || data.first_name.trim().length === 0)) {
    errors.push("First name cannot be empty")
  }

  if (data.last_name !== undefined && (!data.last_name || data.last_name.trim().length === 0)) {
    errors.push("Last name cannot be empty")
  }

  if (data.email !== undefined && data.email && !isValidEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (data.phone !== undefined && data.phone && !isValidPhone(data.phone)) {
    errors.push("Invalid phone number format")
  }

  if (
    data.lead_value !== undefined &&
    data.lead_value !== null &&
    (data.lead_value < 0 || data.lead_value > 10000000)
  ) {
    errors.push("Lead value must be between 0 and 10,000,000")
  }

  if (data.status !== undefined && !isValidStatus(data.status)) {
    errors.push(
      "Invalid status. Must be one of: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost",
    )
  }

  if (data.priority !== undefined && !isValidPriority(data.priority)) {
    errors.push("Invalid priority. Must be one of: low, medium, high, urgent")
  }

  if (data.expected_close_date !== undefined && data.expected_close_date && !isValidDate(data.expected_close_date)) {
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)

    if (isNaN(leadId) || leadId <= 0) {
      return NextResponse.json({ error: "Invalid lead ID. Must be a positive integer." }, { status: 400 })
    }

    const query = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name,
        u.email as assigned_user_email
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `

    const result = await sql(query, [leadId])

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const lead: LeadWithRelations = result[0] as LeadWithRelations

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)

    if (isNaN(leadId) || leadId <= 0) {
      return NextResponse.json({ error: "Invalid lead ID. Must be a positive integer." }, { status: 400 })
    }

    const body: UpdateLeadRequest = await request.json()

    // Validate the update data
    const validationErrors = validateUpdateData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    // Check if lead exists
    const existingLead = await sql("SELECT id FROM leads WHERE id = $1", [leadId])
    if (existingLead.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Validate foreign key constraints
    if (body.source_id !== undefined && body.source_id !== null) {
      const sourceExists = await sql("SELECT id FROM lead_sources WHERE id = $1", [body.source_id])
      if (sourceExists.length === 0) {
        return NextResponse.json({ error: "Invalid source_id. Lead source does not exist." }, { status: 400 })
      }
    }

    if (body.assigned_to !== undefined && body.assigned_to !== null) {
      const userExists = await sql("SELECT id FROM users WHERE id = $1", [body.assigned_to])
      if (userExists.length === 0) {
        return NextResponse.json({ error: "Invalid assigned_to. User does not exist." }, { status: 400 })
      }
    }

    // Check for duplicate email if email is being updated
    if (body.email) {
      const duplicateEmail = await sql("SELECT id FROM leads WHERE email = $1 AND id != $2", [body.email, leadId])
      if (duplicateEmail.length > 0) {
        return NextResponse.json({ error: "Email already exists for another lead" }, { status: 409 })
      }
    }

    // Build dynamic update query
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    // Handle assignment timestamp
    if (body.assigned_to !== undefined) {
      updateFields.push(`assigned_at = $${paramIndex}`)
      updateValues.push(body.assigned_to ? new Date().toISOString() : null)
      paramIndex++
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex}`)
    updateValues.push(new Date().toISOString())
    paramIndex++

    // Add lead ID for WHERE clause
    updateValues.push(leadId)

    const updateQuery = `
      UPDATE leads 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await sql(updateQuery, updateValues)

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    // Fetch the updated lead with related data
    const updatedLeadQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name,
        u.email as assigned_user_email
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `

    const updatedLead = await sql(updatedLeadQuery, [leadId])

    return NextResponse.json(updatedLead[0])
  } catch (error) {
    console.error("Error updating lead:", error)

    if (error instanceof Error && error.message.includes("foreign key constraint")) {
      return NextResponse.json({ error: "Invalid reference to related data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)

    if (isNaN(leadId) || leadId <= 0) {
      return NextResponse.json({ error: "Invalid lead ID. Must be a positive integer." }, { status: 400 })
    }

    // Check if lead exists and get its data before deletion
    const existingLead = await sql("SELECT * FROM leads WHERE id = $1", [leadId])

    if (existingLead.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Check for related records that might prevent deletion
    // You might want to add checks for related tables like lead_activities, lead_notes, etc.

    const result = await sql("DELETE FROM leads WHERE id = $1 RETURNING id", [leadId])

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Lead deleted successfully",
      deletedLead: {
        id: existingLead[0].id,
        lead_number: existingLead[0].lead_number,
        name: `${existingLead[0].first_name} ${existingLead[0].last_name}`,
      },
    })
  } catch (error) {
    console.error("Error deleting lead:", error)

    if (error instanceof Error && error.message.includes("foreign key constraint")) {
      return NextResponse.json(
        { error: "Cannot delete lead. It has related records that must be removed first." },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
