import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    console.log("Seeding sample renewal data...");

    // First, ensure we have some policies to create renewals for
    const policiesCount = await sql`SELECT COUNT(*) FROM policies`;
    console.log("Current policies count:", policiesCount[0].count);

    if (policiesCount[0].count === "0") {
      // Create some sample policies first
      await sql`
        INSERT INTO policies (policy_number, policy_holder_id, vehicle_id, policy_type, start_date, end_date, premium_amount, coverage_amount, status)
        SELECT 
          'POL-' || LPAD(ph.id::text, 4, '0') || '-2024',
          ph.id,
          v.id,
          'Comprehensive',
          CURRENT_DATE - INTERVAL '11 months',
          CURRENT_DATE + INTERVAL '1 month',
          15000.00,
          500000.00,
          'active'
        FROM policy_holders ph
        JOIN vehicles v ON v.policy_holder_id = ph.id
        WHERE NOT EXISTS (
          SELECT 1 FROM policies p 
          WHERE p.policy_holder_id = ph.id 
          AND p.vehicle_id = v.id
        )
        LIMIT 5
      `;
      console.log("Created sample policies");
    }

    // Check if renewal_cycles table has data
    const cyclesCount = await sql`SELECT COUNT(*) FROM renewal_cycles`;
    if (cyclesCount[0].count === "0") {
      // Insert default renewal cycles
      await sql`
        INSERT INTO renewal_cycles (name, description, start_date, end_date) VALUES
        ('Q1 2024', 'First quarter renewal cycle', '2024-01-01', '2024-03-31'),
        ('Q2 2024', 'Second quarter renewal cycle', '2024-04-01', '2024-06-30'),
        ('Q3 2024', 'Third quarter renewal cycle', '2024-07-01', '2024-09-30'),
        ('Q4 2024', 'Fourth quarter renewal cycle', '2024-10-01', '2024-12-31')
      `;
      console.log("Created renewal cycles");
    }

    // Create sample renewals
    const result = await sql`
      INSERT INTO policy_renewals (
        policy_id,
        renewal_date,
        renewal_cycle_id,
        status,
        renewal_premium,
        original_premium,
        assigned_to,
        assigned_at,
        first_contact_date,
        last_contact_date,
        contact_count,
        renewal_notes,
        conversion_status
      )
      SELECT 
        p.id,
        p.end_date + INTERVAL '30 days',
        rc.id,
        CASE 
          WHEN p.end_date < CURRENT_DATE THEN 'overdue'
          WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
          ELSE 'pending'
        END,
        p.premium_amount * 1.1,
        p.premium_amount,
        u.id,
        CURRENT_TIMESTAMP,
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_DATE - INTERVAL '5 days',
        FLOOR(RANDOM() * 5) + 1,
        CASE 
          WHEN p.end_date < CURRENT_DATE THEN 'Policy expired, urgent renewal needed'
          WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Renewal due soon, customer contacted'
          ELSE 'Standard renewal process initiated'
        END,
        CASE 
          WHEN p.end_date < CURRENT_DATE - INTERVAL '60 days' THEN 'lost'
          WHEN p.end_date < CURRENT_DATE THEN 'pending'
          ELSE 'pending'
        END
      FROM policies p
      CROSS JOIN renewal_cycles rc
      CROSS JOIN users u
      WHERE p.status = 'active'
        AND rc.is_active = true
        AND u.role = 'admin'
        AND NOT EXISTS (
          SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
        )
      LIMIT 10
    `;

    console.log("Created sample renewals");

    // Get the count of renewals created
    const renewalsCount = await sql`SELECT COUNT(*) FROM policy_renewals`;
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully created sample renewal data. Total renewals: ${renewalsCount[0].count}` 
    });

  } catch (error) {
    console.error("Error seeding renewal data:", error);
    return NextResponse.json({ 
      error: "Failed to seed renewal data", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 