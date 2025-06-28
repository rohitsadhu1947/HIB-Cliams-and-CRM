"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, X, FileText, ImageIcon, FileCheck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { PolicyCombobox } from "@/components/policy-combobox"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  reportDate: z.string().min(1, "Report date is required"),
  incidentLocation: z.string().min(1, "Incident location is required"),
  incidentDescription: z.string().min(10, "Incident description must be at least 10 characters"),
  damageDescription: z.string().min(10, "Damage description must be at least 10 characters"),
  estimatedAmount: z.string().min(1, "Estimated amount is required"),
})

// Document types
const DOCUMENT_TYPES = {
  fir: "FIR Copy",
  photos: "Damage Photos",
  estimate: "Repair Estimate",
  other: "Other Documents",
}

export default function NewClaimPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFile, setUploadingFile] = useState("")
  const [documents, setDocuments] = useState<{ [key: string]: File[] }>({
    fir: [],
    photos: [],
    estimate: [],
    other: [],
  })
  const router = useRouter()
  const fileInputRefs = {
    fir: useRef<HTMLInputElement>(null),
    photos: useRef<HTMLInputElement>(null),
    estimate: useRef<HTMLInputElement>(null),
    other: useRef<HTMLInputElement>(null),
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyNumber: "",
      incidentDate: "",
      reportDate: new Date().toISOString().split("T")[0],
      incidentLocation: "",
      incidentDescription: "",
      damageDescription: "",
      estimatedAmount: "",
    },
    mode: "onTouched",
  })

  // Handle policy selection
  const handlePolicySelect = (policy: { id: string; policy_number: string }) => {
    setSelectedPolicyId(policy.id)
  }

  // Handle file selection
  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setDocuments((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newFiles],
      }))
    }
  }

  // Remove a file
  const removeFile = (type: string, index: number) => {
    setDocuments((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  // Trigger file input click
  const triggerFileInput = (type: string) => {
    fileInputRefs[type as keyof typeof fileInputRefs]?.current?.click()
  }

  // Check if any documents are selected
  const hasDocuments = Object.values(documents).some((files) => files.length > 0)

  // Get total document count
  const totalDocuments = Object.values(documents).reduce((sum, files) => sum + files.length, 0)

  // Upload documents for a claim
  const uploadDocuments = async (claimId: string) => {
    let uploadedCount = 0
    let failedCount = 0
    const totalFiles = Object.values(documents).flat().length

    if (totalFiles === 0) return true

    try {
      for (const [type, files] of Object.entries(documents)) {
        for (const file of files) {
          setUploadingFile(file.name)

          // Create form data for file upload
          const formData = new FormData()
          formData.append("file", file)
          formData.append("documentType", DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES])

          try {
            // Upload the file
            const response = await fetch(`/api/claims/${claimId}/documents`, {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.error(`Upload failed for ${file.name}:`, errorData)
              failedCount++
              continue // Continue with next file even if this one failed
            }

            uploadedCount++
            setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
          } catch (fileError) {
            console.error(`Error uploading ${file.name}:`, fileError)
            failedCount++
          }
        }
      }

      // Show warning if some files failed
      if (failedCount > 0) {
        toast({
          title: "Warning",
          description: `${uploadedCount} files uploaded, ${failedCount} files failed. You can add documents later.`,
          variant: "destructive",
        })
      }

      // Return true if at least some files were uploaded successfully or if all files failed but we want to continue
      return true
    } catch (error) {
      console.error("Error in document upload process:", error)
      toast({
        title: "Document Upload Issue",
        description: "There was a problem uploading documents, but your claim was saved. You can add documents later.",
        variant: "destructive",
      })
      return true // Return true to continue with claim submission
    }
  }

  // Handle form submission - only called from the final review step
  const handleSubmitClaim = async () => {
    // Get form values
    const values = form.getValues()

    // Validate that a valid policy was selected
    if (!selectedPolicyId) {
      toast({
        title: "Invalid policy",
        description: "Please select a valid policy number from the dropdown",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // First submit the claim data
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyId: selectedPolicyId,
          incidentDate: values.incidentDate,
          reportDate: values.reportDate,
          incidentLocation: values.incidentLocation,
          incidentDescription: values.incidentDescription,
          damageDescription: values.damageDescription,
          estimatedAmount: Number.parseInt(values.estimatedAmount, 10) || 0,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error("Failed to submit claim. Server returned an error.")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to submit claim")
      }

      const claimId = data.claim.id

      // Then upload documents if any
      if (hasDocuments) {
        try {
          await uploadDocuments(claimId)
        } catch (uploadError) {
          console.error("Document upload error:", uploadError)
          toast({
            title: "Document Upload Issue",
            description:
              "There was a problem uploading documents, but your claim was saved. You can add documents later.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Claim submitted successfully",
        description: `Claim number: ${data.claim.claim_number}`,
      })

      router.push("/claims")
    } catch (error) {
      console.error("Error submitting claim:", error)
      toast({
        title: "Error submitting claim",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step - validates current step before proceeding
  const handleNextStep = async () => {
    if (step === 1) {
      // Validate step 1 fields
      const step1Valid = await form.trigger(["policyNumber", "incidentDate", "reportDate", "incidentLocation"])

      if (step1Valid) setStep(2)
    } else if (step === 2) {
      // Validate step 2 fields
      const step2Valid = await form.trigger(["incidentDescription", "damageDescription", "estimatedAmount"])

      if (step2Valid) setStep(3)
    } else if (step === 3) {
      // Move to review step - no validation needed
      setStep(4)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/claims">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Claim</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle>Submit New Claim</CardTitle>
            <CardDescription>Please fill in the details to submit a new insurance claim</CardDescription>

            {/* Step indicator */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  1
                </div>
                <div className={`h-1 w-12 ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className="flex items-center">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  2
                </div>
                <div className={`h-1 w-12 ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className="flex items-center">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  3
                </div>
                <div className={`h-1 w-12 ${step >= 4 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className="flex items-center">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  4
                </div>
              </div>
            </div>

            {/* Step labels */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div className="text-center">Basic Info</div>
              <div className="text-center">Damage Details</div>
              <div className="text-center">Documents</div>
              <div className="text-center">Review</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                          <PolicyCombobox
                            value={field.value}
                            onChange={field.onChange}
                            onPolicySelect={handlePolicySelect}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter incident location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="incidentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe how the incident occurred"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="damageDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Damage Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the damage to the vehicle"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Amount (₹)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter estimated amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Upload Documents</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {/* FIR Document */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium">FIR Copy</h3>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => triggerFileInput("fir")}>
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                          <input
                            ref={fileInputRefs.fir}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileChange("fir", e)}
                          />
                        </div>
                        {documents.fir.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {documents.fir.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
                              >
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile("fir", index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No FIR document uploaded</p>
                        )}
                      </div>

                      {/* Damage Photos */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium">Damage Photos</h3>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => triggerFileInput("photos")}>
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                          <input
                            ref={fileInputRefs.photos}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileChange("photos", e)}
                          />
                        </div>
                        {documents.photos.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {documents.photos.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
                              >
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile("photos", index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No damage photos uploaded</p>
                        )}
                      </div>

                      {/* Repair Estimate */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium">Repair Estimate</h3>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => triggerFileInput("estimate")}>
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                          <input
                            ref={fileInputRefs.estimate}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange("estimate", e)}
                          />
                        </div>
                        {documents.estimate.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {documents.estimate.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
                              >
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile("estimate", index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No repair estimate uploaded</p>
                        )}
                      </div>

                      {/* Other Documents */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium">Other Documents</h3>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => triggerFileInput("other")}>
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                          <input
                            ref={fileInputRefs.other}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => handleFileChange("other", e)}
                          />
                        </div>
                        {documents.other.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {documents.other.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
                              >
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile("other", index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No other documents uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      Review Claim Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Basic Information</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Policy Number:</span>
                            <p>{form.getValues().policyNumber}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Incident Date:</span>
                            <p>{form.getValues().incidentDate}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Report Date:</span>
                            <p>{form.getValues().reportDate}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Incident Location:</span>
                            <p>{form.getValues().incidentLocation}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Damage Details</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Incident Description:</span>
                            <p className="text-sm">{form.getValues().incidentDescription}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Damage Description:</span>
                            <p className="text-sm">{form.getValues().damageDescription}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Estimated Amount:</span>
                            <p>₹{form.getValues().estimatedAmount}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Documents</h4>
                      <div className="bg-background p-3 rounded border">
                        {totalDocuments > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(documents).map(
                              ([type, files]) =>
                                files.length > 0 && (
                                  <div key={type}>
                                    <span className="text-sm font-medium">
                                      {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]}:
                                    </span>
                                    <p className="text-sm">{files.length} file(s) attached</p>
                                  </div>
                                ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No documents attached</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSubmitting && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading: {uploadingFile}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                    Previous
                  </Button>
                )}

                {step < 4 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmitClaim}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Claim"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
