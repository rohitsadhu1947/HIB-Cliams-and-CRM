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
  source_description?: string
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
  status?: Lead["status"]
  priority?: Lead["priority"]
  assigned_to?: number
  expected_close_date?: string
  notes?: string
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
        ls.description as source_description,
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

    if (first_name !== undefined && (!first_name || first_name.length > 100)) {
      return NextResponse.json(
        { error: "First name is required and must be less than 100 characters" },
        { status: 400 },
      )
    }

    if (last_name !== undefined && (!last_name || last_name.length > 100)) {
      return NextResponse.json({ error: "Last name is required and must be less than 100 characters" }, { status: 400 })
    }

    if (email !== undefined && email && !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (phone !== undefined && phone && !validatePhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    if (lead_value !== undefined && lead_value !== null && !validateLeadValue(lead_value)) {
      return NextResponse.json({ error: "Lead value must be between 0 and 999,999,999" }, { status: 400 })
    }

    if (status !== undefined && !validateStatus(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    if (priority !== undefined && !validatePriority(priority)) {
      return NextResponse.json({ error: "Invalid priority value" }, { status: 400 })
    }

    if (expected_close_date !== undefined && expected_close_date && !validateDate(expected_close_date)) {
      return NextResponse.json({ error: "Invalid expected close date" }, { status: 400 })
    }

    if (email !== undefined && email) {
      const duplicateCheck = await sql("SELECT id FROM leads WHERE email = $1 AND id != $2", [email, leadId])
      if (duplicateCheck.length > 0) {
        return NextResponse.json({ error: "A lead with this email already exists" }, { status: 409 })
      }
    }

    if (source_id !== undefined && source_id !== null) {
      const sourceExists = await sql("SELECT id FROM lead_sources WHERE id = $1 AND is_active = true", [source_id])
      if (sourceExists.length === 0) {
        return NextResponse.json({ error: "Invalid or inactive lead source" }, { status: 400 })
      }
    }

    if (assigned_to !== undefined && assigned_to !== null) {
      const userExists = await sql("SELECT id FROM users WHERE id = $1", [assigned_to])
      if (userExists.length === 0) {
        return NextResponse.json({ error: "Invalid assigned user" }, { status: 400 })
      }
    }

    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramCount = 0

    const fieldsToUpdate = {
      source_id,
      first_name: first_name?.trim(),
      last_name: last_name?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      company_name: company_name?.trim(),
      industry: industry?.trim(),
      lead_value,
      status,
      priority,
      assigned_to,
      expected_close_date,
      notes: notes?.trim(),
    }

    const existingLead = await sql("SELECT * FROM leads WHERE id = $1", [leadId])
    const currentLead = existingLead[0]
    let shouldUpdateAssignedAt = false

    if (assigned_to !== undefined && assigned_to !== currentLead.assigned_to) {
      shouldUpdateAssignedAt = true
    }

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++
        updateFields.push(`${key} = $${paramCount}`)
        updateValues.push(value)
      }
    })

    if (shouldUpdateAssignedAt) {
      paramCount++
      updateFields.push(`assigned_at = $${paramCount}`)
      updateValues.push(assigned_to ? new Date().toISOString() : null)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    paramCount++
    updateFields.push(`updated_at = $${paramCount}`)
    updateValues.push(new Date().toISOString())

    paramCount++
    updateValues.push(leadId)

    const updateQuery = `
      UPDATE leads 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await sql(updateQuery, updateValues)

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    const updatedLead = await sql(
      `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `,
      [leadId],
    )

    return NextResponse.json(updatedLead[0])
  } catch (error) {
    console.error("Error updating lead:", error)

    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "A lead with this information already exists" }, { status: 409 })
      }

      if (error.message.includes("foreign key")) {
        return NextResponse.json({ error: "Invalid reference to related data" }, { status: 400 })
      }
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

    const existingLead = await sql("SELECT * FROM leads WHERE id = $1", [leadId])

    if (existingLead.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const result = await sql("DELETE FROM leads WHERE id = $1 RETURNING *", [leadId])

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Lead deleted successfully",
      deletedLead: {
        id: result[0].id,
        lead_number: result[0].lead_number,
        name: `${result[0].first_name} ${result[0].last_name}`,
      },
    })
  } catch (error) {
    console.error("Error deleting lead:", error)

    if (error instanceof Error) {
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Cannot delete lead: it has related records that must be removed first" },
          { status: 409 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
