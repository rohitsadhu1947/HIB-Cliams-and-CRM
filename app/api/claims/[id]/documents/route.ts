import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const claimId = params.id

    // Check if the request is multipart form data
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file") as File
      const documentType = formData.get("documentType") as string

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      console.log(`Processing file: ${file.name}, type: ${documentType}, size: ${file.size} bytes`)

      // Generate a virtual file path (we're not actually storing files)
      const timestamp = Date.now()
      const filePath = `/uploads/${claimId}/${timestamp}-${file.name.replace(/\s+/g, "-")}`

      try {
        const newDocument = await sql`
          INSERT INTO documents (
            claim_id, 
            document_type, 
            file_name, 
            file_path,
            file_size,
            mime_type,
            upload_date
          ) VALUES (
            ${claimId}, 
            ${documentType}, 
            ${file.name},
            ${filePath},
            ${file.size},
            ${file.type},
            CURRENT_TIMESTAMP
          ) RETURNING id, claim_id, document_type, file_name, file_path, file_size, mime_type, upload_date
        `

        console.log("Document metadata saved successfully:", newDocument[0])

        return NextResponse.json({
          success: true,
          document: newDocument[0],
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
        return NextResponse.json(
          {
            error: "Database error: " + (dbError instanceof Error ? dbError.message : "Unknown database error"),
          },
          { status: 500 },
        )
      }
    } else {
      // For non-multipart requests, try to parse as JSON
      let body
      try {
        body = await request.json()
      } catch (error) {
        console.error("Error parsing request body:", error)
        return NextResponse.json(
          {
            error: "Invalid request format. Expected multipart/form-data or valid JSON",
          },
          { status: 400 },
        )
      }

      try {
        const newDocument = await sql`
          INSERT INTO documents (
            claim_id, 
            document_type, 
            file_name,
            file_path,
            upload_date
          ) VALUES (
            ${claimId}, 
            ${body.documentType}, 
            ${body.fileName},
            ${body.filePath || "/placeholder"},
            CURRENT_TIMESTAMP
          ) RETURNING id, claim_id, document_type, file_name, file_path, upload_date
        `

        return NextResponse.json({
          success: true,
          document: newDocument[0],
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
        return NextResponse.json(
          {
            error: "Database error: " + (dbError instanceof Error ? dbError.message : "Unknown database error"),
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error adding document:", error)
    return NextResponse.json(
      {
        error: "Failed to add document: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// Get documents for a claim
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const claimId = params.id

    const documents = await sql`
      SELECT 
        id, 
        claim_id, 
        document_type, 
        file_name, 
        file_path,
        file_size, 
        mime_type, 
        upload_date
      FROM documents 
      WHERE claim_id = ${claimId}
      ORDER BY upload_date DESC
    `

    return NextResponse.json({
      success: true,
      documents: documents,
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch documents: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
