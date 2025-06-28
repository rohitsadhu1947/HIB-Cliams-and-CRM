"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface Claim {
  id: number
  claim_number: string
  policy_number: string
  claimant: string
  report_date: string
  estimated_amount: number
  status: string
}

interface RecentClaimsProps {
  claims: Claim[]
}

export function RecentClaims({ claims }: RecentClaimsProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claim #</TableHead>
          <TableHead>Policy #</TableHead>
          <TableHead>Claimant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.map((claim) => (
          <TableRow key={claim.id}>
            <TableCell className="font-medium">{claim.claim_number}</TableCell>
            <TableCell>{claim.policy_number}</TableCell>
            <TableCell>{claim.claimant}</TableCell>
            <TableCell>{new Date(claim.report_date).toLocaleDateString()}</TableCell>
            <TableCell>{formatCurrency(claim.estimated_amount)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  claim.status === "approved" ? "success" : claim.status === "pending" ? "outline" : "destructive"
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
  )
}
