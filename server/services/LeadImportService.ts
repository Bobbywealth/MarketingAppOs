import { Request, Response } from "express";
import { storage } from "../storage";
import { leads } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { insertLeadSchema } from "@shared/schema";
import { ZodError } from "zod";
import fs from "fs/promises";
import OpenAI from "openai";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ dest: '/tmp/uploads/' });

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const handleParseFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.file;
    const leadsList: any[] = [];

    if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || file.originalname.endsWith('.csv')) {
      const content = await fs.readFile(file.path, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const lead: any = {
          stage: 'prospect',
          score: 'warm',
          source: 'import'
        };

        headers.forEach((header, index) => {
          const value = values[index];
          if (!value) return;

          if (header.includes('name') || header.includes('contact')) {
            lead.name = value;
          } else if (header.includes('email') || header.includes('e-mail')) {
            lead.email = value;
          } else if (header.includes('phone') || header.includes('mobile') || header.includes('tel')) {
            lead.phone = value;
          } else if (header.includes('company') || header.includes('organization')) {
            lead.company = value;
          } else if (header.includes('website') || header.includes('url')) {
            lead.website = value;
          } else if (header.includes('industry') || header.includes('vertical') || header.includes('sector')) {
            lead.industry = value;
          } else if (header.includes('tag') || header.includes('カテゴ') || header.includes('label')) {
            if (value) {
              lead.tags = value.split(',').map((t: string) => t.trim()).filter((t: string) => t);
            }
          } else if (header.includes('address') || header.includes('location')) {
            lead.address = value;
          } else if (header.includes('city')) {
            lead.city = value;
          } else if (header.includes('state') || header.includes('province')) {
            lead.state = value;
          } else if (header.includes('zip') || header.includes('postal')) {
            lead.zipCode = value;
          } else if (header.includes('value') || header.includes('amount')) {
            lead.value = Math.round(parseFloat(value) * 100) || null;
          } else if (header.includes('note') || header.includes('description') || header.includes('comment')) {
            lead.notes = value;
          }
        });

        if (!lead.company && lead.name) {
          lead.company = lead.name;
          lead.name = null;
        }
        
        if (lead.company) {
          leadsList.push(lead);
        }
      }

    } else if (file.mimetype === 'application/pdf') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const pdfBuffer = await fs.readFile(file.path);
      const pdfText = pdfBuffer.toString('utf-8');
      
      const systemPrompt = `You are a lead extraction assistant. Extract contact/lead information from the provided text.\n      \nReturn a JSON array of leads with these fields:\n- name (required)\n- email\n- phone\n- company\n- website\n- address\n- city\n- state\n- zipCode\n- estimatedValue (number)\n- notes\n\nOnly extract actual leads/contacts. Skip headers, footers, and non-contact information.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract leads from this text:\n\n${pdfText}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        leadsList.push(...(parsed.leads || []));
      }
    } else {
      return res.status(400).json({ message: "Invalid file type. Please upload CSV or PDF." });
    }

    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error("Failed to delete uploaded file:", cleanupError);
    }

    res.json({ leads: leadsList, count: leadsList.length });
  } catch (error: any) {
    console.error("File parsing error:", error);
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to delete uploaded file after error:", cleanupError);
      }
    }
    res.status(500).json({ message: "Failed to parse file", error: error.message });
  }
};

export const handleBulkImport = async (req: Request, res: Response) => {
  try {
    const { leads: leadsToImport } = req.body;
    
    if (!Array.isArray(leadsToImport) || leadsToImport.length === 0) {
      return res.status(400).json({ message: "No leads provided" });
    }

    let imported = 0;
    let skipped = 0;
    const existingLeads = await storage.getLeads();

    // Use a Set for O(1) lookups instead of O(n) .some() for each lead
    const existingEmails = new Set(existingLeads.map(l => l.email).filter(Boolean));

    for (const leadData of leadsToImport) {
      try {
        if (leadData.email && existingEmails.has(leadData.email)) {
          skipped++;
          continue;
        }

        const validatedData = insertLeadSchema.parse({
          ...leadData,
          stage: leadData.stage || 'prospect',
          score: leadData.score || 'warm',
          source: leadData.source || 'import',
          createdAt: new Date(),
        });

        await storage.createLead(validatedData);
        // Add to set to avoid duplicates within the same import batch
        if (validatedData.email) {
          existingEmails.add(validatedData.email);
        }
        imported++;
      } catch (error) {
        console.error("Failed to import lead:", leadData, error);
        skipped++;
      }
    }

    res.json({ imported, skipped, total: leadsToImport.length });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    res.status(500).json({ message: "Failed to import leads", error: error.message });
  }
};

export { upload };
