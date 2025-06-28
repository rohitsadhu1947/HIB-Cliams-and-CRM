"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface UpdateClaimStatusProps {
  claimId: string
  currentStatus: string
  currentAmount?: number
}

export function UpdateClaimStatus({ claimId, currentStatus, currentAmount }: UpdateClaimStatusProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [approvedAmount, setApprovedAmount] = useState(currentAmount?.toString() || "")
  const router = useRouter()

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          approvedAmount: newStatus === "approved" ? Number.parseInt(approvedAmount, 10) || null : null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error("Failed to update claim status")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to update claim status")
      }

      toast({
        title: "Status updated",
        description: `Claim status has been updated to ${newStatus}`,
      })

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error("Error updating claim status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Claim Status</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newStatus === "approved" && (
            <div className="space-y-2">
              <Label htmlFor="approvedAmount">Approved Amount (₹)</Label>
              <Input
                id="approvedAmount"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Enter approved amount"
              />
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
