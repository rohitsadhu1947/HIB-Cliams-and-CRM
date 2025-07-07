import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("=== LEADS API GET: Starting request ===")
    console.log("Request URL:", request.url)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    console.log("Pagination params:", { page, limit, offset })

    // First, let's check what's actually in the database
    console.log("=== CHECKING DATABASE CONTENT ===")

    const allLeads = await sql`SELECT COUNT(*) as total FROM leads`
    console.log("Total leads in database:", allLeads[0]?.total)

    const sampleLeads = await sql`SELECT * FROM leads LIMIT 3`
    console.log("Sample leads from database:", JSON.stringify(sampleLeads, null, 2))

    // Build filters
    const status = searchParams.get("status")
    const source_id = searchParams.get("source_id")
    const assigned_to = searchParams.get("assigned_to")
    const product_category = searchParams.get("product_category")
    const search = searchParams.get("search")

    console.log("Filter params:", { status, source_id, assigned_to, product_category, search })

    // Build WHERE conditions
    const whereConditions = []
    const queryParams: any[] = []

    if (status && status !== "all") {
      whereConditions.push(`status = '${status}'`)
    }

    if (source_id && source_id !== "all") {
      whereConditions.push(`source_id = ${Number.parseInt(source_id)}`)
    }

    if (assigned_to && assigned_to !== "all") {
      if (assigned_to === "unassigned") {
        whereConditions.push("assigned_to IS NULL")
      } else {
        whereConditions.push(`assigned_to = ${Number.parseInt(assigned_to)}`)
      }
    }

    if (product_category && product_category !== "all") {
      whereConditions.push(`product_category = '${product_category}'`)
    }

    if (search) {
      whereConditions.push(`(
        first_name ILIKE '%${search}%' OR 
        last_name ILIKE '%${search}%' OR 
        email ILIKE '%${search}%' OR 
        company_name ILIKE '%${search}%' OR
        lead_number ILIKE '%${search}%'
      )`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""
    console.log("WHERE clause:", whereClause)

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`
    console.log("Count query:", countQuery)

    const countResult = await sql(countQuery)
    const total = Number.parseInt(countResult[0]?.total || "0")
    console.log("Filtered total:", total)

    // Get leads with pagination and joins
    const leadsQuery = `
      SELECT 
        l.id,
        l.lead_number,
        l.source_id,
        l.first_name,
        l.last_name,
        l.email,
        l.phone,
        l.company_name,
        l.industry,
        l.lead_value,
        l.status,
        l.priority,
        l.assigned_to,
        l.assigned_at,
        l.expected_close_date,
        l.notes,
        l.product_category,
        l.product_subtype,
        l.created_at,
        l.updated_at,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log("Leads query:", leadsQuery)
    const leads = await sql(leadsQuery)
    console.log("Leads fetched:", leads.length, "records")

    if (leads.length > 0) {
      console.log("First lead:", JSON.stringify(leads[0], null, 2))
    }

    const totalPages = Math.ceil(total / limit)

    const response = {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      success: true,
    }

    console.log("=== RESPONSE SUMMARY ===")
    console.log("Total leads:", total)
    console.log("Leads returned:", leads.length)
    console.log("Page:", page, "of", totalPages)

    return NextResponse.json(response)
  } catch (error) {
    console.error("=== LEADS API GET ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to fetch leads",
        details: error instanceof Error ? error.message : String(error),
        leads: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== LEADS API POST: Starting request ===")

    const body = await request.json()
    console.log("Request body received:", JSON.stringify(body, null, 2))

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
      console.log("Validation failed: Missing required fields")
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Generate lead number
    console.log("Generating lead number...")
    const leadNumberResult = await sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 6) AS INTEGER)), 0) + 1 as next_number
      FROM leads
      WHERE lead_number LIKE 'LEAD-%'
    `

    const nextNumber = leadNumberResult[0]?.next_number || 1
    const lead_number = `LEAD-${nextNumber.toString().padStart(6, "0")}`
    console.log("Generated lead number:", lead_number)

    // Insert lead
    const result = await sql`
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone,
        company_name, industry, lead_value, status, priority, assigned_to,
        expected_close_date, notes, product_category, product_subtype,
        created_at, updated_at
      ) VALUES (
        ${lead_number}, ${source_id || null}, ${first_name}, ${last_name}, 
        ${email || null}, ${phone || null}, ${company_name || null}, ${industry || null}, 
        ${lead_value || null}, ${status}, ${priority}, ${assigned_to || null},
        ${expected_close_date || null}, ${notes || null}, ${product_category || null}, 
        ${product_subtype || null}, NOW(), NOW()
      ) RETURNING *
    `

    console.log("Lead created successfully:", JSON.stringify(result[0], null, 2))
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("=== LEADS API POST ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        error: "Failed to create lead",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
