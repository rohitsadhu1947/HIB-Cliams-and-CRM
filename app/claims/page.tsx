"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Eye, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// Sample data to use as fallback
const SAMPLE_CLAIMS = [
  {
    id: 1,
    claim_number: "CLM-202505-017",
    policy_number: "POL-2023-003",
    claimant: "Rahul Sharma",
    incident_date: "2025-05-09",
    report_date: "2025-05-10",
    estimated_amount: 75000,
    status: "pending",
  },
  {
    id: 2,
    claim_number: "CLM-202505-013",
    policy_number: "POL-2023-009",
    claimant: "Suresh Reddy",
    incident_date: "2025-05-08",
    report_date: "2025-05-09",
    estimated_amount: 45000,
    status: "pending",
  },
  {
    id: 3,
    claim_number: "CLM-202505-015",
    policy_number: "POL-2023-001",
    claimant: "Vikram Singh",
    incident_date: "2025-05-07",
    report_date: "2025-05-08",
    estimated_amount: 75000,
    status: "pending",
  },
]

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    async function fetchClaims() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/claims")

        if (!response.ok) {
          throw new Error("Failed to fetch claims")
        }

        const data = await response.json()
        setClaims(data.claims || [])
      } catch (error) {
        console.error("Error fetching claims:", error)
        // Use sample data as fallback
        setClaims(SAMPLE_CLAIMS)
        toast({
          title: "Using sample data",
          description: "Could not connect to the database. Showing sample data instead.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClaims()
  }, [])

  // Filter claims based on search query and status
  const filteredClaims = claims.filter((claim) => {
    // First filter by status
    if (statusFilter !== "all" && claim.status !== statusFilter) {
      return false
    }

    // Then filter by search query
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    return (
      claim.claim_number.toLowerCase().includes(query) ||
      claim.policy_number.toLowerCase().includes(query) ||
      claim.claimant.toLowerCase().includes(query) ||
      String(claim.estimated_amount).includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <Button asChild>
          <Link href="/claims/new">
            <Plus className="mr-2 h-4 w-4" /> New Claim
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
          <CardDescription>Manage and track all insurance claims</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <Input
                  placeholder="Search claims..."
                  className="max-w-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
              <Select defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Incident Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading claims...
                    </TableCell>
                  </TableRow>
                ) : filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No claims found matching "{searchQuery}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>{claim.policy_number}</TableCell>
                      <TableCell>{claim.claimant}</TableCell>
                      <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
