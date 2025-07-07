import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

console.log("=== DATABASE CONNECTION ===")
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)
console.log("DATABASE_URL preview:", process.env.DATABASE_URL?.substring(0, 30) + "...")

export const sql = neon(process.env.DATABASE_URL)

// Test database connection
export async function testConnection() {
  try {
    console.log("Testing database connection...")
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    console.log("Database connection successful:", result[0])
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Initialize database connection test
testConnection()
