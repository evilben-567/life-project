import formidable from "formidable";
import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Extracts plain text from a PDF file buffer
async function extractPdfText(fileBuffer) {
  const uint8Array = new Uint8Array(fileBuffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  let fullText = '';
  // Loop through every page in the PDF and pull out its text
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
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
      res.status(500).json({ error: "Failed to extract text" });
    }
  });
}