import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Calendar, IndianRupee, CreditCard, User, FileText } from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"

export const revalidate = 0

async function getPaymentData(id: string) {
  try {
    // Get payment details
    const payments = await sql`
      SELECT 
        p.*,
        c.claim_number,
        c.incident_date,
        po.policy_number,
        ph.name as policy_holder_name,
        ph.phone as policy_holder_phone,
        ph.email as policy_holder_email
      FROM payments p
      JOIN claims c ON p.claim_id = c.id
      JOIN policies po ON c.policy_id = po.id
      JOIN policy_holders ph ON po.policy_holder_id = ph.id
      WHERE p.id = ${id}
    `

    if (payments.length === 0) {
      return null
    }

    return {
      payment: payments[0],
    }
  } catch (error) {
    console.error("Error fetching payment data:", error)
    return null
  }
}

export default async function PaymentDetailsPage({ params }: { params: { id: string } }) {
  const data = await getPaymentData(params.id)

  if (!data) {
    notFound()
  }

  const { payment } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Payment Details</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{payment.payment_id || `PAY-${payment.id}`}</CardTitle>
                <CardDescription>Claim: {payment.claim_number}</CardDescription>
              </div>
              <Badge variant={payment.status === "completed" ? "success" : "outline"} className="text-sm">
                {payment.status}
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
                  <p>{payment.policy_holder_name}</p>
                  <p className="text-sm text-muted-foreground">{payment.policy_holder_phone}</p>
                  <p className="text-sm text-muted-foreground">{payment.policy_holder_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Policy Details
                  </h3>
                  <p>Policy Number: {payment.policy_number}</p>
                  <p>Claim Number: {payment.claim_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Incident Date: {new Date(payment.incident_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Payment Amount
                  </h3>
                  <p className="text-xl font-bold">{formatCurrency(payment.payment_amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Payment Date
                  </h3>
                  <p>{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Method
                  </h3>
                  <p>{payment.payment_method}</p>
                  <p className="text-sm text-muted-foreground">Transaction ID: {payment.transaction_id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Payment Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Payment Notes</h3>
                  <p>{payment.notes || "No payment notes available."}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Processed By</h3>
                  <p>{payment.processed_by || "System"}</p>
                </div>
                {payment.status === "completed" && (
                  <div className="flex justify-end">
                    <Button>
                      <Download className="mr-2 h-4 w-4" /> Download Receipt
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Payment Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">No payment documents found</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
