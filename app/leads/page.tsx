"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Edit, UserPlus, Search, Filter, Plus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Lead {
  id: number
  lead_number: string
  source_id?: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  industry?: string
  lead_value?: number
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
  priority: "low" | "medium" | "high" | "urgent"
  assigned_to?: number
  assigned_at?: string
  expected_close_date?: string
  notes?: string
  product_category?: string
  product_subtype?: string
  created_at: string
  updated_at: string
  source_name?: string
  assigned_user_name?: string
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

interface PaginatedResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Product categories and their subtypes
const PRODUCT_CATEGORIES = {
  Motor: ["2w", "4w", "CV"],
  Health: ["Individual", "Family", "Group", "Critical Illness"],
  Life: ["Term", "ULIP", "Endowment", "Others"],
  Travel: ["Domestic", "International", "Student", "Business"],
  Pet: ["Dog", "Cat", "Exotic"],
  Cyber: ["Individual", "SME", "Corporate"],
  Corporate: ["Property", "Liability", "Marine", "Engineering"],
  Marine: ["Cargo", "Hull", "Liability"],
} as const

type ProductCategory = keyof typeof PRODUCT_CATEGORIES

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-orange-100 text-orange-800",
  proposal: "bg-purple-100 text-purple-800",
  negotiation: "bg-indigo-100 text-indigo-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const productCategoryColors = {
  Motor: "bg-red-100 text-red-800",
  Health: "bg-green-100 text-green-800",
  Life: "bg-blue-100 text-blue-800",
  Travel: "bg-purple-100 text-purple-800",
  Pet: "bg-pink-100 text-pink-800",
  Cyber: "bg-gray-100 text-gray-800",
  Corporate: "bg-indigo-100 text-indigo-800",
  Marine: "bg-cyan-100 text-cyan-800",
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [productCategoryFilter, setProductCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    source_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    industry: "",
    lead_value: "",
    status: "new" as Lead["status"],
    priority: "medium" as Lead["priority"],
    assigned_to: "",
    expected_close_date: "",
    notes: "",
    product_category: "",
    product_subtype: "",
  })

  const { toast } = useToast()

  // Get available subtypes based on selected category
  const getAvailableSubtypes = (category: string): string[] => {
    if (!category || !(category in PRODUCT_CATEGORIES)) return []
    return [...PRODUCT_CATEGORIES[category as ProductCategory]]
  }

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      console.log("fetchLeads called");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (sourceFilter !== "all") params.append("source_id", sourceFilter)
      if (assigneeFilter !== "all") params.append("assigned_to", assigneeFilter)
      if (productCategoryFilter !== "all") params.append("product_category", productCategoryFilter)
      if (searchQuery) params.append("search", searchQuery)
      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch leads")
      }
      const data: PaginatedResponse = await response.json()
      setLeads(data.leads || [])
      // Only update pagination if it actually changes
      setPagination(prev => {
        if (
          prev.page !== data.pagination.page ||
          prev.limit !== data.pagination.limit ||
          prev.total !== data.pagination.total ||
          prev.totalPages !== data.pagination.totalPages ||
          prev.hasNext !== data.pagination.hasNext ||
          prev.hasPrev !== data.pagination.hasPrev
        ) {
          return data.pagination
        }
        return prev
      })
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch leads",
        variant: "destructive",
      })
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch lead sources
  const fetchLeadSources = async () => {
    try {
      setSourcesLoading(true)
      console.log("Fetching lead sources...")

      const response = await fetch("/api/lead-sources")
      console.log("Lead sources response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch lead sources")
      }

      const data = await response.json()
      console.log("Lead sources data received:", data)

      const sources = data.sources || []
      setLeadSources(sources)
      console.log("Lead sources set:", sources.length, "sources")

      if (sources.length === 0) {
        console.warn("No lead sources found in database")
        toast({
          title: "Warning",
          description: "No lead sources found. Please add some lead sources first.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching lead sources:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch lead sources",
        variant: "destructive",
      })
      setLeadSources([])
    } finally {
      setSourcesLoading(false)
    }
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      console.log("Fetching users...")

      const response = await fetch("/api/users")
      console.log("Users response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch users")
      }

      const data = await response.json()
      console.log("Users data received:", data)

      const users = data.users || []
      setUsers(users)
      console.log("Users set:", users.length, "users")
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    console.log("useEffect triggered", { pagination, statusFilter, sourceFilter, assigneeFilter, productCategoryFilter, searchQuery });
    fetchLeads();
  }, [pagination.page, statusFilter, sourceFilter, assigneeFilter, productCategoryFilter, searchQuery]);

  useEffect(() => {
    fetchLeadSources()
    fetchUsers()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return // Prevent multiple submissions
    
    try {
      setIsSubmitting(true)
      const submitData = {
        ...formData,
        source_id: formData.source_id ? Number.parseInt(formData.source_id) : undefined,
        assigned_to: formData.assigned_to ? Number.parseInt(formData.assigned_to) : undefined,
        lead_value: formData.lead_value ? Number.parseFloat(formData.lead_value) : undefined,
      }

      console.log("Submitting lead data:", submitData)

      const url = selectedLead ? `/api/leads/${selectedLead.id}` : "/api/leads"
      const method = selectedLead ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save lead")
      }

      const result = await response.json()
      console.log("Lead saved successfully:", result)

      toast({
        title: "Success",
        description: `Lead ${selectedLead ? "updated" : "created"} successfully`,
      })

      // Close dialogs and reset state immediately
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      
      // Fetch updated leads without delay
      await fetchLeads()
    } catch (error) {
      console.error("Error saving lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lead",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    try {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete lead")

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      })
      fetchLeads()
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  // Handle assign
  const handleAssign = async (userId: number) => {
    if (!selectedLead || isSubmitting) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selectedLead, assigned_to: userId }),
      })

      if (!response.ok) throw new Error("Failed to assign lead")

      toast({
        title: "Success",
        description: "Lead assigned successfully",
      })
      
      // Close dialog and clear state immediately
      setIsAssignDialogOpen(false)
      setSelectedLead(null)
      
      // Fetch updated leads without delay
      await fetchLeads()
    } catch (error) {
      console.error("Error assigning lead:", error)
      toast({
        title: "Error",
        description: "Failed to assign lead",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      source_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
      industry: "",
      lead_value: "",
      status: "new",
      priority: "medium",
      assigned_to: "",
      expected_close_date: "",
      notes: "",
      product_category: "",
      product_subtype: "",
    })
    setSelectedLead(null)
  }

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setFormData({
      source_id: lead.source_id?.toString() || "",
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || "",
      phone: lead.phone || "",
      company_name: lead.company_name || "",
      industry: lead.industry || "",
      lead_value: lead.lead_value?.toString() || "",
      status: lead.status,
      priority: lead.priority,
      assigned_to: lead.assigned_to?.toString() || "",
      expected_close_date: lead.expected_close_date || "",
      notes: lead.notes || "",
      product_category: lead.product_category || "",
      product_subtype: lead.product_subtype || "",
    })
    setIsEditDialogOpen(true)
  }

  const openAssignDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setIsAssignDialogOpen(true)
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setSourceFilter("all")
    setAssigneeFilter("all")
    setProductCategoryFilter("all")
    setSearchQuery("")
  }

  // Handle product category change
  const handleProductCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      product_category: category,
      product_subtype: "", // Reset subtype when category changes
    })
  }

  if (loading && sourcesLoading && usersLoading) {
    return <div className="p-6">Loading leads management...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground">Manage and track your insurance sales leads</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Create a new insurance lead in the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_category">Product Category</Label>
                  <Select value={formData.product_category} onValueChange={handleProductCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PRODUCT_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product_subtype">Product Subtype</Label>
                  <Select
                    value={formData.product_subtype}
                    onValueChange={(value) => setFormData({ ...formData, product_subtype: value })}
                    disabled={!formData.product_category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSubtypes(formData.product_category).map((subtype) => (
                        <SelectItem key={subtype} value={subtype}>
                          {subtype}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_value">Lead Value</Label>
                  <Input
                    id="lead_value"
                    type="number"
                    step="0.01"
                    value={formData.lead_value}
                    onChange={(e) => setFormData({ ...formData, lead_value: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="source_id">Source {sourcesLoading && "(Loading...)"}</Label>
                  <Select
                    value={formData.source_id}
                    onValueChange={(value) => setFormData({ ...formData, source_id: value })}
                    disabled={sourcesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={sourcesLoading ? "Loading sources..." : "Select source"} />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.length > 0 ? (
                        leadSources.map((source) => (
                          <SelectItem key={source.id} value={source.id.toString()}>
                            {source.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-sources" disabled>
                          No sources available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {leadSources.length === 0 && !sourcesLoading && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No lead sources found. Please add some lead sources first.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Lead["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Lead["priority"]) => setFormData({ ...formData, priority: value })}
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
                <div>
                  <Label htmlFor="assigned_to">Assign To {usersLoading && "(Loading...)"}</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                    disabled={usersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={usersLoading ? "Loading users..." : "Select user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          No users available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Lead"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>
              Lead Sources: {leadSources.length} loaded, Loading: {sourcesLoading.toString()}
            </div>
            <div>
              Users: {users.length} loaded, Loading: {usersLoading.toString()}
            </div>
            <div>
              Leads: {leads.length} loaded, Loading: {loading.toString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Category</Label>
              <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(PRODUCT_CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {leadSources.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assignee</Label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({pagination.total})</CardTitle>
          <CardDescription>Manage your insurance sales leads and track their progress</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found. Try adjusting your filters or create a new lead.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Product</TableHead>
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
                        <div className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </div>
                        {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.company_name || "-"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.product_category && (
                          <Badge
                            className={
                              productCategoryColors[lead.product_category as keyof typeof productCategoryColors] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {lead.product_category}
                          </Badge>
                        )}
                        {lead.product_subtype && (
                          <div className="text-xs text-muted-foreground">{lead.product_subtype}</div>
                        )}
                        {!lead.product_category && "-"}
                      </div>
                    </TableCell>
                    <TableCell>{lead.source_name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[lead.priority]}>{lead.priority}</Badge>
                    </TableCell>
                    <TableCell>{lead.assigned_user_name || "Unassigned"}</TableCell>
                    <TableCell>{lead.expected_close_date || "-"}</TableCell>
                    <TableCell>{lead.lead_value ? `$${lead.lead_value.toLocaleString()}` : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignDialog(lead)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - Similar structure to Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form fields as Add Dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_company_name">Company</Label>
                <Input
                  id="edit_company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_industry">Industry</Label>
                <Input
                  id="edit_industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_product_category">Product Category</Label>
                <Select value={formData.product_category} onValueChange={handleProductCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PRODUCT_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_product_subtype">Product Subtype</Label>
                <Select
                  value={formData.product_subtype}
                  onValueChange={(value) => setFormData({ ...formData, product_subtype: value })}
                  disabled={!formData.product_category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product subtype" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSubtypes(formData.product_category).map((subtype) => (
                      <SelectItem key={subtype} value={subtype}>
                        {subtype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_lead_value">Lead Value</Label>
                <Input
                  id="edit_lead_value"
                  type="number"
                  step="0.01"
                  value={formData.lead_value}
                  onChange={(e) => setFormData({ ...formData, lead_value: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_source_id">Source</Label>
                <Select
                  value={formData.source_id}
                  onValueChange={(value) => setFormData({ ...formData, source_id: value })}
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Lead["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Lead["priority"]) => setFormData({ ...formData, priority: value })}
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
              <div>
                <Label htmlFor="edit_assigned_to">Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_expected_close_date">Expected Close Date</Label>
              <Input
                id="edit_expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Assign {selectedLead?.first_name} {selectedLead?.last_name} to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.role}</div>
                  </div>
                  <Button onClick={() => handleAssign(user.id)} disabled={isSubmitting}>
                    {isSubmitting ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No users available for assignment</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
