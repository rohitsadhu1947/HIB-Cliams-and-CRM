import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Function to ensure the roles and permissions tables exist
async function ensureRolesTables() {
  try {
    // Create roles table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create permissions table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create role_permissions join table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id)
      )
    `)

    return true
  } catch (error) {
    console.error("Error creating roles tables:", error)
    return false
  }
}

// Function to seed default roles and permissions if they don't exist
async function seedRolesAndPermissions() {
  try {
    // Check if we need to seed
    const roleCount = await sql.query(`SELECT COUNT(*) as count FROM roles`)

    if (roleCount[0].count !== "0") {
      return true // Already seeded
    }

    // Define permissions
    const permissions = [
      // Claims permissions
      { name: "view_claims", description: "View claims", category: "claims" },
      { name: "create_claims", description: "Create new claims", category: "claims" },
      { name: "edit_claims", description: "Edit existing claims", category: "claims" },
      { name: "delete_claims", description: "Delete claims", category: "claims" },
      { name: "approve_claims", description: "Approve claims", category: "claims" },
      { name: "reject_claims", description: "Reject claims", category: "claims" },

      // Policies permissions
      { name: "view_policies", description: "View policies", category: "policies" },
      { name: "create_policies", description: "Create new policies", category: "policies" },
      { name: "edit_policies", description: "Edit existing policies", category: "policies" },
      { name: "delete_policies", description: "Delete policies", category: "policies" },

      // Users permissions
      { name: "view_users", description: "View users", category: "users" },
      { name: "create_users", description: "Create new users", category: "users" },
      { name: "edit_users", description: "Edit existing users", category: "users" },
      { name: "delete_users", description: "Delete users", category: "users" },

      // Reports permissions
      { name: "view_reports", description: "View reports", category: "reports" },
      { name: "export_reports", description: "Export reports", category: "reports" },

      // System permissions
      { name: "manage_settings", description: "Manage system settings", category: "system" },
    ]

    // Insert permissions
    for (const perm of permissions) {
      await sql.query(`INSERT INTO permissions (name, description, category) VALUES ($1, $2, $3)`, [
        perm.name,
        perm.description,
        perm.category,
      ])
    }

    // Define roles
    const roles = [
      {
        name: "admin",
        description: "Administrator with full access to all features",
        permissions: permissions.map((p) => p.name), // All permissions
      },
      {
        name: "claims_manager",
        description: "Manages claims and can approve or reject them",
        permissions: [
          "view_claims",
          "create_claims",
          "edit_claims",
          "approve_claims",
          "reject_claims",
          "view_policies",
          "view_users",
          "view_reports",
          "export_reports",
        ],
      },
      {
        name: "claims_adjuster",
        description: "Processes claims but cannot approve or reject them",
        permissions: ["view_claims", "create_claims", "edit_claims", "view_policies", "view_reports"],
      },
    ]

    // Insert roles and their permissions
    for (const role of roles) {
      // Insert role
      const roleResult = await sql.query(`INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`, [
        role.name,
        role.description,
      ])

      const roleId = roleResult[0].id

      // Get permission IDs
      for (const permName of role.permissions) {
        const permResult = await sql.query(`SELECT id FROM permissions WHERE name = $1`, [permName])

        if (permResult.length > 0) {
          const permId = permResult[0].id

          // Insert role-permission relationship
          await sql.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [roleId, permId])
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error seeding roles and permissions:", error)
    return false
  }
}

export async function GET() {
  try {
    const tablesCreated = await ensureRolesTables()

    if (!tablesCreated) {
      return NextResponse.json(
        {
          error: "Could not create roles tables",
          roles: [],
        },
        { status: 500 },
      )
    }

    // Seed default data if needed
    await seedRolesAndPermissions()

    // Get all roles with their permissions
    const roles = await sql.query(`
      SELECT r.id, r.name, r.description, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `)

    // For each role, get its permissions
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role: any) => {
        const permissions = await sql.query(
          `
        SELECT p.id, p.name, p.description, p.category
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.category, p.name
      `,
          [role.id],
        )

        return {
          ...role,
          permissions,
        }
      }),
    )

    return NextResponse.json({ roles: rolesWithPermissions })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles", roles: [] }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, permissions } = await request.json()

    // Update role
    await sql.query(`UPDATE roles SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [
      name,
      description,
      id,
    ])

    // Delete existing permissions
    await sql.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id])

    // Add new permissions
    for (const permId of permissions) {
      await sql.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [id, permId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role", success: false }, { status: 500 })
  }
}
