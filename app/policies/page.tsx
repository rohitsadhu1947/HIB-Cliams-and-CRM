import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Filter, Eye } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export const revalidate = 0

async function getPoliciesData() {
  const policies = await sql`
    SELECT 
      p.id, 
      p.policy_number, 
      ph.name as policy_holder,
      v.registration_number,
      v.make,
      v.model,
      p.start_date,
      p.end_date,
      p.premium_amount,
      p.coverage_amount,
      p.policy_type,
      p.status
    FROM policies p
    JOIN policy_holders ph ON p.policy_holder_id = ph.id
    JOIN vehicles v ON p.vehicle_id = v.id
    ORDER BY p.start_date DESC
  `

  return policies
}

export default async function PoliciesPage() {
  const policies = await getPoliciesData()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Policies Management</h1>
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" /> New Policy
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
          <CardDescription>Manage all insurance policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search policies..." className="max-w-sm" />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.policy_number}</TableCell>
                    <TableCell>{policy.policy_holder}</TableCell>
                    <TableCell>
                      <div>{`${policy.make} ${policy.model}`}</div>
                      <div className="text-xs text-muted-foreground">{policy.registration_number}</div>
                    </TableCell>
                    <TableCell>
                      <div>{new Date(policy.start_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        to {new Date(policy.end_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(policy.premium_amount)}</TableCell>
                    <TableCell>{formatCurrency(policy.coverage_amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          policy.status === "active"
                            ? "success"
                            : policy.status === "pending"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/policies/${policy.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View policy</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
