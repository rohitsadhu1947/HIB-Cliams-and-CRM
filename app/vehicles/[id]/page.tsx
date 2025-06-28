import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Car, User, Calendar, Eye, Wrench } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { notFound, redirect } from "next/navigation"

export const revalidate = 0

async function getVehicleData(id: string) {
  // If the ID is "new", redirect to the new vehicle page
  if (id === "new") {
    redirect("/vehicles/new")
  }

  // Get vehicle details
  const vehicles = await sql`
    SELECT 
      v.*,
      ph.name as owner_name,
      ph.phone as owner_phone,
      ph.email as owner_email
    FROM vehicles v
    JOIN policy_holders ph ON v.policy_holder_id = ph.id
    WHERE v.id = ${id}
  `

  if (vehicles.length === 0) {
    return null
  }

  // Get related policies
  const policies = await sql`
    SELECT 
      p.id,
      p.policy_number,
      p.policy_type,
      p.start_date,
      p.end_date,
      p.premium_amount,
      p.coverage_amount,
      p.status
    FROM policies p
    WHERE p.vehicle_id = ${id}
    ORDER BY p.start_date DESC
  `

  // Get related claims
  const claims = await sql`
    SELECT 
      c.id,
      c.claim_number,
      c.incident_date,
      c.report_date,
      c.estimated_amount,
      c.status,
      p.policy_number
    FROM claims c
    JOIN policies p ON c.policy_id = p.id
    WHERE p.vehicle_id = ${id}
    ORDER BY c.report_date DESC
  `

  return {
    vehicle: vehicles[0],
    policies,
    claims,
  }
}

export default async function VehicleDetailsPage({ params }: { params: { id: string } }) {
  const data = await getVehicleData(params.id)

  if (!data) {
    notFound()
  }

  const { vehicle, policies, claims } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {vehicle.make} {vehicle.model}
                </CardTitle>
                <CardDescription>{vehicle.registration_number}</CardDescription>
              </div>
              <Badge variant={vehicle.status === "active" ? "success" : "outline"} className="text-sm">
                {vehicle.status || "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> Vehicle Information
                  </h3>
                  <p>Make: {vehicle.make}</p>
                  <p>Model: {vehicle.model}</p>
                  <p>Year: {vehicle.year}</p>
                  <p>Registration: {vehicle.registration_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Technical Details
                  </h3>
                  <p>Engine Number: {vehicle.engine_number}</p>
                  <p>Chassis Number: {vehicle.chassis_number}</p>
                  <p>Vehicle Type: {vehicle.vehicle_type}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Owner Information
                  </h3>
                  <p>{vehicle.owner_name}</p>
                  <p className="text-sm text-muted-foreground">{vehicle.owner_phone}</p>
                  <p className="text-sm text-muted-foreground">{vehicle.owner_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Registration Details
                  </h3>
                  <p>
                    Registration Date:{" "}
                    {vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : "N/A"}
                  </p>
                  <p>
                    Fitness Valid Until:{" "}
                    {vehicle.fitness_valid_until ? new Date(vehicle.fitness_valid_until).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Policies</CardTitle>
            </CardHeader>
            <CardContent>
              {policies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy #</TableHead>
                      <TableHead>Type</TableHead>
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
                        <TableCell>{policy.policy_type}</TableCell>
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
              ) : (
                <div className="text-center py-4 text-muted-foreground">No policies found for this vehicle</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
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
                      <TableHead>Policy #</TableHead>
                      <TableHead>Incident Date</TableHead>
                      <TableHead>Report Date</TableHead>
                      <TableHead>Estimated Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claim_number}</TableCell>
                        <TableCell>{claim.policy_number}</TableCell>
                        <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(claim.report_date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(claim.estimated_amount)}</TableCell>
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
                <div className="text-center py-4 text-muted-foreground">No claims found for this vehicle</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">No vehicle documents found</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
