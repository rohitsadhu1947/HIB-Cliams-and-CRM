import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        registration TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        color TEXT,
        chassis_number TEXT,
        engine_number TEXT,
        policy_holder_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if table is empty and seed data if needed
    const countResult = await sql.query(`SELECT COUNT(*) FROM vehicles`)
    if (countResult[0].count === "0") {
      // Seed some sample data
      await sql.query(`
        INSERT INTO vehicles (registration, make, model, year, color, chassis_number, engine_number)
        VALUES 
          ('MH01AB1234', 'Maruti Suzuki', 'Swift', 2020, 'Red', 'CHASSIS123456', 'ENGINE123456'),
          ('KA02CD5678', 'Hyundai', 'Creta', 2021, 'White', 'CHASSIS234567', 'ENGINE234567'),
          ('DL03EF9012', 'Honda', 'City', 2019, 'Silver', 'CHASSIS345678', 'ENGINE345678')
      `)
    }

    // Fetch all vehicles
    const vehicles = await sql.query(`
      SELECT * FROM vehicles
      ORDER BY make, model ASC
    `)

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { registration, make, model, year, color, chassisNumber, engineNumber, policyHolderId } = await request.json()

    const result = await sql.query(
      `INSERT INTO vehicles (registration, make, model, year, color, chassis_number, engine_number, policy_holder_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [registration, make, model, year, color, chassisNumber, engineNumber, policyHolderId],
    )

    return NextResponse.json({ vehicle: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 })
  }
}
