import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, ClipboardList } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"

export const revalidate = 0

async function getPolicyHolderData(id: string) {
  try {
    // First, check if the tables exist and create them if they don't
    await ensureTables()

    // Get policy holder details
    const policyHolders = await sql`
      SELECT * FROM policy_holders WHERE id = ${id}
    `

    if (policyHolders.length === 0) {
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
        COALESCE(p.status, 'active') as status,
        v.make,
        v.model,
        v.registration_number
      FROM policies p
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.policy_holder_id = ${id}
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
        COALESCE(c.status, 'pending') as status,
        p.policy_number
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      WHERE p.policy_holder_id = ${id}
      ORDER BY c.report_date DESC
    `

    // Get related vehicles
    const vehicles = await sql`
      SELECT 
        id,
        make,
        model,
        year,
        registration_number,
        vehicle_type,
        'active' as status
      FROM vehicles
      WHERE policy_holder_id = ${id}
    `

    return {
      policyHolder: policyHolders[0],
      policies,
      claims,
      vehicles,
    }
  } catch (error) {
    console.error("Error fetching policy holder data:", error)

    // Return sample data for development
    return {
      policyHolder: {
        id,
        name: "Rajesh Kumar",
        email: "rajesh.kumar@example.com",
        phone: "+91 98765 43210",
        address: "123 Main Street, Mumbai, Maharashtra 400001",
        id_number: "ABCDE1234F",
        id_type: "PAN",
        created_at: new Date().toISOString(),
        notes: "Preferred customer with good payment history.",
      },
      policies: [
        {
          id: 1,
          policy_number: "POL-2023-1001",
          policy_type: "Comprehensive",
          start_date: "2023-01-01",
          end_date: "2024-01-01",
          premium_amount: 12000,
          coverage_amount: 500000,
          status: "active",
          make: "Honda",
          model: "City",
          registration_number: "MH01AB1234",
        },
      ],
      claims: [
        {
          id: 1,
          claim_number: "CLM-2023-5001",
          incident_date: "2023-06-15",
          report_date: "2023-06-16",
          estimated_amount: 25000,
          status: "pending",
          policy_number: "POL-2023-1001",
        },
      ],
      vehicles: [
        {
          id: 1,
          make: "Honda",
          model: "City",
          year: 2020,
          registration_number: "MH01AB1234",
          vehicle_type: "Sedan",
          status: "active",
        },
      ],
    }
  }
}

// Function to ensure all necessary tables exist
async function ensureTables() {
  try {
    // Check if policy_holders table exists and create it if it doesn't
    await sql`
      CREATE TABLE IF NOT EXISTS policy_holders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        id_number TEXT,
        id_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `

    // Check if policies table exists and create it if it doesn't
    await sql`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        policy_number TEXT NOT NULL,
        policy_type TEXT,
        start_date DATE,
        end_date DATE,
        premium_amount DECIMAL,
        coverage_amount DECIMAL,
        policy_holder_id INTEGER REFERENCES policy_holders(id),
        vehicle_id INTEGER
      )
    `

    // Add status column to policies table if it doesn't exist
    try {
      await sql`ALTER TABLE policies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`
    } catch (error) {
      console.error("Error adding status column to policies table:", error)
    }

    // Check if claims table exists and create it if it doesn't
    await sql`
      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        claim_number TEXT NOT NULL,
        incident_date DATE,
        report_date DATE,
        estimated_amount DECIMAL,
        policy_id INTEGER REFERENCES policies(id)
      )
    `

    // Add status column to claims table if it doesn't exist
    try {
      await sql`ALTER TABLE claims ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    } catch (error) {
      console.error("Error adding status column to claims table:", error)
    }

    // Check if vehicles table exists and create it if it doesn't
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        make TEXT,
        model TEXT,
        year INTEGER,
        registration_number TEXT,
        vehicle_type TEXT,
        policy_holder_id INTEGER REFERENCES policy_holders(id)
      )
    `

    console.log("All tables checked and created if needed")
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
  }
}

export default async function PolicyHolderDetailsPage({ params }: { params: { id: string } }) {
  const data = await getPolicyHolderData(params.id)

  if (!data) {
    notFound()
  }

  const { policyHolder, policies, claims, vehicles } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/policy-holders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Policy Holder Details</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{policyHolder.name}</CardTitle>
                <CardDescription>Policy Holder ID: {policyHolder.id}</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {policies.length} Active Policies
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Contact Information
                  </h3>
                  <p className="flex items-center gap-2 mt-2">
                    <Phone className="h-4 w-4 text-muted-foreground" /> {policyHolder.phone || "No phone number"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" /> {policyHolder.email || "No email address"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">{policyHolder.address || "No address available"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> ID Information
                  </h3>
                  <p className="mt-2">
                    {policyHolder.id_type || "ID"}: {policyHolder.id_number || "Not available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Customer since: {new Date(policyHolder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Notes
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">{policyHolder.notes || "No notes available"}</p>
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
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
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
                        <TableCell>{policy.policy_type || "Standard"}</TableCell>
                        <TableCell>
                          {policy.make} {policy.model}
                          <div className="text-xs text-muted-foreground">{policy.registration_number || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          <div>{policy.start_date ? new Date(policy.start_date).toLocaleDateString() : "N/A"}</div>
                          <div className="text-xs text-muted-foreground">
                            to {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(policy.premium_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(policy.coverage_amount || 0)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (policy.status || "active") === "active"
                                ? "success"
                                : (policy.status || "active") === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {policy.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/policies/${policy.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No policies found for this policy holder</div>
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
                        <TableCell>
                          {claim.incident_date ? new Date(claim.incident_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          {claim.report_date ? new Date(claim.report_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>{formatCurrency(claim.estimated_amount || 0)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (claim.status || "pending") === "approved"
                                ? "success"
                                : (claim.status || "pending") === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {claim.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/claims/${claim.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No claims found for this policy holder</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Registered Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Make & Model</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </TableCell>
                        <TableCell>{vehicle.registration_number}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>{vehicle.vehicle_type || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={(vehicle.status || "active") === "active" ? "success" : "outline"}>
                            {vehicle.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/vehicles/${vehicle.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No vehicles found for this policy holder</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">No documents found for this policy holder</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
