import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Filter, Eye } from "lucide-react"
import Link from "next/link"

export default function PolicyHoldersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Policy Holders</h1>
        <Button asChild>
          <Link href="/policy-holders/new">
            <Plus className="mr-2 h-4 w-4" /> Add Policy Holder
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Holders</CardTitle>
          <CardDescription>Manage all policy holders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search policy holders..." className="max-w-sm" />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "Vikram Singh",
                    phone: "+91 98765 43210",
                    email: "vikram.singh@example.com",
                    address: "123 Main Street, Andheri East, Mumbai, Maharashtra",
                    policies: 2,
                    claims: 1,
                  },
                  {
                    name: "Priya Patel",
                    phone: "+91 87654 32109",
                    email: "priya.patel@example.com",
                    address: "456 Park Avenue, Indiranagar, Bangalore, Karnataka",
                    policies: 1,
                    claims: 1,
                  },
                  {
                    name: "Rahul Sharma",
                    phone: "+91 76543 21098",
                    email: "rahul.sharma@example.com",
                    address: "789 Lake View, Connaught Place, New Delhi, Delhi",
                    policies: 3,
                    claims: 2,
                  },
                  {
                    name: "Amit Kumar",
                    phone: "+91 65432 10987",
                    email: "amit.kumar@example.com",
                    address: "101 River Road, T Nagar, Chennai, Tamil Nadu",
                    policies: 1,
                    claims: 1,
                  },
                  {
                    name: "Sneha Gupta",
                    phone: "+91 54321 09876",
                    email: "sneha.gupta@example.com",
                    address: "202 Hill View, Navrangpura, Ahmedabad, Gujarat",
                    policies: 2,
                    claims: 1,
                  },
                ].map((holder, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{holder.name}</TableCell>
                    <TableCell>
                      <div>{holder.phone}</div>
                      <div className="text-sm text-muted-foreground">{holder.email}</div>
                    </TableCell>
                    <TableCell>{holder.address}</TableCell>
                    <TableCell>{holder.policies}</TableCell>
                    <TableCell>{holder.claims}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/policy-holders/${i + 1}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View policy holder</span>
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
