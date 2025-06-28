"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  policyHolderId: z.string().min(1, "Policy holder is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  policyType: z.string().min(1, "Policy type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  premiumAmount: z.string().min(1, "Premium amount is required"),
  coverageAmount: z.string().min(1, "Coverage amount is required"),
})

export default function NewPolicyPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [policyHolders, setPolicyHolders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [error, setError] = useState("")
  const router = useRouter()

  // Fetch policy holders and vehicles when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch policy holders
        const policyHoldersResponse = await fetch("/api/policy-holders")
        if (!policyHoldersResponse.ok) {
          throw new Error("Failed to fetch policy holders")
        }
        const policyHoldersData = await policyHoldersResponse.json()

        // If no policy holders found, use sample data
        if (policyHoldersData.policyHolders && policyHoldersData.policyHolders.length > 0) {
          setPolicyHolders(policyHoldersData.policyHolders)
        } else {
          // Fallback to sample data
          setPolicyHolders([
            { id: "1", name: "Vikram Singh" },
            { id: "2", name: "Priya Patel" },
            { id: "3", name: "Rahul Sharma" },
          ])
        }

        // Fetch vehicles
        const vehiclesResponse = await fetch("/api/vehicles")
        if (!vehiclesResponse.ok) {
          throw new Error("Failed to fetch vehicles")
        }
        const vehiclesData = await vehiclesResponse.json()

        // If no vehicles found, use sample data
        if (vehiclesData.vehicles && vehiclesData.vehicles.length > 0) {
          setVehicles(vehiclesData.vehicles)
        } else {
          // Fallback to sample data
          setVehicles([
            { id: "1", registration: "MH01AB1234", make: "Maruti Suzuki", model: "Swift" },
            { id: "2", registration: "KA02CD5678", make: "Hyundai", model: "Creta" },
            { id: "3", registration: "DL03EF9012", make: "Honda", model: "City" },
          ])
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Using sample data instead.")

        // Set sample data as fallback
        setPolicyHolders([
          { id: "1", name: "Vikram Singh" },
          { id: "2", name: "Priya Patel" },
          { id: "3", name: "Rahul Sharma" },
        ])

        setVehicles([
          { id: "1", registration: "MH01AB1234", make: "Maruti Suzuki", model: "Swift" },
          { id: "2", registration: "KA02CD5678", make: "Hyundai", model: "Creta" },
          { id: "3", registration: "DL03EF9012", make: "Honda", model: "City" },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyHolderId: "",
      vehicleId: "",
      policyType: "Comprehensive",
      startDate: "",
      endDate: "",
      premiumAmount: "",
      coverageAmount: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // In a real implementation, we would submit the form data to the API
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to create policy")
      }

      toast({
        title: "Policy created successfully",
        description: "The policy has been created successfully.",
      })

      router.push("/policies")
    } catch (error) {
      console.error("Error creating policy:", error)
      toast({
        title: "Error creating policy",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Policy</h1>
      </div>

      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Policy</CardTitle>
          <CardDescription>Enter the details to create a new insurance policy</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {step === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="policyHolderId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Policy Holder</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => router.push("/policy-holders/new")}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add New
                            </Button>
                          </div>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a policy holder" />
                              </SelectTrigger>
                              <SelectContent>
                                {policyHolders.map((holder) => (
                                  <SelectItem key={holder.id} value={holder.id.toString()}>
                                    {holder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Vehicle</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => router.push("/vehicles/new")}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add New
                            </Button>
                          </div>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle" />
                              </SelectTrigger>
                              <SelectContent>
                                {vehicles.map((vehicle) => (
                                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                    {vehicle.make} {vehicle.model} ({vehicle.registration})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="policyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select policy type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                                <SelectItem value="Third Party">Third Party</SelectItem>
                                <SelectItem value="Own Damage">Own Damage</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="premiumAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Amount (₹)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter premium amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coverageAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Amount (₹)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter coverage amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                      Previous
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button type="button" onClick={() => setStep(step + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Policy"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
