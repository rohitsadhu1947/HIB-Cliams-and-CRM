import { neon } from "@neondatabase/serverless"

// Create a SQL client
const sql = neon(process.env.DATABASE_URL!)
const db = sql // Alias for backward compatibility

export { sql, db }
