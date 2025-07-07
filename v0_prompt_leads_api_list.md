# v0.dev Prompt for Robust Leads List API

**Prompt:**

Create a Next.js API route for listing leads with pagination and filters. The endpoint should be GET /api/leads (file: app/api/leads/route.ts). It should:

- Support query parameters: page, limit, search, status, source_id, assigned_to
- Return a paginated response: { leads: Lead[], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }
- Use Neon DB (PostgreSQL) and TypeScript
- Avoid errors if no rows are returned from the count query
- Defensive code: check for countRows[0] before accessing .total
- Use joins to include source_name and assigned_user_name
- Order by created_at DESC

**TypeScript interfaces:**
```ts
interface Lead {
  id: number;
  lead_number: string;
  source_id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  industry?: string;
  lead_value?: number;
  status: string;
  priority: string;
  assigned_to?: number;
  assigned_at?: string;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface LeadWithRelations extends Lead {
  source_name?: string;
  assigned_user_name?: string;
}

interface PaginatedResponse<T> {
  leads: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

# Code for app/api/leads/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const sourceId = searchParams.get("source_id");
    const assignedTo = searchParams.get("assigned_to");

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(l.first_name ILIKE $${paramIndex} OR l.last_name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.company_name ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`l.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (sourceId) {
      conditions.push(`l.source_id = $${paramIndex}`);
      params.push(Number.parseInt(sourceId));
      paramIndex++;
    }

    if (assignedTo) {
      if (assignedTo === "unassigned") {
        conditions.push(`l.assigned_to IS NULL`);
      } else {
        conditions.push(`l.assigned_to = $${paramIndex}`);
        params.push(Number.parseInt(assignedTo));
        paramIndex++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leads l
      ${whereClause}
    `;
    const { rows: countRows } = await sql.query(countQuery, params);
    if (!countRows[0] || countRows[0].total === undefined) {
      return NextResponse.json({ error: "Count query failed" }, { status: 500 });
    }
    const total = Number.parseInt(countRows[0].total);

    // Get leads with pagination
    const leadsQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        u.name as assigned_user_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.source_id = ls.id
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const leadsParams = [...params, limit, offset];
    const { rows } = await sql.query(leadsQuery, leadsParams);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      leads: rows as LeadWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
} 