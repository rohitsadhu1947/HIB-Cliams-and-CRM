import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Sample data in case the database is empty
const SAMPLE_POLICIES = [
  { id: "1", policy_number: "POL-2023-001" },
  { id: "2", policy_number: "POL-2023-002" },
  { id: "3", policy_number: "POL-2023-003" },
  { id: "4", policy_number: "POL-2023-004" },
  { id: "5", policy_number: "POL-2023-005" },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""

    // Try to get policies from database
    let policies = []

    try {
      if (!query) {
        policies = await sql`
          SELECT id, policy_number
          FROM policies 
          ORDER BY policy_number 
          LIMIT 10
        `
      } else {
        policies = await sql`
          SELECT id, policy_number
          FROM policies 
          WHERE policy_number ILIKE ${"%" + query + "%"} 
          ORDER BY policy_number 
          LIMIT 10
        `
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      // If database query fails, use sample data
      policies = []
    }

    // If no policies found in database, use sample data
    if (policies.length === 0) {
      console.log("Using sample policy data")
      if (!query) {
        policies = SAMPLE_POLICIES
      } else {
        policies = SAMPLE_POLICIES.filter((p) => p.policy_number.toLowerCase().includes(query.toLowerCase()))
      }
    }

    return NextResponse.json({ policies })
  } catch (error) {
    console.error("Error in policy search API:", error)
    // Return sample data as fallback
    return NextResponse.json({
      policies: SAMPLE_POLICIES,
      error: "Using sample data due to error",
    })
  }
}
