import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, Users, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export const revalidate = 0

async function getCustomersData() {
  try {
    const customers = await sql`
      SELECT 
        ph.id,
        ph.name,
        ph.email,
        ph.phone,
        ph.address,
        ph.customer_since,
        ph.customer_status,
        ph.customer_segment,
        ph.risk_score,
        COUNT(DISTINCT p.id) as total_policies,
        COUNT(DISTINCT c.id) as total_claims,
        COALESCE(SUM(pp.amount_paid), 0) as lifetime_premium
      FROM policy_holders ph
      LEFT JOIN policies p ON p.policy_holder_id = ph.id
      LEFT JOIN claims c ON c.policy_id = p.id
      LEFT JOIN premium_payments pp ON pp.customer_id = ph.id
      GROUP BY ph.id, ph.name, ph.email, ph.phone, ph.address, ph.customer_since, ph.customer_status, ph.customer_segment, ph.risk_score
      ORDER BY ph.name ASC
    `
    return customers
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

export default async function CustomersPage() {
  const customers = await getCustomersData()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer 360</h1>
          <p className="text-muted-foreground">Comprehensive customer management and insights</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Customers ({customers.length})
          </CardTitle>
          <CardDescription>Complete customer portfolio with 360° insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search customers..." className="max-w-sm" />
              <Button variant="outline">Filter</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Premium Paid</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => {
                  const riskLevel = customer.risk_score > 70 ? "High" : customer.risk_score > 40 ? "Medium" : "Low"

                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Customer since:{" "}
                            {customer.customer_since ? new Date(customer.customer_since).getFullYear() : "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.total_policies}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.total_claims > 3 ? "destructive" : "outline"}>
                          {customer.total_claims}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(Number.parseFloat(customer.lifetime_premium || 0))}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            riskLevel === "High" ? "destructive" : riskLevel === "Medium" ? "default" : "secondary"
                          }
                        >
                          {riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.customer_segment || "Standard"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View customer 360</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
