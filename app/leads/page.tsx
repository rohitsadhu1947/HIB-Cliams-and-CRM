"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  PresentationIcon as AssignIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react"

interface Lead {
  id: number
  lead_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  industry?: string
  lead_value?: number
  source_name?: string
  source_id?: number
  status: string
  priority: string
  assigned_user_name?: string
  assigned_to?: number
  expected_close_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface LeadSource {
  id: number
  name: string
  description?: string
  is_active: boolean
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface CreateLeadData {
  source_id?: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  industry?: string
  lead_value?: number
  status: string
  priority: string
  expected_close_date?: string
  notes?: string
}

const statusColors = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-orange-100 text-orange-800 border-orange-200",
  proposal: "bg-purple-100 text-purple-800 border-purple-200",
  negotiation: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "closed-won": "bg-green-100 text-green-800 border-green-200",
  "closed-lost": "bg-red-100 text-red-800 border-red-200",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filters and search
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [assignedToFilter, setAssignedToFilter] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Form data
  const [formData, setFormData] = useState<CreateLeadData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    industry: "",
    lead_value: undefined,
    status: "new",
    priority: "medium",
    source_id: undefined,
    expected_close_date: "",
    notes: "",
  })

  const [assignUserId, setAssignUserId] = useState<number | undefined>(0)

  const { toast } = useToast()

  useEffect(() => {
    fetchLeads()
    fetchLeadSources()
    fetchUsers()
  }, [search, statusFilter, sourceFilter, assignedToFilter, currentPage])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter) params.append("status", statusFilter)
      if (sourceFilter) params.append("source_id", sourceFilter)
      if (assignedToFilter) params.append("assigned_to", assignedToFilter)
      params.append("page", currentPage.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error("Failed to fetch leads")

      const data = await response.json()
      setLeads(data.leads || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.totalCount || 0)
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadSources = async () => {
    try {
      const response = await fetch("/api/lead-sources")
      if (!response.ok) throw new Error("Failed to fetch lead sources")
      const data = await response.json()
      setLeadSources(data.sources || [])
    } catch (error) {
      console.error("Error fetching lead sources:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCreateLead = async () => {
    try {
      setActionLoading("create")
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create lead")
      }

      toast({
        title: "Success",
        description: "Lead created successfully",
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error("Error creating lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lead",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateLead = async () => {
    if (!selectedLead) return

    try {
      setActionLoading("update")
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update lead")
      }

      toast({
        title: "Success",
        description: "Lead updated successfully",
      })

      setIsEditDialogOpen(false)
      setSelectedLead(null)
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error("Error updating lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update lead",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteLead = async (leadId: number) => {
    try {
      setActionLoading(`delete-${leadId}`)
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete lead")
      }

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      })

      fetchLeads()
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lead",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignLead = async () => {
    if (!selectedLead || !assignUserId) return

    try {
      setActionLoading("assign")
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignUserId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to assign lead")
      }

      toast({
        title: "Success",
        description: "Lead assigned successfully",
      })

      setIsAssignDialogOpen(false)
      setSelectedLead(null)
      setAssignUserId(undefined)
      fetchLeads()
    } catch (error) {
      console.error("Error assigning lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign lead",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
      industry: "",
      lead_value: undefined,
      status: "new",
      priority: "medium",
      source_id: undefined,
      expected_close_date: "",
      notes: "",
    })
  }

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setFormData({
      source_id: lead.source_id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || "",
      phone: lead.phone || "",
      company_name: lead.company_name || "",
      industry: lead.industry || "",
      lead_value: lead.lead_value,
      status: lead.status,
      priority: lead.priority,
      expected_close_date: lead.expected_close_date || "",
      notes: lead.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const openAssignDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setAssignUserId(lead.assigned_to || 0)
    setIsAssignDialogOpen(true)
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setSourceFilter("")
    setAssignedToFilter("")
    setCurrentPage(1)
  }

  const formatCurrency = (value?: number) => {
    if (!value) return "-"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Enter industry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_value">Lead Value (₹)</Label>
                <Input
                  id="lead_value"
                  type="number"
                  value={formData.lead_value || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lead_value: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Enter lead value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={formData.source_id?.toString() || "0"}
                  onValueChange={(value) => setFormData({ ...formData, source_id: value ? Number(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed-won">Closed Won</SelectItem>
                    <SelectItem value="closed-lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateLead}
                disabled={!formData.first_name || !formData.last_name || actionLoading === "create"}
              >
                {actionLoading === "create" ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads ({totalCount})</span>
            <Button variant="outline" size="sm" onClick={fetchLeads}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed-won">Closed Won</SelectItem>
                <SelectItem value="closed-lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {leadSources.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || statusFilter || sourceFilter || assignedToFilter) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leads found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Expected Close</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.lead_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{`${lead.first_name} ${lead.last_name}`}</div>
                            {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{lead.company_name || "-"}</TableCell>
                        <TableCell>{lead.source_name || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              statusColors[lead.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                            }
                          >
                            {lead.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              priorityColors[lead.priority as keyof typeof priorityColors] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.assigned_user_name || "Unassigned"}</TableCell>
                        <TableCell>{formatDate(lead.expected_close_date)}</TableCell>
                        <TableCell>{formatCurrency(lead.lead_value)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(lead)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openAssignDialog(lead)}>
                              <AssignIcon className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this lead? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteLead(lead.id)}
                                    disabled={actionLoading === `delete-${lead.id}`}
                                  >
                                    {actionLoading === `delete-${lead.id}` ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                    leads
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_first_name">First Name *</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_last_name">Last Name *</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company_name">Company</Label>
              <Input
                id="edit_company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_industry">Industry</Label>
              <Input
                id="edit_industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Enter industry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_lead_value">Lead Value (₹)</Label>
              <Input
                id="edit_lead_value"
                type="number"
                value={formData.lead_value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lead_value: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="Enter lead value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_source">Lead Source</Label>
              <Select
                value={formData.source_id?.toString() || "0"}
                onValueChange={(value) => setFormData({ ...formData, source_id: value ? Number(value) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_expected_close_date">Expected Close Date</Label>
              <Input
                id="edit_expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter notes"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLead}
              disabled={!formData.first_name || !formData.last_name || actionLoading === "update"}
            >
              {actionLoading === "update" ? "Updating..." : "Update Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Lead Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lead</Label>
              <p className="text-sm text-muted-foreground">
                {selectedLead && `${selectedLead.first_name} ${selectedLead.last_name} (${selectedLead.lead_number})`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign_user">Assign To</Label>
              <Select
                value={assignUserId?.toString() || "0"}
                onValueChange={(value) => setAssignUserId(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLead} disabled={actionLoading === "assign"}>
              {actionLoading === "assign" ? "Assigning..." : "Assign Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
