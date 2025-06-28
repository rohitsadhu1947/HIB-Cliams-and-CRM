import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Filter, Eye } from "lucide-react"
import Link from "next/link"

export default function VehiclesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicles Management</h1>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>Manage all insured vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search vehicles..." className="max-w-sm" />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    reg: "MH-01-AB-1234",
                    make: "Maruti Suzuki",
                    model: "Swift",
                    year: 2020,
                    owner: "Vikram Singh",
                    policy: "POL-2023-042",
                  },
                  {
                    reg: "KA-02-CD-5678",
                    make: "Hyundai",
                    model: "Creta",
                    year: 2021,
                    owner: "Priya Patel",
                    policy: "POL-2023-015",
                  },
                  {
                    reg: "DL-03-EF-9012",
                    make: "Honda",
                    model: "City",
                    year: 2019,
                    owner: "Rahul Sharma",
                    policy: "POL-2023-001",
                  },
                  {
                    reg: "TN-04-GH-3456",
                    make: "Toyota",
                    model: "Innova",
                    year: 2022,
                    owner: "Amit Kumar",
                    policy: "POL-2023-022",
                  },
                  {
                    reg: "GJ-05-IJ-7890",
                    make: "Tata",
                    model: "Nexon",
                    year: 2021,
                    owner: "Sneha Gupta",
                    policy: "POL-2023-031",
                  },
                ].map((vehicle, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{vehicle.reg}</TableCell>
                    <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.owner}</TableCell>
                    <TableCell>{vehicle.policy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/vehicles/${i + 1}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View vehicle</span>
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
