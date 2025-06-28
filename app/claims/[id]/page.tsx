import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MessageSquare, FileText, Car, User, Calendar, MapPin, IndianRupee } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { notFound, redirect } from "next/navigation"
import { UpdateClaimStatus } from "@/components/update-claim-status"
import { AssignSurveyor } from "@/components/assign-surveyor"
import { AddSurveyDetails } from "@/components/add-survey-details"
import { ClaimDocumentsTab } from "@/components/claim-documents-tab"

export const revalidate = 0

async function getClaimData(id: string) {
  // If the ID is "new", we should redirect to the new claim page
  if (id === "new") {
    return null
  }

  try {
    // Get claim details
    const claims = await sql`
      SELECT 
        c.*,
        p.policy_number,
        ph.name as policy_holder,
        ph.phone as policy_holder_phone,
        ph.email as policy_holder_email,
        v.make,
        v.model,
        v.registration_number
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      JOIN policy_holders ph ON p.policy_holder_id = ph.id
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE c.id = ${id}
    `

    if (claims.length === 0) {
      return null
    }

    // Get documents
    const documents = await sql`
      SELECT * FROM documents
      WHERE claim_id = ${id}
      ORDER BY upload_date DESC
    `

    // Get notes
    const notes = await sql`
      SELECT * FROM claim_notes
      WHERE claim_id = ${id}
      ORDER BY created_at DESC
    `

    // Get survey - use the correct column names
    const surveys = await sql`
      SELECT 
        cs.*,
        cs.location as survey_location,
        cs.report as survey_report,
        cs.amount as survey_amount,
        s.name as surveyor
      FROM claim_surveys cs
      JOIN surveyors s ON cs.surveyor_id = s.id
      WHERE cs.claim_id = ${id}
    `

    // Get payment
    const payments = await sql`
      SELECT * FROM payments
      WHERE claim_id = ${id}
    `

    return {
      claim: claims[0],
      documents,
      notes,
      survey: surveys.length > 0 ? surveys[0] : null,
      payment: payments.length > 0 ? payments[0] : null,
    }
  } catch (error) {
    console.error("Error fetching claim data:", error)
    return null
  }
}

export default async function ClaimDetailsPage({ params }: { params: { id: string } }) {
  // If the ID is "new", redirect to the new claim form
  if (params.id === "new") {
    redirect("/claims/new")
  }

  const data = await getClaimData(params.id)

  if (!data) {
    notFound()
  }

  const { claim, documents, notes, survey, payment } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/claims">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Claim Details</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{claim.claim_number}</CardTitle>
                <CardDescription>Policy: {claim.policy_number}</CardDescription>
              </div>
              <Badge
                variant={
                  claim.status === "approved" ? "success" : claim.status === "pending" ? "outline" : "destructive"
                }
                className="text-sm"
              >
                {claim.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Policy Holder
                  </h3>
                  <p>{claim.policy_holder}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> Vehicle
                  </h3>
                  <p>
                    {claim.make} {claim.model}
                  </p>
                  <p className="text-sm text-muted-foreground">{claim.registration_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Incident Date
                  </h3>
                  <p>{new Date(claim.incident_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Incident Location
                  </h3>
                  <p>{claim.incident_location}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Incident Description
                  </h3>
                  <p>{claim.incident_description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Damage Description
                  </h3>
                  <p>{claim.damage_description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Estimated Amount
                  </h3>
                  <p>{formatCurrency(claim.estimated_amount)}</p>
                </div>
                {claim.approved_amount && (
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" /> Approved Amount
                    </h3>
                    <p>{formatCurrency(claim.approved_amount)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="lg:w-1/3 space-y-4">
          <UpdateClaimStatus claimId={params.id} currentStatus={claim.status} currentAmount={claim.approved_amount} />
          <AssignSurveyor claimId={params.id} />
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="survey">Survey</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <ClaimDocumentsTab claimId={params.id} initialDocuments={documents} />
        </TabsContent>
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Notes</CardTitle>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{note.created_by}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="mt-2">{note.note_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No notes found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="survey">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AddSurveyDetails claimId={params.id} />

            <Card>
              <CardHeader>
                <CardTitle>Survey Information</CardTitle>
              </CardHeader>
              <CardContent>
                {survey ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Surveyor</h3>
                      <p>{survey.surveyor}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Survey Date</h3>
                      <p>{new Date(survey.survey_date).toLocaleDateString()}</p>
                    </div>
                    {survey.survey_location && (
                      <div>
                        <h3 className="text-sm font-medium">Location</h3>
                        <p>{survey.survey_location}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium">Survey Report</h3>
                      <p className="whitespace-pre-wrap">{survey.survey_report || "No report available"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Survey Amount</h3>
                      <p>{formatCurrency(survey.survey_amount || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Status</h3>
                      <Badge variant={survey.status === "completed" ? "success" : "outline"}>
                        {survey.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No survey information available yet. Use the form to add survey details.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              {payment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Payment Date</h3>
                    <p>{new Date(payment.payment_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Amount</h3>
                    <p>{formatCurrency(payment.payment_amount)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Payment Method</h3>
                    <p>{payment.payment_method}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Transaction ID</h3>
                    <p>{payment.transaction_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Status</h3>
                    <Badge variant={payment.status === "completed" ? "success" : "outline"}>{payment.status}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No payment information found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
