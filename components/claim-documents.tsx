"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Document {
  id: number
  document_type: string
  file_name: string
  file_size: number
  mime_type: string
  upload_date: string
}

interface ClaimDocumentsProps {
  claimId: string
}

export function ClaimDocuments({ claimId }: ClaimDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [claimId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/claims/${claimId}/documents`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/documents/${documentId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const deleteDocument = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      const response = await fetch(`/api/claims/${claimId}/documents/${documentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setDocuments(documents.filter((doc) => doc.id !== documentId))
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading documents...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-muted-foreground">No documents uploaded for this claim.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{document.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {document.document_type} • {formatFileSize(document.file_size)} •{" "}
                      {new Date(document.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => downloadDocument(document.id, document.file_name)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteDocument(document.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
