import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { processAIChat } from "../aiManager";
import { UserRole } from "@shared/roles";
import { emailNotifications } from "../emailService";
import { upload } from "./common";
import fs from "fs/promises";
import OpenAI from "openai";

const router = Router();

/**
 * Legacy Regex-based AI Command Parser
 * Currently maintained for compatibility, but GPT-4 path is preferred.
 */
async function processAICommand(message: string, userId: number): Promise<{
  success: boolean;
  response: string;
  actionTaken?: string;
  error?: string;
  errorDetails?: string;
}> {
  const lowerMessage = message.toLowerCase().trim();
  
  try {
    // CLIENT MANAGEMENT
    if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
      if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all')) {
        const clients = await storage.getClients();
        if (clients.length === 0) {
          return {
            success: true,
            response: "You don't have any clients yet! Ready to add your first one? Just say something like 'Create a client named John Smith' 🎉",
          };
        }
        return {
          success: true,
          response: `You've got ${clients.length} client${clients.length === 1 ? '' : 's'}! Here's a quick look: ${clients.slice(0, 5).map(c => c.name).join(', ')}${clients.length > 5 ? ' and more!' : '! 😊'}`,
        };
      }
      
      if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
        const nameMatch = message.match(/(?:name|called|named)\s+(?:is\s+)?([A-Z][a-zA-Z\s]+?)(?:,|\s+(?:with|email|phone|company)|$)/i);
        const emailMatch = message.match(/(?:email|e-mail)\s+(?:is\s+)?([\w\.-]+@[\w\.-]+\.\w+)/i);
        const phoneMatch = message.match(/(?:phone|number)\s+(?:is\s+)?([\+\(\)\s\d-]+)/i);
        const companyMatch = message.match(/(?:company|business)\s+(?:is\s+)?([A-Z][a-zA-Z\s&]+?)(?:,|\s+(?:with|email|phone)|$)/i);
        
        const clientData: any = {
          name: nameMatch ? nameMatch[1].trim() : 'New Client',
          email: emailMatch ? emailMatch[1] : null,
          phone: phoneMatch ? phoneMatch[1] : null,
          company: companyMatch ? companyMatch[1].trim() : null,
        };
        
        if (!nameMatch) {
          return {
            success: true,
            response: "I'd love to create a client for you! But I need a name first 😊 Try something like: 'Create a client named John Smith' or 'Add a new client called Sarah Johnson'",
          };
        }
        
        const newClient = await storage.createClient({
          ...clientData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Email alert to admins
        try {
          const allUsers = await storage.getUsers();
          const admins = allUsers.filter(u => u.role === UserRole.ADMIN && u.email);
          if (admins.length > 0) {
            const adminsToNotify = [];
            for (const admin of admins) {
              const prefs = await storage.getUserNotificationPreferences(admin.id);
              if (prefs?.emailNotifications !== false) {
                adminsToNotify.push(admin.email as string);
              }
            }
            if (adminsToNotify.length > 0) {
              void emailNotifications.sendNewClientAlert(
                adminsToNotify,
                newClient.name,
                newClient.company || '',
                newClient.email || ''
              ).catch(err => console.error('Failed to send AI client email alert:', err));
            }
          }
        } catch (notifError) {
          console.error('Failed to notify admins about new AI client via email:', notifError);
        }

        return {
          success: true,
          response: `Awesome! 🎉 I just added "${newClient.name}" to your client list!${emailMatch ? ` I saved their email too: ${emailMatch[1]}` : ''}`,
          actionTaken: `Created client: ${newClient.name}`,
        };
      }
    }
    
    // TASK MANAGEMENT
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all')) {
        const tasks = await storage.getTasks();
        const pending = tasks.filter(t => t.status === 'pending').length;
        if (tasks.length === 0) return { success: true, response: "Your task list is empty! 🎉" };
        return { success: true, response: `You have ${tasks.length} tasks total! 📋 ${pending} still to do.` };
      }
      
      if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
        const titleMatch = message.match(/(?:task|todo|reminder)\s+(?:named|called|is\s+)?(?:to\s+)?(.+?)(?:with|due|by|$)/i);
        if (!titleMatch) return { success: true, response: "What do you need to get done? 🤔" };
        
        const newTask = await storage.createTask({
          title: titleMatch[1].trim(),
          status: 'pending',
          priority: 'medium',
          assignedTo: String(userId),
          createdBy: String(userId),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true, response: `Got it! ✅ I added "${newTask.title}" to your task list.`, actionTaken: `Created task: ${newTask.title}` };
      }
    }

    // Default friendly fallback
    return {
      success: true,
      response: "I'm not quite sure how to help with that yet! 🤔 Try asking about clients, tasks, or your calendar.",
    };
    
  } catch (error: any) {
    return { success: false, response: `Error: ${error.message}`, error: error.message };
  }
}

// AI Chat endpoint using GPT-4
router.post("/chat", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    console.log(`🤖 AI Chat Request from user ${userId}:`, message);

    const result = await processAIChat(message, userId, conversationHistory || []);
    res.json(result);
  } catch (error: any) {
    console.error('❌ AI Business Manager error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process AI request",
      error: error.message 
    });
  }
});

// Legacy Command endpoint (Regex-based)
router.post("/command", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!message) return res.status(400).json({ message: "Message is required" });

    const result = await processAICommand(message, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI Business Manager - Voice Transcription endpoint
router.post("/transcribe", isAuthenticated, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided"
      });
    }

    console.log(`🎤 Transcription request from user ${userId}, file: ${req.file.filename}`);

    if (!process.env.OPENAI_API_KEY) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(503).json({
        success: false,
        error: "Voice transcription requires OpenAI API key to be configured"
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Read the audio file
    const audioFileData = await fs.readFile(req.file.path);
    
    // Create a File object for OpenAI (Node.js version might need a different approach depending on OpenAI SDK version)
    // For OpenAI Node SDK v4+, you can pass a ReadStream or Buffer
    const transcription = await openai.audio.transcriptions.create({
      file: await fs.open(req.file.path, 'r') as any, // Passing the stream
      model: "whisper-1",
      language: "en",
    });

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(console.error);

    console.log(`✅ Transcription successful: "${transcription.text}"`);

    res.json({
      success: true,
      text: transcription.text
    });

  } catch (error: any) {
    console.error("Transcription error:", error);
    
    // Clean up file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to transcribe audio"
    });
  }
});

export default router;

