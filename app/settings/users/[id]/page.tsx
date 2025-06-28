"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, UserCog, Shield, Activity } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

// Define permissions for each role
const ROLE_PERMISSIONS = {
  Admin: [
    "View all claims",
    "Create claims",
    "Edit claims",
    "Delete claims",
    "Approve/reject claims",
    "Manage users",
    "View reports",
    "Export data",
    "System configuration",
  ],
  "Claims Manager": [
    "View all claims",
    "Create claims",
    "Edit claims",
    "Approve/reject claims",
    "View reports",
    "Export data",
  ],
  "Claims Adjuster": ["View assigned claims", "Create claims", "Edit claims", "View reports"],
  Surveyor: ["View assigned claims", "Add survey reports", "Upload documents"],
  "Read Only": ["View assigned claims"],
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        // Try to fetch from API
        const response = await fetch(`/api/users/${userId}`)

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // If API fails, use sample data
          const sampleUsers = [
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

          const foundUser = sampleUsers.find((u) => u.id.toString() === userId?.toString())
          if (foundUser) {
            setUser(foundUser)
          } else {
            toast({
              title: "User not found",
              description: "The requested user could not be found.",
              variant: "destructive",
            })
            router.push("/settings")
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to load user details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, router])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Loading user details...</h1>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">User not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>Basic user account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p className="text-lg font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={user.status === "active" ? "success" : "outline"} className="mt-1">
                  {user.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-lg font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline">Reset Password</Button>
              <Button>Edit User</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>User role and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Role: {user.role}</h3>
              <ul className="space-y-2">
                {ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]?.map((permission, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>User's recent actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  datetime: "2023-06-20 14:32:15",
                  action: "Updated",
                  resource: "Claim #1234",
                  details: "Changed status from Pending to Approved",
                },
                {
                  datetime: "2023-06-19 10:15:22",
                  action: "Created",
                  resource: "Claim #1235",
                  details: "New claim for policy P-789",
                },
                {
                  datetime: "2023-06-18 16:45:30",
                  action: "Viewed",
                  resource: "Report",
                  details: "Monthly claims summary",
                },
                {
                  datetime: "2023-06-17 11:22:05",
                  action: "Updated",
                  resource: "Profile",
                  details: "Changed contact information",
                },
                {
                  datetime: "2023-06-16 09:10:45",
                  action: "Logged in",
                  resource: "System",
                  details: "IP: 192.168.1.101",
                },
              ].map((activity, i) => (
                <TableRow key={i}>
                  <TableCell>{activity.datetime}</TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.resource}</TableCell>
                  <TableCell>{activity.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
