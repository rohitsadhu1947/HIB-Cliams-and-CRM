import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS policy_holders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        id_number TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if table is empty and seed data if needed
    const countResult = await sql.query(`SELECT COUNT(*) FROM policy_holders`)
    if (countResult[0].count === "0") {
      // Seed some sample data
      await sql.query(`
        INSERT INTO policy_holders (name, email, phone, address, id_number, notes)
        VALUES 
          ('Vikram Singh', 'vikram@example.com', '9876543210', 'Mumbai, Maharashtra', 'ABCDE1234F', 'Premium customer'),
          ('Priya Patel', 'priya@example.com', '8765432109', 'Ahmedabad, Gujarat', 'FGHIJ5678K', 'New customer'),
          ('Rahul Sharma', 'rahul@example.com', '7654321098', 'Delhi, NCR', 'KLMNO9012P', 'Has multiple policies')
      `)
    }

    // Fetch all policy holders
    const policyHolders = await sql.query(`
      SELECT * FROM policy_holders
      ORDER BY name ASC
    `)

    return NextResponse.json({ policyHolders })
  } catch (error) {
    console.error("Error fetching policy holders:", error)
    return NextResponse.json({ error: "Failed to fetch policy holders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, address, idNumber, notes } = await request.json()

    const result = await sql.query(
      `INSERT INTO policy_holders (name, email, phone, address, id_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, address, idNumber, notes],
    )

    return NextResponse.json({ policyHolder: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating policy holder:", error)
    return NextResponse.json({ error: "Failed to create policy holder" }, { status: 500 })
  }
}
