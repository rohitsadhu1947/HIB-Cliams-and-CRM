"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { CalendarIcon, ClipboardCheck, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddSurveyDetailsProps {
  claimId: string
}

export function AddSurveyDetails({ claimId }: AddSurveyDetailsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [surveyData, setSurveyData] = useState<any>(null)
  const [assignedSurveyor, setAssignedSurveyor] = useState<any>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    surveyLocation: "",
    surveyReport: "",
    surveyAmount: "",
    status: "pending",
  })
  const router = useRouter()

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch survey details
  useEffect(() => {
    async function fetchSurveyDetails() {
      try {
        const response = await fetch(`/api/claims/${claimId}/survey`)
        if (!response.ok) throw new Error("Failed to fetch survey details")

        const data = await response.json()

        if (data.survey) {
          setSurveyData(data.survey)
          if (data.survey.survey_date) {
            setDate(new Date(data.survey.survey_date))
          }
          setFormData({
            surveyLocation: data.survey.survey_location || "",
            surveyReport: data.survey.survey_report || "",
            surveyAmount: data.survey.survey_amount?.toString() || "",
            status: data.survey.status || "pending",
          })
        }

        if (data.assignedSurveyor) {
          setAssignedSurveyor(data.assignedSurveyor)
        }
      } catch (error) {
        console.error("Error fetching survey details:", error)
        toast({
          title: "Error",
          description: "Failed to load survey details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurveyDetails()
  }, [claimId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const toggleCalendar = () => {
    console.log("Toggle calendar clicked, current state:", showCalendar)
    setShowCalendar((prev) => !prev)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log("Date selected:", selectedDate)
    setDate(selectedDate)
    setShowCalendar(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignedSurveyor) {
      toast({
        title: "Error",
        description: "No surveyor assigned to this claim. Please assign a surveyor first.",
        variant: "destructive",
      })
      return
    }

    if (!date) {
      toast({
        title: "Error",
        description: "Survey date is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/survey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyorId: assignedSurveyor.id,
          surveyDate: date.toISOString().split("T")[0],
          surveyLocation: formData.surveyLocation,
          surveyReport: formData.surveyReport,
          surveyAmount: formData.surveyAmount ? Number.parseFloat(formData.surveyAmount) : null,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save survey details")
      }

      toast({
        title: "Survey details saved",
        description: "The survey details have been successfully saved",
      })

      // Refresh the page to show updated survey details
      router.refresh()
    } catch (error) {
      console.error("Error saving survey details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey details",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assignedSurveyor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="mb-4">No surveyor assigned to this claim.</p>
            <p>Please assign a surveyor first to add survey details.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Assigned Surveyor</Label>
            <div className="p-2 border rounded-md bg-muted/50">
              <p className="font-medium">{assignedSurveyor.name}</p>
              {assignedSurveyor.specialization && (
                <p className="text-sm text-muted-foreground">{assignedSurveyor.specialization}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="survey-date">Survey Date</Label>
            <div className="relative">
              <Button
                id="survey-date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
                onClick={toggleCalendar}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Select date</span>}
              </Button>

              {showCalendar && (
                <div
                  ref={calendarRef}
                  className="absolute top-full left-0 mt-1 p-3 bg-white rounded-md shadow-lg border z-50"
                >
                  <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surveyLocation">Survey Location</Label>
            <Input
              id="surveyLocation"
              name="surveyLocation"
              value={formData.surveyLocation}
              onChange={handleInputChange}
              placeholder="Enter survey location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surveyReport">Survey Report</Label>
            <Textarea
              id="surveyReport"
              name="surveyReport"
              value={formData.surveyReport}
              onChange={handleInputChange}
              placeholder="Enter survey findings and report"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surveyAmount">Survey Amount (₹)</Label>
            <Input
              id="surveyAmount"
              name="surveyAmount"
              type="number"
              step="0.01"
              value={formData.surveyAmount}
              onChange={handleInputChange}
              placeholder="Enter assessed damage amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {surveyData ? "Update Survey Details" : "Save Survey Details"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
