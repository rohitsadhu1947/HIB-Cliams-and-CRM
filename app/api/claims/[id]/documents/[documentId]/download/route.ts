import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string; documentId: string } }) {
  try {
    const claimId = params.id
    const documentId = params.documentId

    // Get document metadata
    const documents = await sql`
      SELECT 
        id, 
        document_type, 
        file_name, 
        file_path,
        mime_type
      FROM documents 
      WHERE id = ${documentId} AND claim_id = ${claimId}
    `

    if (!documents.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = documents[0]

    // Create a placeholder file content
    const placeholderContent = `This is a placeholder for document: ${document.file_name}
Type: ${document.document_type}
Path: ${document.file_path}
ID: ${document.id}

In a production environment, this would be the actual file content.`

    // Set appropriate headers for download
    const headers = new Headers()
    headers.set("Content-Type", "text/plain")
    headers.set("Content-Disposition", `attachment; filename="${document.file_name}"`)

    return new NextResponse(placeholderContent, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}
