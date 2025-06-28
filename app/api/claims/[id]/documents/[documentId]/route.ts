import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string; documentId: string } }) {
  try {
    const { documentId } = params

    console.log("Downloading document with ID:", documentId)

    const document = await sql`
      SELECT file_name, file_path, mime_type, file_size
      FROM documents 
      WHERE id = ${documentId}
    `

    if (document.length === 0) {
      console.log("Document not found")
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc = document[0]
    console.log("Found document:", doc)

    // Since we're not storing actual file content, we'll create a placeholder response
    // In a real implementation, you would fetch the file from your storage service
    const placeholderContent = `This is a placeholder for the document: ${doc.file_name}
    
Document Type: ${doc.mime_type || "Unknown"}
File Size: ${doc.file_size || 0} bytes
    
Note: This is a demo system. In a production environment, 
the actual file content would be retrieved from a file storage service.`

    const buffer = Buffer.from(placeholderContent, "utf-8")

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mime_type || "text/plain",
        "Content-Disposition": `attachment; filename="${doc.file_name}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      {
        error: "Failed to download document: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; documentId: string } }) {
  try {
    const { documentId } = params

    await sql`
      DELETE FROM documents 
      WHERE id = ${documentId}
    `

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      {
        error: "Failed to delete document: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
