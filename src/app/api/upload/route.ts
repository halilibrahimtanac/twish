import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { message: "User id not provided" },
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
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
  }

  const fileName = file.name ?? "file";
  const lastDotIndex = fileName.lastIndexOf(".");

  const sanitizePublicId = (name: string) => {
    const normalized = name.normalize("NFKD");
    const sanitized = normalized
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return sanitized || "file";
  };

  const nameWithoutExtension =
    lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  const safeBaseName = sanitizePublicId(nameWithoutExtension);
  const uniqueFileName = `${safeBaseName}-${crypto.randomUUID()}`;

  try {
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("upload_preset", uploadPreset);
    uploadForm.append("folder", `users/${userId}`);
    uploadForm.append("public_id", uniqueFileName);

    const cloudinaryRes = await fetch(cloudinaryUrl, {
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

    const data = await cloudinaryRes.json();

    return NextResponse.json({
      url: data.secure_url as string,
      publicId: data.public_id as string,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
