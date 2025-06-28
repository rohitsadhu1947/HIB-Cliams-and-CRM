import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentClaims } from "@/components/recent-claims"
import { ClaimsStatusChart } from "@/components/claims-status-chart"
import { sql } from "@/lib/db"

export const revalidate = 0

async function getDashboardData() {
  // Get counts
  const totalClaims = await sql`SELECT COUNT(*) as count FROM claims`
  const pendingClaims = await sql`SELECT COUNT(*) as count FROM claims WHERE status = 'pending'`
  const approvedClaims = await sql`SELECT COUNT(*) as count FROM claims WHERE status = 'approved'`
  const rejectedClaims = await sql`SELECT COUNT(*) as count FROM claims WHERE status = 'rejected'`

  // Get monthly claims data - simplified query to fix the error
  const monthlyData = await sql`
    WITH month_data AS (
      SELECT 
        EXTRACT(MONTH FROM report_date)::integer AS month_num,
        to_char(report_date, 'Mon') AS name,
        COUNT(*) AS total
      FROM claims
      WHERE report_date >= NOW() - INTERVAL '1 year'
      GROUP BY EXTRACT(MONTH FROM report_date)::integer, to_char(report_date, 'Mon')
    ),
    all_months AS (
      SELECT 
        m.month_num,
        to_char(to_date(m.month_num::text, 'MM'), 'Mon') AS name,
        0 AS total
      FROM (SELECT generate_series(1, 12) AS month_num) m
    )
    SELECT 
      am.name,
      COALESCE(md.total, am.total) AS total
    FROM all_months am
    LEFT JOIN month_data md ON am.month_num = md.month_num
    ORDER BY am.month_num
  `

  // Get recent claims
  const recentClaims = await sql`
    SELECT 
      c.id, 
      c.claim_number, 
      p.policy_number,
      ph.name as claimant,
      c.report_date,
      c.estimated_amount,
      c.status
    FROM claims c
    JOIN policies p ON c.policy_id = p.id
    JOIN policy_holders ph ON p.policy_holder_id = ph.id
    ORDER BY c.report_date DESC
    LIMIT 5
  `

  return {
    totalClaims: totalClaims[0].count,
    pendingClaims: pendingClaims[0].count,
    approvedClaims: approvedClaims[0].count,
    rejectedClaims: rejectedClaims[0].count,
    monthlyData,
    recentClaims,
  }
}

export default async function Dashboard() {
  const data = await getDashboardData()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClaims}</div>
            <p className="text-xs text-muted-foreground">All claims in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">Claims awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.approvedClaims}</div>
            <p className="text-xs text-muted-foreground">Successfully processed claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rejectedClaims}</div>
            <p className="text-xs text-muted-foreground">Claims that were denied</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Claims Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={data.monthlyData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimsStatusChart
              pending={Number(data.pendingClaims)}
              approved={Number(data.approvedClaims)}
              rejected={Number(data.rejectedClaims)}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
          <CardDescription>Recently submitted and updated claims</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentClaims claims={data.recentClaims} />
        </CardContent>
      </Card>
    </div>
  )
}
