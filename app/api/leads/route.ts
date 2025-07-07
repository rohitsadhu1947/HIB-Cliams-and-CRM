import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("=== LEADS API GET: Starting request ===")

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    console.log("Query params:", { page, limit, offset })

    // Check if leads table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `
    console.log("Leads table exists:", tableExists[0]?.exists)

    if (!tableExists[0]?.exists) {
      console.log("Creating leads table...")
      await sql`
        CREATE TABLE leads (
          id SERIAL PRIMARY KEY,
          lead_number VARCHAR(50) UNIQUE NOT NULL,
          source_id INTEGER REFERENCES lead_sources(id),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          company_name VARCHAR(255),
          industry VARCHAR(100),
          lead_value DECIMAL(12,2),
          status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
          priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          assigned_to INTEGER REFERENCES users(id),
          assigned_at TIMESTAMP,
          expected_close_date DATE,
          notes TEXT,
          product_category VARCHAR(50),
          product_subtype VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      console.log("Leads table created")
    }

    // Build filters
    const status = searchParams.get("status")
    const source_id = searchParams.get("source_id")
    const assigned_to = searchParams.get("assigned_to")
    const product_category = searchParams.get("product_category")
    const search = searchParams.get("search")

    const whereConditions = ["1=1"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (status && status !== "all") {
      whereConditions.push(`l.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (source_id && source_id !== "all") {
      whereConditions.push(`l.source_id = $${paramIndex}`)
      queryParams.push(Number.parseInt(source_id))
      paramIndex++
    }

    if (assigned_to && assigned_to !== "all") {
      if (assigned_to === "unassigned") {
        whereConditions.push("l.assigned_to IS NULL")
      } else {
        whereConditions.push(`l.assigned_to = $${paramIndex}`)
        queryParams.push(Number.parseInt(assigned_to))
        paramIndex++
      }
    }

    if (product_category && product_category !== "all") {
      whereConditions.push(`l.product_category = $${paramIndex}`)
      queryParams.push(product_category)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(
        l.first_name ILIKE $${paramIndex} OR 
        l.last_name ILIKE $${paramIndex} OR 
        l.email ILIKE $${paramIndex} OR 
        l.company_name ILIKE $${paramIndex} OR
        l.lead_number ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")
    console.log("WHERE clause:", whereClause)
    console.log("Query params:", queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leads l
      WHERE ${whereClause}
    `

    const countResult = await sql(countQuery, queryParams)
    const total = Number.parseInt(countResult[0]?.total || "0")
    console.log("Total leads:", total)

    // Get leads with pagination
    const leadsQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const leads = await sql(leadsQuery, queryParams)
    console.log("Leads fetched:", leads.length, "records")

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
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
    })
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

    // Validate product category and subtype combination
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

    if (product_category && product_subtype) {
      const validSubtypes = validCombinations[product_category as keyof typeof validCombinations]
      if (!validSubtypes || !validSubtypes.includes(product_subtype)) {
        console.log("Validation failed: Invalid product combination")
        return NextResponse.json(
          { error: `Invalid product subtype '${product_subtype}' for category '${product_category}'` },
          { status: 400 },
        )
      }
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

    // Prepare insert data
    const insertData = {
      lead_number,
      source_id: source_id || null,
      first_name,
      last_name,
      email: email || null,
      phone: phone || null,
      company_name: company_name || null,
      industry: industry || null,
      lead_value: lead_value || null,
      status,
      priority,
      assigned_to: assigned_to || null,
      expected_close_date: expected_close_date || null,
      notes: notes || null,
      product_category: product_category || null,
      product_subtype: product_subtype || null,
    }

    console.log("Insert data prepared:", JSON.stringify(insertData, null, 2))

    // Insert lead
    const result = await sql`
      INSERT INTO leads (
        lead_number, source_id, first_name, last_name, email, phone,
        company_name, industry, lead_value, status, priority, assigned_to,
        expected_close_date, notes, product_category, product_subtype,
        created_at, updated_at
      ) VALUES (
        ${insertData.lead_number}, ${insertData.source_id}, ${insertData.first_name}, 
        ${insertData.last_name}, ${insertData.email}, ${insertData.phone},
        ${insertData.company_name}, ${insertData.industry}, ${insertData.lead_value}, 
        ${insertData.status}, ${insertData.priority}, ${insertData.assigned_to},
        ${insertData.expected_close_date}, ${insertData.notes}, ${insertData.product_category}, 
        ${insertData.product_subtype}, NOW(), NOW()
      ) RETURNING *
    `

    console.log("Lead created successfully:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("=== LEADS API POST ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "Lead number already exists" }, { status: 409 })
      }
      if (error.message.includes("foreign key")) {
        return NextResponse.json({ error: "Invalid source or user reference" }, { status: 400 })
      }
      if (error.message.includes("check constraint")) {
        return NextResponse.json({ error: "Invalid status, priority, or product combination" }, { status: 400 })
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create lead",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
