/* eslint-disable @typescript-eslint/no-unused-vars */
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { message: "User id not provided" },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), `/public/uploads/${userId}`);
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
  }

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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ url: uniqueFileName });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
