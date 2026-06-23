import formidable from "formidable";
import fs from "fs";
import { extractText, getDocumentProxy } from "unpdf";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function extractPdfText(fileBuffer) {
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read file" });
    }

    const file = files.file[0];

    try {
      let extractedText = '';

      if (file.mimetype === 'application/pdf') {
        const fileBuffer = fs.readFileSync(file.filepath);
        extractedText = await extractPdfText(fileBuffer);
      } else {
        extractedText = fs.readFileSync(file.filepath, 'utf8');
      }

      const trimmedText = extractedText.slice(0, 15000);
      res.json({ text: trimmedText });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to extract text" });
    }
  });
}