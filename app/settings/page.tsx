"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Eye, Filter, Pencil } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

// Sample user data
const SAMPLE_USERS = [
  {
    id: 1,
    name: "Admin User",
    username: "admin",
    email: "admin@hibinsurance.com",
    role: "Admin",
    status: "active",
  },
  {
    id: 2,
    name: "Neha Verma",
    username: "neha.verma",
    email: "neha.verma@hibinsurance.com",
    role: "Claims Manager",
    status: "active",
  },
  {
    id: 3,
    name: "Amit Patel",
    username: "amit.patel",
    email: "amit.patel@hibinsurance.com",
    role: "Claims Adjuster",
    status: "active",
  },
  {
    id: 4,
    name: "Rajesh Kumar",
    username: "rajesh.kumar",
    email: "rajesh.kumar@hibinsurance.com",
    role: "Surveyor",
    status: "active",
  },
  {
    id: 5,
    name: "Sanjay Gupta",
    username: "sanjay.gupta",
    email: "sanjay.gupta@hibinsurance.com",
    role: "Read Only",
    status: "inactive",
  },
]

// Default roles and permissions
const DEFAULT_ROLES = [
  {
    id: 1,
    name: "Admin",
    description: "Full system access with all permissions",
    permissions: [
      "view_claims",
      "create_claims",
      "edit_claims",
      "delete_claims",
      "approve_claims",
      "reject_claims",
      "view_policies",
      "create_policies",
      "edit_policies",
      "delete_policies",
      "view_users",
      "create_users",
      "edit_users",
      "delete_users",
      "view_reports",
      "export_data",
      "manage_settings",
    ],
  },
  {
    id: 2,
    name: "Claims Manager",
    description: "Manages the claims process and approvals",
    permissions: [
      "view_claims",
      "create_claims",
      "edit_claims",
      "approve_claims",
      "reject_claims",
      "view_policies",
      "view_reports",
      "export_data",
    ],
  },
  {
    id: 3,
    name: "Claims Adjuster",
    description: "Processes and updates claims",
    permissions: ["view_claims", "create_claims", "edit_claims", "view_policies", "view_reports"],
  },
  {
    id: 4,
    name: "Surveyor",
    description: "Conducts surveys and uploads reports",
    permissions: ["view_claims", "edit_claims", "view_policies"],
  },
  {
    id: 5,
    name: "Read Only",
    description: "View-only access to assigned data",
    permissions: ["view_claims", "view_policies", "view_reports"],
  },
]

// All available permissions
const ALL_PERMISSIONS = [
  { id: "view_claims", name: "View Claims", category: "Claims" },
  { id: "create_claims", name: "Create Claims", category: "Claims" },
  { id: "edit_claims", name: "Edit Claims", category: "Claims" },
  { id: "delete_claims", name: "Delete Claims", category: "Claims" },
  { id: "approve_claims", name: "Approve Claims", category: "Claims" },
  { id: "reject_claims", name: "Reject Claims", category: "Claims" },
  { id: "view_policies", name: "View Policies", category: "Policies" },
  { id: "create_policies", name: "Create Policies", category: "Policies" },
  { id: "edit_policies", name: "Edit Policies", category: "Policies" },
  { id: "delete_policies", name: "Delete Policies", category: "Policies" },
  { id: "view_users", name: "View Users", category: "Users" },
  { id: "create_users", name: "Create Users", category: "Users" },
  { id: "edit_users", name: "Edit Users", category: "Users" },
  { id: "delete_users", name: "Delete Users", category: "Users" },
  { id: "view_reports", name: "View Reports", category: "Reports" },
  { id: "export_data", name: "Export Data", category: "Reports" },
  { id: "manage_settings", name: "Manage Settings", category: "System" },
]

