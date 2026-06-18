import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // formidable reads the incoming file from the request
  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read file" });
    }

    const file = files.file[0];

    try {
      let extractedText = '';

      if (file.mimetype === 'application/pdf') {
        // Read the PDF file from disk into memory
        const fileBuffer = fs.readFileSync(file.filepath);
        // Pull the plain text out of the PDF
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else {
        // For plain text files, just read them directly
        extractedText = fs.readFileSync(file.filepath, 'utf8');
      }

      // Limit the text so we don't send something massive to Claude
      const trimmedText = extractedText.slice(0, 15000);

      res.json({ text: trimmedText });
    } catch (error) {
      res.status(500).json({ error: "Failed to extract text" });
    }
  });
}