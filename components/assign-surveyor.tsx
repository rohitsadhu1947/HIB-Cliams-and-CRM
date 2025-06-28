"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { UserCheck, UserX } from "lucide-react"

interface Surveyor {
  id: number
  name: string
  specialization: string
}

interface AssignSurveyorProps {
  claimId: string
}

export function AssignSurveyor({ claimId }: AssignSurveyorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [surveyors, setSurveyors] = useState<Surveyor[]>([])
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<string>("")
  const [currentAssignment, setCurrentAssignment] = useState<any>(null)
  const router = useRouter()

  // Fetch surveyors
  useEffect(() => {
    async function fetchSurveyors() {
      try {
        const response = await fetch("/api/surveyors")
        if (!response.ok) throw new Error("Failed to fetch surveyors")

        const data = await response.json()
        setSurveyors(data.surveyors || [])
      } catch (error) {
        console.error("Error fetching surveyors:", error)
        toast({
          title: "Error",
          description: "Failed to load surveyors. Please try again.",
          variant: "destructive",
        })
      }
    }

    async function fetchCurrentAssignment() {
      try {
        const response = await fetch(`/api/claims/${claimId}/assign-surveyor`)
        if (!response.ok) throw new Error("Failed to fetch current assignment")

        const data = await response.json()
        if (data.assigned) {
          setCurrentAssignment(data.assignment)
          setSelectedSurveyorId(data.assignment.surveyor_id.toString())
        }
      } catch (error) {
        console.error("Error fetching current assignment:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurveyors()
    fetchCurrentAssignment()
  }, [claimId])

  const handleAssignSurveyor = async () => {
    if (!selectedSurveyorId) {
      toast({
        title: "Error",
        description: "Please select a surveyor",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/assign-surveyor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyorId: Number.parseInt(selectedSurveyorId),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign surveyor")
      }

      toast({
        title: "Surveyor assigned",
        description: "The surveyor has been successfully assigned to this claim",
      })

      // Refresh the page to show updated assignment
      router.refresh()
    } catch (error) {
      console.error("Error assigning surveyor:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign surveyor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAssignment = async () => {
    if (!currentAssignment) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/assign-surveyor`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove assignment")
      }

      toast({
        title: "Assignment removed",
        description: "The surveyor has been unassigned from this claim",
      })

      setCurrentAssignment(null)
      setSelectedSurveyorId("")

      // Refresh the page to show updated assignment
      router.refresh()
    } catch (error) {
      console.error("Error removing assignment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove assignment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Surveyor</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-4">
            {currentAssignment && (
              <div className="bg-muted p-4 rounded-md mb-4">
                <div className="font-medium">Currently Assigned:</div>
                <div className="flex items-center mt-2">
                  <UserCheck className="h-5 w-5 mr-2 text-green-500" />
                  <span>{currentAssignment.surveyor_name}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assigned on: {new Date(currentAssignment.assigned_at).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="surveyor">Select Surveyor</Label>
              <Select value={selectedSurveyorId} onValueChange={setSelectedSurveyorId}>
                <SelectTrigger id="surveyor">
                  <SelectValue placeholder="Select a surveyor" />
                </SelectTrigger>
                <SelectContent>
                  {surveyors.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No surveyors available
                    </SelectItem>
                  ) : (
                    surveyors.map((surveyor) => (
                      <SelectItem key={surveyor.id} value={surveyor.id.toString()}>
                        {surveyor.name} - {surveyor.specialization}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAssignSurveyor}
                disabled={isSubmitting || surveyors.length === 0}
                className="flex-1"
              >
                {currentAssignment ? "Reassign Surveyor" : "Assign Surveyor"}
              </Button>

              {currentAssignment && (
                <Button variant="destructive" onClick={handleRemoveAssignment} disabled={isSubmitting}>
                  <UserX className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
