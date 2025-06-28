import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Eye } from "lucide-react"
import Link from "next/link"

export default function SurveyorsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Surveyors</h1>
        <Button asChild>
          <Link href="/surveyors/new">
            <Plus className="mr-2 h-4 w-4" /> Add Surveyor
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Surveyors</CardTitle>
          <CardDescription>Manage all surveyors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search surveyors..." className="max-w-sm" />
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
                  <TableHead>License Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "Rajesh Kumar",
                    license: "SUR-MH-2021-001",
                    phone: "+91 98765 12345",
                    email: "rajesh.kumar@example.com",
                    location: "Mumbai, Maharashtra",
                    status: "active",
                  },
                  {
                    name: "Sunil Verma",
                    license: "SUR-DL-2020-042",
                    phone: "+91 87654 23456",
                    email: "sunil.verma@example.com",
                    location: "Delhi, Delhi",
                    status: "active",
                  },
                  {
                    name: "Meena Iyer",
                    license: "SUR-KA-2019-078",
                    phone: "+91 76543 34567",
                    email: "meena.iyer@example.com",
                    location: "Bangalore, Karnataka",
                    status: "inactive",
                  },
                  {
                    name: "Prakash Reddy",
                    license: "SUR-TN-2022-015",
                    phone: "+91 65432 45678",
                    email: "prakash.reddy@example.com",
                    location: "Chennai, Tamil Nadu",
                    status: "active",
                  },
                  {
                    name: "Anita Patel",
                    license: "SUR-GJ-2021-103",
                    phone: "+91 54321 56789",
                    email: "anita.patel@example.com",
                    location: "Ahmedabad, Gujarat",
                    status: "active",
                  },
                ].map((surveyor, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{surveyor.name}</TableCell>
                    <TableCell>{surveyor.license}</TableCell>
                    <TableCell>
                      <div>{surveyor.phone}</div>
                      <div className="text-sm text-muted-foreground">{surveyor.email}</div>
                    </TableCell>
                    <TableCell>{surveyor.location}</TableCell>
                    <TableCell>
                      <Badge variant={surveyor.status === "active" ? "success" : "outline"}>{surveyor.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/surveyors/${i + 1}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View surveyor</span>
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
