import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Query the settings table with the actual column structure
    const settingsRow = await sql`
      SELECT 
        company_name,
        contact_email, 
        contact_phone,
        dark_mode,
        email_notifications,
        updated_at
      FROM settings 
      LIMIT 1
    `

    // If no settings exist, return defaults
    if (settingsRow.length === 0) {
      // Insert default settings
      await sql`
        INSERT INTO settings (
          company_name, 
          contact_email, 
          contact_phone, 
          dark_mode, 
          email_notifications,
          updated_at
        ) VALUES (
          'HIB Insurance',
          'support@hibinsurance.com',
          '+91 1800 123 4567',
          false,
          true,
          CURRENT_TIMESTAMP
        )
      `

      return NextResponse.json({
        settings: {
          companyName: "HIB Insurance",
          contactEmail: "support@hibinsurance.com",
          contactPhone: "+91 1800 123 4567",
          darkMode: false,
          emailNotifications: true,
        },
      })
    }

    const row = settingsRow[0]

    // Convert database column names to camelCase for frontend
    const settings = {
      companyName: row.company_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      darkMode: row.dark_mode,
      emailNotifications: row.email_notifications,
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch settings: " + (error instanceof Error ? error.message : String(error)),
        settings: {
          companyName: "HIB Insurance",
          contactEmail: "support@hibinsurance.com",
          contactPhone: "+91 1800 123 4567",
          darkMode: false,
          emailNotifications: true,
        },
      },
      { status: 200 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()

    // Check if settings row exists
    const existingSettings = await sql`SELECT id FROM settings LIMIT 1`

    if (existingSettings.length === 0) {
      // Insert new settings
      await sql`
        INSERT INTO settings (
          company_name,
          contact_email,
          contact_phone,
          dark_mode,
          email_notifications,
          updated_at
        ) VALUES (
          ${settings.companyName || "HIB Insurance"},
          ${settings.contactEmail || "support@hibinsurance.com"},
          ${settings.contactPhone || "+91 1800 123 4567"},
          ${settings.darkMode || false},
          ${settings.emailNotifications !== undefined ? settings.emailNotifications : true},
          CURRENT_TIMESTAMP
        )
      `
    } else {
      // Update existing settings
      await sql`
        UPDATE settings SET
          company_name = ${settings.companyName || "HIB Insurance"},
          contact_email = ${settings.contactEmail || "support@hibinsurance.com"},
          contact_phone = ${settings.contactPhone || "+91 1800 123 4567"},
          dark_mode = ${settings.darkMode || false},
          email_notifications = ${settings.emailNotifications !== undefined ? settings.emailNotifications : true},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM settings LIMIT 1)
      `
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      {
        error: "Database error updating settings: " + (error instanceof Error ? error.message : String(error)),
        success: false,
      },
      { status: 500 },
    )
  }
}
