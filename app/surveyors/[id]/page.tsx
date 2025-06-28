"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

interface Surveyor {
  id: number
  name: string
  email: string
  phone: string
  specialization: string
  license_number: string
  years_experience: number
  address: string
  notes: string
  created_at: string
}

interface Claim {
  id: number
  claim_number: string
  incident_date: string
  status: string
  vehicle_id: number
  policy_id: number
}

export default function SurveyorDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [surveyor, setSurveyor] = useState<Surveyor | null>(null)
  const [assignedClaims, setAssignedClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallbackData, setIsFallbackData] = useState(false)

  useEffect(() => {
    const fetchSurveyorDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/surveyors/${params.id}`)
        const data = await response.json()

        if (!response.ok && !data.surveyor) {
          throw new Error(data.error || "Failed to fetch surveyor details")
        }

        setSurveyor(data.surveyor)
        setAssignedClaims(data.assignedClaims || [])

        // Check if we're using fallback data
        if (data._error) {
          setIsFallbackData(true)
          toast({
            title: "Warning",
            description: "Showing limited data due to a database error",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching surveyor details:", error)
        setError((error as Error).message || "Failed to load surveyor details")
        toast({
          title: "Error",
          description: "Failed to load surveyor details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurveyorDetails()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading surveyor details...</p>
        </div>
      </div>
    )
  }

  if (error && !surveyor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Surveyor</h2>
            <p className="mb-4 text-red-500">{error}</p>
            <Button onClick={() => router.push("/surveyors")}>Back to Surveyors</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!surveyor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Surveyor Not Found</h2>
            <p className="mb-4">The surveyor you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/surveyors")}>Back to Surveyors</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {isFallbackData && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          <p className="text-yellow-700">
            Showing limited data due to a database error. Some information may be missing or inaccurate.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Surveyor Details</h1>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push("/surveyors")}>
            Back to List
          </Button>
          <Button onClick={() => router.push(`/surveyors/${params.id}/edit`)}>Edit Surveyor</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Details about the surveyor and their qualifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-lg">{surveyor.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{surveyor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg">{surveyor.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">License Number</p>
                  <p className="text-lg">{surveyor.license_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Specialization</p>
                  <p className="text-lg">{surveyor.specialization}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                  <p className="text-lg">{surveyor.years_experience}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-lg">{surveyor.address}</p>
              </div>

              {surveyor.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-lg">{surveyor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Claims</CardTitle>
              <CardDescription>Claims currently assigned to this surveyor.</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedClaims.length > 0 ? (
                <ul className="space-y-2">
                  {assignedClaims.map((claim) => (
                    <li key={claim.id} className="rounded border p-3 hover:bg-gray-50">
                      <a href={`/claims/${claim.id}`} className="block">
                        <p className="font-medium">{claim.claim_number}</p>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Date: {new Date(claim.incident_date).toLocaleDateString()}</span>
                          <span
                            className={`capitalize ${
                              claim.status === "approved"
                                ? "text-green-600"
                                : claim.status === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No claims currently assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