export default function SettingsPage() {
  // General settings state
  const [companyName, setCompanyName] = useState("HIB Insurance")
  const [contactEmail, setContactEmail] = useState("support@hibinsurance.com")
  const [contactPhone, setContactPhone] = useState("+91 1800 123 4567")
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // User management state
  const [users, setUsers] = useState(SAMPLE_USERS)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Role management state
  const [roles, setRoles] = useState(DEFAULT_ROLES)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [isRolesLoading, setIsRolesLoading] = useState(true)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    role: "Claims Adjuster",
    status: "active",
  })

  // Fetch settings when component mounts
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings")

        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()

        if (data.settings) {
          setCompanyName(data.settings.companyName)
          setContactEmail(data.settings.contactEmail)
          setContactPhone(data.settings.contactPhone)
          setDarkMode(data.settings.darkMode)
          setEmailNotifications(data.settings.emailNotifications)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        // Keep using the default values if API fails
        toast({
          title: "Warning",
          description: "Using default settings - couldn't fetch from server",
          variant: "warning",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Add useEffect to fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users")

        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data.users || SAMPLE_USERS)
      } catch (error) {
        console.error("Error fetching users:", error)
        // Keep using the sample users if API fails
        toast({
          title: "Warning",
          description: "Using sample user data - couldn't fetch from server",
          variant: "warning",
        })
      }
    }

    fetchUsers()
  }, [])

  // Add useEffect to fetch roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        setIsRolesLoading(true)
        const response = await fetch("/api/roles")

        if (!response.ok) {
          throw new Error("Failed to fetch roles")
        }

        const data = await response.json()
        setRoles(data.roles || DEFAULT_ROLES)
      } catch (error) {
        console.error("Error fetching roles:", error)
        // Keep using the default roles if API fails
        toast({
          title: "Warning",
          description: "Using default role data - couldn't fetch from server",
          variant: "warning",
        })
      } finally {
        setIsRolesLoading(false)
      }
    }

    fetchRoles()
  }, [])

  // Handle saving general settings
  const handleSaveSettings = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          contactEmail,
          contactPhone,
          darkMode,
          emailNotifications,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Your settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update handleAddUser to use the API
  const handleAddUser = async () => {
    // Validate form
    if (!newUser.name || !newUser.username || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add user")
      }

      // Add new user to the list
      setUsers([...users, data.user])

      // Reset form and close dialog
      setNewUser({
        name: "",
        username: "",
        email: "",
        role: "Claims Adjuster",
        status: "active",
      })
      setIsAddUserOpen(false)

      toast({
        title: "Success",
        description: `${newUser.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update handleEditUser to use the API
  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUser),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user")
      }

      // Update user in the list
      setUsers(users.map((user) => (user.id === selectedUser.id ? data.user : user)))

      // Close dialog
      setIsEditUserOpen(false)

      toast({
        title: "Success",
        description: `${selectedUser.name}'s information has been updated.`,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Open edit user dialog
  const openEditUser = (user: any) => {
    setSelectedUser({ ...user })
    setIsEditUserOpen(true)
  }

  // Open edit role dialog
  const openEditRole = (role: any) => {
    setSelectedRole({ ...role })
    setIsEditRoleOpen(true)
  }

  // Handle updating role permissions
  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch("/api/roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedRole),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      // Update role in the list
      setRoles(roles.map((role) => (role.id === selectedRole.id ? data.role : role)))

      // Close dialog
      setIsEditRoleOpen(false)

      toast({
        title: "Success",
        description: `${selectedRole.name} role has been updated.`,
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Toggle permission for a role
  const togglePermission = (permission: string) => {
    if (!selectedRole) return

    const permissions = [...selectedRole.permissions]
    const index = permissions.indexOf(permission)

    if (index === -1) {
      permissions.push(permission)
    } else {
      permissions.splice(index, 1)
    }

    setSelectedRole({ ...selectedRole, permissions })
  }

  // Group permissions by category
  const groupedPermissions = ALL_PERMISSIONS.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    },
    {} as Record<string, typeof ALL_PERMISSIONS>,
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Card>
          <CardContent className="p-10 flex justify-center">
            <p>Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <div className="text-sm text-muted-foreground">Enable dark mode for the application</div>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive email notifications for new claims</div>
                </div>
                <Switch id="notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and their roles</CardDescription>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "success" : "outline"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/settings/users/${user.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View user</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit user</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>Manage system roles and their permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isRolesLoading ? (
                <div className="flex justify-center p-4">
                  <p>Loading roles...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.length > 3 ? (
                              <>
                                <Badge variant="outline" className="mr-1">
                                  {role.permissions.length} permissions
                                </Badge>
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                                  <Link href={`#`} onClick={() => openEditRole(role)}>
                                    View all
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              role.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="mr-1">
                                  {permission.replace(/_/g, " ")}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditRole(role)}>
                            Edit Permissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Claim Submitted</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notification when a new claim is submitted
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Claim Status Updated</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notification when a claim status is updated
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Survey Report Uploaded</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notification when a survey report is uploaded
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Processed</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notification when a payment is processed
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">System Notifications</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In-App Notifications</Label>
                    <div className="text-sm text-muted-foreground">Show notifications in the application</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Summary</Label>
                    <div className="text-sm text-muted-foreground">Receive a daily summary of all activities</div>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button
                onClick={() => {
                  toast({
                    title: "Notification settings saved",
                    description: "Your notification preferences have been updated.",
                  })
                }}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>View system audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input placeholder="Search audit logs..." className="max-w-sm" />
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        datetime: "2023-06-20 14:32:15",
                        user: "admin",
                        action: "UPDATE",
                        table: "claims",
                        recordId: "5",
                        ip: "192.168.1.100",
                      },
                      {
                        datetime: "2023-06-20 13:45:22",
                        user: "neha.verma",
                        action: "INSERT",
                        table: "claim_notes",
                        recordId: "12",
                        ip: "192.168.1.101",
                      },
                      {
                        datetime: "2023-06-20 11:23:05",
                        user: "amit.patel",
                        action: "UPDATE",
                        table: "claims",
                        recordId: "3",
                        ip: "192.168.1.102",
                      },
                      {
                        datetime: "2023-06-19 16:54:30",
                        user: "rajesh.kumar",
                        action: "INSERT",
                        table: "claim_surveys",
                        recordId: "8",
                        ip: "192.168.1.103",
                      },
                      {
                        datetime: "2023-06-19 15:12:45",
                        user: "admin",
                        action: "INSERT",
                        table: "users",
                        recordId: "6",
                        ip: "192.168.1.100",
                      },
                      {
                        datetime: "2023-06-19 14:05:18",
                        user: "neha.verma",
                        action: "UPDATE",
                        table: "policies",
                        recordId: "10",
                        ip: "192.168.1.101",
                      },
                      {
                        datetime: "2023-06-19 10:32:56",
                        user: "amit.patel",
                        action: "INSERT",
                        table: "payments",
                        recordId: "4",
                        ip: "192.168.1.102",
                      },
                    ].map((log, i) => (
                      <TableRow key={i}>
                        <TableCell>{log.datetime}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.table}</TableCell>
                        <TableCell>{log.recordId}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with appropriate role and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="john.doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Claims Manager">Claims Manager</SelectItem>
                  <SelectItem value="Claims Adjuster">Claims Adjuster</SelectItem>
                  <SelectItem value="Surveyor">Surveyor</SelectItem>
                  <SelectItem value="Read Only">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Claims Manager">Claims Manager</SelectItem>
                    <SelectItem value="Claims Adjuster">Claims Adjuster</SelectItem>
                    <SelectItem value="Surveyor">Surveyor</SelectItem>
                    <SelectItem value="Read Only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>Configure permissions for the {selectedRole?.name} role</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                />
              </div>

              <Separator className="my-2" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Permissions</h3>

                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedRole.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={permission.id} className="cursor-pointer">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
