import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Car, User, Calendar, IndianRupee, FileText, Shield, Eye } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { notFound, redirect } from "next/navigation"

export const revalidate = 0

async function getPolicyData(id: string) {
  // If the ID is "new", redirect to the new policy page
  if (id === "new") {
    return null
  }

  // Get policy details
  const policies = await sql`
    SELECT 
      p.*,
      ph.name as policy_holder_name,
      ph.phone as policy_holder_phone,
      ph.email as policy_holder_email,
      ph.address as policy_holder_address,
      v.make,
      v.model,
      v.registration_number,
      v.year,
      v.engine_number,
      v.chassis_number,
      v.vehicle_type
    FROM policies p
    JOIN policy_holders ph ON p.policy_holder_id = ph.id
    JOIN vehicles v ON p.vehicle_id = v.id
    WHERE p.id = ${id}
  `

  if (policies.length === 0) {
    return null
  }

  // Get related claims
  const claims = await sql`
    SELECT 
      c.id,
      c.claim_number,
      c.incident_date,
      c.report_date,
      c.estimated_amount,
      c.approved_amount,
      c.status
    FROM claims c
    WHERE c.policy_id = ${id}
    ORDER BY c.report_date DESC
  `

  return {
    policy: policies[0],
    claims,
  }
}

export default async function PolicyDetailsPage({ params }: { params: { id: string } }) {
  // If the ID is "new", redirect to the new policy page
  if (params.id === "new") {
    redirect("/policies/new")
  }

  const data = await getPolicyData(params.id)

  if (!data) {
    notFound()
  }

  const { policy, claims } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Policy Details</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{policy.policy_number}</CardTitle>
                <CardDescription>{policy.policy_type} Policy</CardDescription>
              </div>
              <Badge
                variant={
                  policy.status === "active" ? "success" : policy.status === "pending" ? "outline" : "destructive"
                }
                className="text-sm"
              >
                {policy.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Policy Holder
                  </h3>
                  <p>{policy.policy_holder_name}</p>
                  <p className="text-sm text-muted-foreground">{policy.policy_holder_phone}</p>
                  <p className="text-sm text-muted-foreground">{policy.policy_holder_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> Vehicle
                  </h3>
                  <p>
                    {policy.make} {policy.model} ({policy.year})
                  </p>
                  <p className="text-sm text-muted-foreground">{policy.registration_number}</p>
                  <p className="text-sm text-muted-foreground">Type: {policy.vehicle_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Engine & Chassis
                  </h3>
                  <p className="text-sm">Engine: {policy.engine_number}</p>
                  <p className="text-sm">Chassis: {policy.chassis_number}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Policy Period
                  </h3>
                  <p>From: {new Date(policy.start_date).toLocaleDateString()}</p>
                  <p>To: {new Date(policy.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Premium Amount
                  </h3>
                  <p>{formatCurrency(policy.premium_amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Coverage Amount
                  </h3>
                  <p>{formatCurrency(policy.coverage_amount)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="claims">
        <TabsList>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Claims History</CardTitle>
            </CardHeader>
            <CardContent>
              {claims.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Incident Date</TableHead>
                      <TableHead>Report Date</TableHead>
                      <TableHead>Estimated Amount</TableHead>
                      <TableHead>Approved Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claim_number}</TableCell>
                        <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(claim.report_date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(claim.estimated_amount)}</TableCell>
                        <TableCell>{claim.approved_amount ? formatCurrency(claim.approved_amount) : "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              claim.status === "approved"
                                ? "success"
                                : claim.status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/claims/${claim.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View claim</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No claims found for this policy</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Policy Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">No policy documents found</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
