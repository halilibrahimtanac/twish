import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const twishId = req.nextUrl.searchParams.get("twishId");
  
  if (!twishId) {
    return NextResponse.json(
      { message: "Twish ID not provided" },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), `/public/uploads/twishes/${twishId}`);
  
  try {
    await fs.access(uploadDir);
  } catch (error) {
    console.error(error);
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { message: "No files uploaded." },
      { status: 400 }
    );
  }

  const maxFiles = 4;
  if (files.length > maxFiles) {
    return NextResponse.json(
      { message: `Maximum ${maxFiles} files allowed.` },
      { status: 400 }
    );
  }

  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo", // .avi
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  try {
    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { message: `File too large: ${file.name}. Maximum size is 50MB.` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf(".");
      
      let uniqueFileName;
      if (lastDotIndex === -1) {
        uniqueFileName = `${fileName}_${crypto.randomUUID()}`;
      } else {
        const nameWithoutExtension = fileName.substring(0, lastDotIndex);
        const extension = fileName.substring(lastDotIndex);
        uniqueFileName = `${nameWithoutExtension}_${crypto.randomUUID()}${extension}`;
      }

      const filePath = path.join(uploadDir, uniqueFileName);

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // Determine file type category
      const isVideo = file.type.startsWith("video/");
      const fileType = isVideo ? "video" : "image";

      uploadedFiles.push({
        id: crypto.randomUUID(),
        type: fileType,
        originalName: fileName,
        fileName: uniqueFileName,
        url: `/uploads/twishes/${twishId}/${uniqueFileName}`,
        size: file.size,
        mimeType: file.type,
      });
    }

    return NextResponse.json({ 
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length 
    });

  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { message: "Something went wrong during file upload." },
      { status: 500 }
    );
  }
}