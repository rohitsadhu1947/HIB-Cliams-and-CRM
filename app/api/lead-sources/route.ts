import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// TypeScript interfaces
interface LeadSource {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

interface CreateLeadSourceRequest {
  name: string
  description?: string
  is_active?: boolean
}

interface LeadSourceFilters {
  is_active?: string
  search?: string
}

// Validation functions
function validateLeadSourceName(name: string): string[] {
  const errors: string[] = []

  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string")
    return errors
  }

  const trimmedName = name.trim()
  if (trimmedName.length === 0) {
    errors.push("Name cannot be empty")
  } else if (trimmedName.length < 2) {
    errors.push("Name must be at least 2 characters long")
  } else if (trimmedName.length > 100) {
    errors.push("Name cannot exceed 100 characters")
  }

  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  const nameRegex = /^[a-zA-Z0-9\s\-_]+$/
  if (!nameRegex.test(trimmedName)) {
    errors.push("Name can only contain letters, numbers, spaces, hyphens, and underscores")
  }

  return errors
}

function validateDescription(description: string): string[] {
  const errors: string[] = []

  if (description && typeof description !== "string") {
    errors.push("Description must be a string")
    return errors
  }

  if (description && description.trim().length > 500) {
    errors.push("Description cannot exceed 500 characters")
  }

  return errors
}

function validateCreateLeadSourceData(data: CreateLeadSourceRequest): string[] {
  const errors: string[] = []

  // Validate name
  errors.push(...validateLeadSourceName(data.name))

  // Validate description
  if (data.description !== undefined) {
    errors.push(...validateDescription(data.description))
  }

  // Validate is_active
  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    errors.push("is_active must be a boolean value")
  }

  return errors
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: LeadSourceFilters = {
      is_active: searchParams.get("is_active") || undefined,
      search: searchParams.get("search") || undefined,
    }

    // Build the query
    let query = "SELECT * FROM lead_sources WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    // Add filters
    if (filters.is_active !== undefined) {
      if (filters.is_active === "true") {
        query += ` AND is_active = $${paramIndex}`
        params.push(true)
        paramIndex++
      } else if (filters.is_active === "false") {
        query += ` AND is_active = $${paramIndex}`
        params.push(false)
        paramIndex++
      } else if (filters.is_active !== "all") {
        return NextResponse.json({ error: "Invalid is_active filter. Use 'true', 'false', or 'all'" }, { status: 400 })
      }
    } else {
      // Default to active sources only
      query += ` AND is_active = $${paramIndex}`
      params.push(true)
      paramIndex++
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    // Add ordering
    query += " ORDER BY name ASC"

    const result = await sql(query, params)

    // Get count of active and inactive sources for metadata
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
      FROM lead_sources
    `
    const countResult = await sql(countQuery)

    return NextResponse.json({
      data: result as LeadSource[],
      metadata: {
        total: Number.parseInt(countResult[0].total),
        active: Number.parseInt(countResult[0].active),
        inactive: Number.parseInt(countResult[0].inactive),
        filtered_count: result.length,
      },
    })
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json(
      { error: "Failed to fetch lead sources", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLeadSourceRequest = await request.json()

    // Validate the input data
    const validationErrors = validateCreateLeadSourceData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    const trimmedName = body.name.trim()
    const trimmedDescription = body.description?.trim() || null

    // Check for duplicate name (case-insensitive)
    const duplicateCheck = await sql("SELECT id FROM lead_sources WHERE LOWER(name) = LOWER($1)", [trimmedName])
    if (duplicateCheck.length > 0) {
      return NextResponse.json({ error: "Lead source with this name already exists" }, { status: 409 })
    }

    // Set defaults
    const isActive = body.is_active !== undefined ? body.is_active : true

    const query = `
      INSERT INTO lead_sources (name, description, is_active, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const now = new Date().toISOString()
    const result = await sql(query, [trimmedName, trimmedDescription, isActive, now])

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to create lead source" }, { status: 500 })
    }

    const createdLeadSource: LeadSource = result[0] as LeadSource

    return NextResponse.json(createdLeadSource, { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        return NextResponse.json({ error: "Lead source with this name already exists" }, { status: 409 })
      }
      if (error.message.includes("check constraint")) {
        return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: "Failed to create lead source", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
