"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Document {
  id: number
  document_type: string
  file_name: string
  upload_date: string
}

interface ClaimDocumentsTabProps {
  claimId: string
  initialDocuments: Document[]
}

export function ClaimDocumentsTab({ claimId, initialDocuments }: ClaimDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      toast({
        title: "Downloading...",
        description: `Downloading ${fileName}`,
      })

      // Create a direct link to the document
      const downloadUrl = `/api/claims/${claimId}/documents/${documentId}`

      // Create a temporary anchor element
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading the document.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      const response = await fetch(`/api/claims/${claimId}/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.id !== documentId))
        toast({
          title: "Document Deleted",
          description: "The document was successfully deleted.",
        })
      } else {
        toast({
          title: "Delete Failed",
          description: "There was an error deleting the document.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Documents</CardTitle>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.file_name}</TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id, doc.file_name)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No documents found</div>
        )}
      </CardContent>
    </Card>
  )
}
