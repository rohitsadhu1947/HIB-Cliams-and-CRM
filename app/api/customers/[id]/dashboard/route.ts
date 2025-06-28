import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    // Get comprehensive customer data (using your existing policy_holders table)
    const customerData = await sql`
      SELECT 
        ph.*,
        COUNT(DISTINCT p.id) as total_policies,
        COUNT(DISTINCT c.id) as total_claims,
        COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_claims,
        COUNT(DISTINCT CASE WHEN c.status = 'pending' THEN c.id END) as pending_claims,
        COALESCE(SUM(pp.amount_paid), 0) as lifetime_premium_paid,
        MAX(ci.interaction_date) as last_interaction_date,
        COUNT(DISTINCT v.id) as total_vehicles
      FROM policy_holders ph
      LEFT JOIN policies p ON p.policy_holder_id = ph.id
      LEFT JOIN claims c ON c.policy_id = p.id
      LEFT JOIN premium_payments pp ON pp.customer_id = ph.id
      LEFT JOIN customer_interactions ci ON ci.customer_id = ph.id
      LEFT JOIN vehicles v ON v.policy_holder_id = ph.id
      WHERE ph.id = ${customerId}
      GROUP BY ph.id
    `

    if (customerData.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get recent activity timeline
    const recentActivity = await sql`
      SELECT 
        'Policy Created' as activity_type,
        p.created_at as activity_date,
        'Policy ' || p.policy_number || ' created' as title,
        'New ' || p.policy_type || ' policy for ' || v.make || ' ' || v.model as description,
        'policy' as related_entity_type,
        p.id as related_entity_id
      FROM policies p
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.policy_holder_id = ${customerId}
      
      UNION ALL
      
      SELECT 
        'Claim Filed' as activity_type,
        c.created_at as activity_date,
        'Claim ' || c.claim_number || ' filed' as title,
        'Claim for incident on ' || c.incident_date::text as description,
        'claim' as related_entity_type,
        c.id as related_entity_id
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      WHERE p.policy_holder_id = ${customerId}
      
      UNION ALL
      
      SELECT 
        'Payment Made' as activity_type,
        pp.payment_date::timestamp as activity_date,
        'Premium payment of ₹' || pp.amount_paid::text as title,
        'Payment via ' || pp.payment_method as description,
        'payment' as related_entity_type,
        pp.id as related_entity_id
      FROM premium_payments pp
      WHERE pp.customer_id = ${customerId}
      
      ORDER BY activity_date DESC 
      LIMIT 15
    `

    // Get active policies with vehicle details
    const activePolicies = await sql`
      SELECT 
        p.*, 
        v.make, 
        v.model, 
        v.registration_number,
        v.year
      FROM policies p
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.policy_holder_id = ${customerId} 
        AND (p.status = 'active' OR p.status IS NULL)
      ORDER BY p.start_date DESC
    `

    // Get recent claims with status
    const recentClaims = await sql`
      SELECT 
        c.*, 
        p.policy_number,
        v.make,
        v.model
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.policy_holder_id = ${customerId}
      ORDER BY c.created_at DESC
      LIMIT 5
    `

    // Get payment summary
    const paymentSummary = await sql`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount_paid), 0) as total_amount_paid,
        MAX(payment_date) as last_payment_date,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments
      FROM premium_payments 
      WHERE customer_id = ${customerId}
    `

    // Get recent interactions
    const recentInteractions = await sql`
      SELECT 
        ci.*,
        u.full_name as agent_name
      FROM customer_interactions ci
      LEFT JOIN users u ON ci.agent_id = u.id
      WHERE ci.customer_id = ${customerId}
      ORDER BY ci.interaction_date DESC
      LIMIT 5
    `

    // Calculate risk factors
    const claimFrequency =
      customerData[0].total_claims > 0 ? customerData[0].approved_claims / customerData[0].total_policies : 0

    const riskFactors = {
      claimFrequency: claimFrequency,
      paymentHistory: paymentSummary[0]?.failed_payments || 0,
      customerTenure: customerData[0].customer_since
        ? Math.floor(
            (new Date().getTime() - new Date(customerData[0].customer_since).getTime()) / (1000 * 60 * 60 * 24 * 365),
          )
        : 0,
    }

    return NextResponse.json({
      customer: customerData[0],
      recentActivity: recentActivity,
      activePolicies: activePolicies,
      recentClaims: recentClaims,
      paymentSummary: paymentSummary[0] || {},
      recentInteractions: recentInteractions,
      riskFactors: riskFactors,
      summary: {
        totalPolicies: Number.parseInt(customerData[0].total_policies),
        totalClaims: Number.parseInt(customerData[0].total_claims),
        approvedClaims: Number.parseInt(customerData[0].approved_claims),
        pendingClaims: Number.parseInt(customerData[0].pending_claims),
        lifetimePremiumPaid: Number.parseFloat(customerData[0].lifetime_premium_paid || 0),
        totalVehicles: Number.parseInt(customerData[0].total_vehicles),
      },
    })
  } catch (error) {
    console.error("Error fetching customer dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch customer data" }, { status: 500 })
  }
}
