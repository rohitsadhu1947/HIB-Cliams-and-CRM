import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        policy_holder_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        policy_type TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        premium_amount DECIMAL(10, 2) NOT NULL,
        coverage_amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Fetch all policies with related data
    const policies = await sql.query(`
      SELECT 
        p.*,
        ph.name as policy_holder_name,
        v.registration as vehicle_registration,
        v.make as vehicle_make,
        v.model as vehicle_model
      FROM policies p
      LEFT JOIN policy_holders ph ON p.policy_holder_id = ph.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      ORDER BY p.created_at DESC
    `)

    return NextResponse.json({ policies })
  } catch (error) {
    console.error("Error fetching policies:", error)
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { policyHolderId, vehicleId, policyType, startDate, endDate, premiumAmount, coverageAmount } =
      await request.json()

    const result = await sql.query(
      `INSERT INTO policies (
        policy_holder_id, 
        vehicle_id, 
        policy_type, 
        start_date, 
        end_date, 
        premium_amount, 
        coverage_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [policyHolderId, vehicleId, policyType, startDate, endDate, premiumAmount, coverageAmount],
    )

    return NextResponse.json({ policy: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}
