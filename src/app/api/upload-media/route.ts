import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const twishId = req.nextUrl.searchParams.get("twishId");
  
  if (!twishId) {
    return NextResponse.json(
      { message: "Twish ID not provided" },
      { status: 400 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { message: "Upload service is not configured." },
      { status: 500 }
    );
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

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("upload_preset", uploadPreset);
      uploadForm.append("folder", `twishes/${twishId}`);
      uploadForm.append("public_id", uniqueFileName);

      const cloudinaryRes = await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm,
      });

      if (!cloudinaryRes.ok) {
        const errorBody = await cloudinaryRes.text();
        console.error("Cloudinary upload failed:", cloudinaryRes.status, errorBody);
        return NextResponse.json(
          { message: "Upload failed." },
          { status: 500 }
        );
      }

      const result = await cloudinaryRes.json();

      // Determine file type category
      const isVideo = file.type.startsWith("video/");
      const fileType = isVideo ? "video" : "image";

      uploadedFiles.push({
        id: crypto.randomUUID(),
        type: fileType,
        originalName: fileName,
        fileName: result.public_id as string,
        url: result.secure_url as string,
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
