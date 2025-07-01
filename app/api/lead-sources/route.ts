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
  is_active?: "true" | "false" | "all"
  search?: string
}

interface LeadSourceResponse {
  sources: LeadSource[]
  metadata: {
    total: number
    active: number
    inactive: number
    filtered: number
  }
}

// Validation functions
const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s\-_]+$/.test(name)
}

const validateDescription = (description: string): boolean => {
  return description.length <= 500
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: LeadSourceFilters = {
      is_active: (searchParams.get("is_active") as "true" | "false" | "all") || "true",
      search: searchParams.get("search") || undefined,
    }

    // Validate filters
    if (filters.is_active && !["true", "false", "all"].includes(filters.is_active)) {
      return NextResponse.json(
        { error: 'Invalid is_active filter. Must be "true", "false", or "all"' },
        { status: 400 },
      )
    }

    // Build query
    let query = "SELECT * FROM lead_sources WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    // Add is_active filter
    if (filters.is_active !== "all") {
      paramCount++
      query += ` AND is_active = $${paramCount}`
      params.push(filters.is_active === "true")
    }

    // Add search filter
    if (filters.search) {
      paramCount++
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      params.push(`%${filters.search}%`)
    }

    // Add ordering
    query += " ORDER BY name ASC"

    // Execute query
    const result = await sql(query, params)

    // Get metadata
    const totalResult = await sql("SELECT COUNT(*) as total FROM lead_sources")
    const activeResult = await sql("SELECT COUNT(*) as active FROM lead_sources WHERE is_active = true")
    const inactiveResult = await sql("SELECT COUNT(*) as inactive FROM lead_sources WHERE is_active = false")

    const response: LeadSourceResponse = {
      sources: result as LeadSource[],
      metadata: {
        total: Number.parseInt(totalResult[0].total),
        active: Number.parseInt(activeResult[0].active),
        inactive: Number.parseInt(inactiveResult[0].inactive),
        filtered: result.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json({ error: "Failed to fetch lead sources" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLeadSourceRequest = await request.json()

    const { name, description, is_active = true } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Validate name
    if (!validateName(name.trim())) {
      return NextResponse.json(
        { error: "Name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 },
      )
    }

    // Validate description if provided
    if (description && !validateDescription(description.trim())) {
      return NextResponse.json({ error: "Description must be less than 500 characters" }, { status: 400 })
    }

    // Validate is_active
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean value" }, { status: 400 })
    }

    // Check for duplicate name (case-insensitive)
    const existingSource = await sql("SELECT id FROM lead_sources WHERE LOWER(name) = LOWER($1)", [name.trim()])

    if (existingSource.length > 0) {
      return NextResponse.json({ error: "A lead source with this name already exists" }, { status: 409 })
    }

    // Insert new lead source
    const insertQuery = `
      INSERT INTO lead_sources (name, description, is_active, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `

    const result = await sql(insertQuery, [name.trim(), description?.trim() || null, is_active])

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "A lead source with this name already exists" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Failed to create lead source" }, { status: 500 })
  }
}
