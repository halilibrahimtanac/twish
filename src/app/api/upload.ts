/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";
import formidable, { File } from "formidable";

/* IMPORTANT: You need to disable the default body parser for file uploads */
export const config = {
  api: {
    bodyParser: false,
  },
};

type ProcessedFiles = Array<[string, File]>;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  if(!req.query.userId) return res.status(400).json({ message: "User id not provided" });

  const uploadDir = path.join(process.cwd(), `/public/uploads/${req.query.userId}`);
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Use formidable to parse the form data, including the file
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    filename: (name, ext, part, form) => {
        return part.originalFilename + "_" + crypto.randomUUID();
    }
  });

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file;

    if (!uploadedFile) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
    const fileName = file.newFilename;

    res.status(200).json({ url: fileName });

  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export default handler;