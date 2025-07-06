import { neon } from "@neondatabase/serverless"

// Validate that DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your environment configuration.")
}

// Create a SQL client
const sql = neon(process.env.DATABASE_URL)
const db = sql // Alias for backward compatibility

export { sql, db }
