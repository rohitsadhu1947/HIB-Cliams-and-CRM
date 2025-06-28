"use client"

import { notFound } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Phone, Mail, MapPin, Shield, Eye, Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import CustomerInteractionModals from "./customer-interaction-modals"
import React from "react"

async function getCustomerDashboard(id: string) {
  try {
    const response = await fetch(`/api/customers/${id}/dashboard`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching customer dashboard:", error)
    return null
  }
}

export default function CustomerDashboardPage({ params }: { params: { id: string } }) {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [hasParamsId, setHasParamsId] = React.useState(false)

  React.useEffect(() => {
    if (params.id) {
      setHasParamsId(true)
    }
  }, [params.id])

  React.useEffect(() => {
    const loadData = async () => {
      if (hasParamsId) {
        const result = await getCustomerDashboard(params.id)
        setData(result)
        setLoading(false)
      }
    }
    loadData()
  }, [params.id, hasParamsId])

  if (!hasParamsId) {
    return <div>Missing Customer ID</div>
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!data) {
    notFound()
  }

  const { customer, summary, recentActivity, activePolicies, recentClaims, paymentSummary, riskFactors } = data

  // Calculate risk score based on factors
  const calculateRiskScore = () => {
    let score = 50 // Base score

    if (riskFactors.claimFrequency > 0.5) score += 20
    else if (riskFactors.claimFrequency > 0.3) score += 10

    if (riskFactors.paymentHistory > 2) score += 15
    else if (riskFactors.paymentHistory > 0) score += 5

    if (riskFactors.customerTenure > 5) score -= 10
    else if (riskFactors.customerTenure > 2) score -= 5

    return Math.min(Math.max(score, 1), 100)
  }

  const riskScore = customer.risk_score || calculateRiskScore()
  const riskLevel = riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low"

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Customer 360 View</h1>
      </div>

      {/* Customer Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <CardDescription>Customer ID: {customer.id}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={customer.customer_status === "active" ? "default" : "secondary"}>
                {customer.customer_status || "Active"}
              </Badge>
              <Badge variant={riskLevel === "High" ? "destructive" : riskLevel === "Medium" ? "default" : "secondary"}>
                <Shield className="h-3 w-3 mr-1" />
                {riskLevel} Risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.address}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <strong>Policies:</strong> {summary.totalPolicies}
              </div>
              <div>
                <strong>Claims:</strong> {summary.totalClaims}
              </div>
              <div>
                <strong>Customer Since:</strong>{" "}
                {customer.customer_since ? new Date(customer.customer_since).getFullYear() : "N/A"}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <strong>Premium Paid:</strong> {formatCurrency(summary.lifetimePremiumPaid || 0)}
              </div>
              <div>
                <strong>Risk Score:</strong> {riskScore}/100
              </div>
              <div>
                <strong>Segment:</strong> {customer.customer_segment || "Standard"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">Total active coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClaims}</div>
            <p className="text-xs text-muted-foreground">{summary.pendingClaims} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.lifetimePremiumPaid || 0)}</div>
            <p className="text-xs text-muted-foreground">Lifetime total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskLevel}</div>
            <p className="text-xs text-muted-foreground">Score: {riskScore}/100</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 border-b pb-2 last:border-b-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.activity_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/claims/new?customer=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Claim
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/policies/new?customer=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Policy
                  </Link>
                </Button>

                {/* Log Interaction Dialog */}
                <CustomerInteractionModals customer={customer} customerId={params.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Active Policies ({activePolicies.length})</CardTitle>
                <Button asChild>
                  <Link href={`/policies/new?customer=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Policy
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activePolicies.length > 0 ? (
                <div className="space-y-3">
                  {activePolicies.map((policy: any) => (
                    <div key={policy.id} className="border rounded-lg p-4 hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{policy.policy_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {policy.policy_type} • {policy.make} {policy.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(policy.start_date).toLocaleDateString()} -{" "}
                            {new Date(policy.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(policy.premium_amount)}</p>
                          <p className="text-sm text-muted-foreground">Premium</p>
                          <Button variant="outline" size="sm" className="mt-1" asChild>
                            <Link href={`/policies/${policy.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active policies found</p>
                  <Button className="mt-2" asChild>
                    <Link href={`/policies/new?customer=${customer.id}`}>Create First Policy</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Claims History ({recentClaims.length})</CardTitle>
                <Button asChild>
                  <Link href={`/claims/new?customer=${customer.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Claim
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentClaims.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Incident Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClaims.map((claim: any) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claim_number}</TableCell>
                        <TableCell>
                          {claim.make} {claim.model}
                        </TableCell>
                        <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(claim.estimated_amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              claim.status === "approved"
                                ? "default"
                                : claim.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/claims/${claim.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No claims found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Premium payments and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{paymentSummary.total_payments || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Payments</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(paymentSummary.total_amount_paid || 0)}</div>
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{paymentSummary.failed_payments || 0}</div>
                  <div className="text-sm text-muted-foreground">Failed Payments</div>
                </div>
              </div>

              <div className="text-center py-4 text-muted-foreground">
                <p>Detailed payment history will be displayed here</p>
                <p className="text-xs mt-1">Integration with payment tracking system pending</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interaction History</CardTitle>
                <CustomerInteractionModals customer={customer} customerId={params.id} showOnlyLogButton={true} />
              </div>
            </CardHeader>
            <CardContent>
              {data.recentInteractions && data.recentInteractions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentInteractions.map((interaction: any) => (
                    <div key={interaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{interaction.subject || "General Inquiry"}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{interaction.interaction_summary}</p>
                          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                            <span>Type: {interaction.interaction_type}</span>
                            <span>•</span>
                            <span>Agent: {interaction.agent_name || "System"}</span>
                            <span>•</span>
                            <span>{new Date(interaction.interaction_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant={interaction.resolution_status === "resolved" ? "default" : "secondary"}>
                          {interaction.resolution_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No interactions recorded</p>
                  <CustomerInteractionModals customer={customer} customerId={params.id} showOnlyLogButton={true} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
