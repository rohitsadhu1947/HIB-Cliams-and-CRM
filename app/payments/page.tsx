import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Filter, Eye, Download } from "lucide-react"
import Link from "next/link"

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button variant="outline" asChild>
          <Link href="/payments/report">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claim Payments</CardTitle>
          <CardDescription>Track all claim payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search payments..." className="max-w-sm" />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Policy Holder</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: "PAY-2023-001",
                    claim: "CLM-2023-002",
                    holder: "Priya Patel",
                    date: "2023-06-02",
                    amount: "₹32,500",
                    method: "NEFT",
                    status: "completed",
                  },
                  {
                    id: "PAY-2023-002",
                    claim: "CLM-2023-005",
                    holder: "Vikram Singh",
                    date: "2023-06-05",
                    amount: "₹48,000",
                    method: "NEFT",
                    status: "completed",
                  },
                  {
                    id: "PAY-2023-003",
                    claim: "CLM-2023-007",
                    holder: "Neha Verma",
                    date: "2023-06-10",
                    amount: "₹28,000",
                    method: "IMPS",
                    status: "completed",
                  },
                  {
                    id: "PAY-2023-004",
                    claim: "CLM-2023-008",
                    holder: "Rajesh Khanna",
                    date: "2023-06-15",
                    amount: "₹65,000",
                    method: "NEFT",
                    status: "pending",
                  },
                  {
                    id: "PAY-2023-005",
                    claim: "CLM-2023-010",
                    holder: "Ananya Desai",
                    date: "2023-06-18",
                    amount: "₹42,000",
                    method: "IMPS",
                    status: "completed",
                  },
                ].map((payment, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.claim}</TableCell>
                    <TableCell>{payment.holder}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "completed" ? "success" : "outline"}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/payments/${i + 1}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View payment</span>
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
