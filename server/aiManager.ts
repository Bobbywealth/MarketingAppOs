import OpenAI from 'openai';
import { storage } from './storage';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * GPT-4 Powered AI Business Manager
 * Natural conversation + Real actions
 */

let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

if (process.env.GOOGLE_GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
}

type ChatRole = "user" | "assistant";

type ConversationMessage = { role: ChatRole; content: string };

type PendingAction = {
  functionName: string;
  args: any;
  createdAt: number;
};

const WRITE_FUNCTIONS = new Set(["create_client", "create_task", "send_message"]);
const pendingActionsByUserId = new Map<number, PendingAction>();

function sanitizeConversationHistory(
  conversationHistory: Array<{ role: string; content: string }> = []
): ConversationMessage[] {
  return (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content),
    }));
}

function isConfirmMessage(message: string): boolean {
  const normalized = String(message || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return [
    "confirm",
    "yes",
    "y",
    "ok",
    "okay",
    "do it",
    "proceed",
    "go ahead",
    "sounds good",
  ].includes(normalized);
}

function describePendingAction(action: PendingAction): string {
  try {
    const args = action.args || {};
    switch (action.functionName) {
      case "create_client":
        return `Create client "${args.name}"${args.email ? ` (${args.email})` : ""}`;
      case "create_task":
        return `Create task "${args.title}"${args.dueDate ? ` (due ${args.dueDate})` : ""}`;
      case "send_message":
        return `Send message to "${args.recipientName}": "${String(args.message || "").slice(0, 80)}"${
          String(args.message || "").length > 80 ? "…" : ""
        }`;
      default:
        return `${action.functionName}`;
    }
  } catch {
    return `${action.functionName}`;
  }
}

// Define the tools/functions the AI can use
const tools = [
  {
    type: "function" as const,
    function: {
      name: "list_clients",
      description: "Get a list of all clients in the system",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_client",
      description: "Create a new client in the system",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Client's full name" },
          email: { type: "string", description: "Client's email address" },
          phone: { type: "string", description: "Client's phone number" },
          company: { type: "string", description: "Client's company name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "Get a list of all tasks, optionally filtered by status",
      parameters: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            enum: ["pending", "completed", "all"],
            description: "Filter tasks by status" 
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title/description" },
          priority: { 
            type: "string", 
            enum: ["low", "medium", "high"],
            description: "Task priority level" 
          },
          dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_calendar_events",
      description: "Get calendar events, optionally for a specific date",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format, or 'today'/'tomorrow'" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_message",
      description: "Send a message to a team member",
      parameters: {
        type: "object",
        properties: {
          recipientName: { type: "string", description: "Name of the person to message" },
          message: { type: "string", description: "The message content" },
        },
        required: ["recipientName", "message"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_campaigns",
      description: "Get a list of all marketing campaigns",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_invoices",
      description: "Get invoices, optionally filtered by status",
      parameters: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            enum: ["paid", "pending", "overdue", "all"],
            description: "Filter invoices by payment status" 
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_morning_briefing",
      description: "Get a briefing of the last 24 hours of lead activity and suggested actions",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_lead_history",
      description: "Summarize interaction history for a specific lead",
      parameters: {
        type: "object",
        properties: {
          companyName: { type: "string", description: "The name of the lead's company" },
        },
        required: ["companyName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "suggest_next_step",
      description: "Suggest the next best action for a lead based on their status and history",
      parameters: {
        type: "object",
        properties: {
          companyName: { type: "string", description: "The name of the lead's company" },
        },
        required: ["companyName"],
      },
    },
  },
];

// Execute the actual functions
async function executeFunction(name: string, args: any, userId: number) {
  console.log(`🔧 Executing function: ${name}`, args);

  switch (name) {
    case "list_clients": {
      const clients = await storage.getClients();
      return {
        count: clients.length,
        clients: clients.slice(0, 10).map(c => ({
          name: c.name,
          email: c.email,
          company: c.company
        }))
      };
    }

    case "create_client": {
      const newClient = await storage.createClient({
        name: args.name,
        email: args.email || null,
        phone: args.phone || null,
        company: args.company || null,
        startDate: null,
        lastPostDate: null,
        lastVisitDate: null,
      });
      return { success: true, client: { name: newClient.name, id: newClient.id } };
    }

    case "list_tasks": {
      const tasks = await storage.getTasks();
      const filtered = args.status && args.status !== 'all' 
        ? tasks.filter(t => t.status === args.status)
        : tasks;
      return {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        tasks: filtered.slice(0, 10).map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate
        }))
      };
    }

    case "create_task": {
      const priority =
        args.priority === "high" ? "high" : args.priority === "low" ? "low" : "normal";
      const newTask = await storage.createTask({
        title: args.title,
        description: null,
        status: "todo",
        priority,
        assignedToId: userId,
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        recurringEndDate: null,
      });
      return { success: true, task: { title: newTask.title, id: newTask.id } };
    }

    case "get_calendar_events": {
      const allEvents = await storage.getCalendarEvents();
      let filtered = allEvents;
      
      if (args.date === 'today' || args.date === 'tomorrow') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = args.date === 'tomorrow' 
          ? new Date(today.getTime() + 24 * 60 * 60 * 1000)
          : today;
        const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
        
        filtered = allEvents.filter(e => {
          const eventDate = new Date(e.start);
          return eventDate >= targetDate && eventDate < nextDay;
        });
      }
      
      return {
        count: filtered.length,
        events: filtered.slice(0, 10).map(e => ({
          title: e.title,
          start: e.start,
          location: e.location
        }))
      };
    }

    case "send_message": {
      // Find user by name
      const allUsers = await storage.getAllUsers();
      const recipient = allUsers.find(u => 
        u.username.toLowerCase().includes(args.recipientName.toLowerCase()) ||
        (u.firstName && u.firstName.toLowerCase().includes(args.recipientName.toLowerCase()))
      );
      
      if (!recipient) {
        return { success: false, error: `Couldn't find user named ${args.recipientName}` };
      }
      
      await storage.createMessage({
        userId,
        recipientId: recipient.id,
        content: args.message,
        isInternal: true,
      });
      
      return { success: true, recipient: recipient.username };
    }

    case "list_campaigns": {
      const campaigns = await storage.getCampaigns();
      return {
        count: campaigns.length,
        campaigns: campaigns.slice(0, 10).map(c => ({
          name: c.name,
          status: c.status,
          startDate: c.startDate
        }))
      };
    }

    case "get_invoices": {
      const invoices = await storage.getInvoices();
      const filtered = args.status && args.status !== 'all'
        ? invoices.filter(i => i.status === args.status)
        : invoices;
      
      return {
        total: invoices.length,
        pending: invoices.filter(i => i.status === 'pending').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        invoices: filtered.slice(0, 10).map(i => ({
          number: i.invoiceNumber,
          clientName: i.clientId,
          amount: i.amount,
          status: i.status,
          dueDate: i.dueDate
        }))
      };
    }

    case "get_morning_briefing": {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const allLeads = await storage.getLeads();
      const recentLeads = allLeads.filter(l => new Date(l.createdAt!) >= yesterday);
      
      const hotLeads = allLeads.filter(l => l.score === 'hot').slice(0, 5);
      
      return {
        newLeadsCount: recentLeads.length,
        newLeads: recentLeads.map(l => ({ company: l.company, score: l.score })),
        topLeadsToCall: hotLeads.map(l => ({ company: l.company, lastContact: l.lastContactDate })),
        summary: "You have " + recentLeads.length + " new leads in the last 24 hours. " + hotLeads.length + " hot leads are waiting for follow-up."
      };
    }

    case "get_lead_history": {
      const allLeads = await storage.getLeads();
      const lead = allLeads.find(l => l.company.toLowerCase().includes(args.companyName.toLowerCase()));
      
      if (!lead) return { error: "Lead not found" };
      
      const activities = await storage.getLeadActivities(lead.id);
      return {
        company: lead.company,
        stage: lead.stage,
        activityCount: activities.length,
        recentActivities: activities.slice(0, 5).map(a => ({
          type: a.type,
          description: a.description,
          date: a.createdAt
        }))
      };
    }

    case "suggest_next_step": {
      const allLeads = await storage.getLeads();
      const lead = allLeads.find(l => l.company.toLowerCase().includes(args.companyName.toLowerCase()));
      
      if (!lead) return { error: "Lead not found" };
      
      const activities = await storage.getLeadActivities(lead.id);
      
      let suggestion = "";
      if (lead.stage === 'prospect') {
        suggestion = "Initialize first contact via email or LinkedIn.";
      } else if (lead.stage === 'contacted' && activities.length > 0) {
        suggestion = "Follow up on the last interaction. If no response, try a phone call.";
      } else if (lead.stage === 'qualified') {
        suggestion = "Schedule a discovery call or presentation.";
      } else {
        suggestion = "Review current relationship status and identify upsell opportunities.";
      }
      
      return {
        company: lead.company,
        currentStage: lead.stage,
        suggestedAction: suggestion
      };
    }

    default:
      return { error: "Unknown function" };
  }
}

/**
 * Generate marketing content using AI (OpenAI or Gemini)
 */
export async function generateMarketingContent(
  prompt: string,
  channel: string,
  audience?: string,
  context?: string,
  provider: "openai" | "gemini" = "openai"
): Promise<string> {
  const systemPrompt = `You are an expert marketing copywriter for a high-end marketing platform.
Generate high-converting content for the specified channel: ${channel.toUpperCase()}.

${audience ? `Target Audience: ${audience}` : ""}
${context ? `Additional Context: ${context}` : ""}

Rules:
1. Tone should be professional yet engaging.
2. For SMS/WhatsApp/Telegram: Keep it concise and include a clear call to action.
3. For Email: Include a compelling subject line at the top starting with "Subject: ".
4. Use emojis sparingly but effectively.
5. Focus on value and benefits.
6. Do not use placeholders like [Name] unless specifically asked; write ready-to-use copy.`;

  if (provider === "gemini") {
    if (!gemini || !process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error("Google Gemini API key not set");
    }
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } else {
    if (!openai || !process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not set");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content || "";
  }
}

/**
 * Analyze SMS sentiment and intent
 */
export async function analyzeSmsSentiment(text: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'not_interested' | 'question' | 'unsubscribed' | 'other';
  summary: string;
  suggestedReply: string;
}> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not set");
  }

  const systemPrompt = `Analyze the following incoming marketing SMS message.
Determine the sentiment, the specific intent, a brief 1-sentence summary, and a suggested professional reply.

Intents:
- interested: Showing clear interest or asking for more info to buy
- not_interested: Politely or firmly declining
- question: Asking a specific question about the service/product
- unsubscribed: Asking to stop, "STOP", "REMOVE", etc.
- other: Anything else

Respond ONLY with a JSON object in this format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "interested" | "not_interested" | "question" | "unsubscribed" | "other",
  "summary": "...",
  "suggestedReply": "..."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

/**
 * Parse natural language query into audience filters
 */
export async function parseAiGroupQuery(query: string): Promise<{
  filters: any;
  explanation: string;
}> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not set");
  }

  const systemPrompt = `You are a data assistant for a marketing platform.
Convert a natural language request into a set of filters for leads and clients.

Available fields in the database:
- industry (string)
- tags (string array)
- score (string: 'hot', 'warm', 'cold')
- stage (string: 'prospect', 'contacted', 'qualified', 'closed', 'lost')
- opt_in_email (boolean)
- opt_in_sms (boolean)
- city, state, country (string)

Respond ONLY with a JSON object:
{
  "filters": {
    "industry": string | null,
    "tags": string[] | null,
    "score": string | null,
    "stage": string | null,
    "opt_in_email": boolean | null,
    "opt_in_sms": boolean | null,
    "state": string | null
  },
  "explanation": "Briefly explain what criteria were found."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

/**
 * Generate a personalized hook for a lead
 */
export async function generatePersonalizedHook(
  leadName: string,
  companyName: string,
  notes: string,
  baseMessage: string
): Promise<string> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not set");
  }

  const systemPrompt = `You are a personalized marketing assistant.
Generate a short (1-2 sentence) personalized opening hook for a marketing message.
Use the lead's name, company, and any notes provided to make it feel authentic and non-automated.

Lead Name: ${leadName}
Company: ${companyName}
Context/Notes: ${notes}
Base Message Intent: ${baseMessage.slice(0, 100)}...

Rules:
1. Keep it very short (under 120 characters if possible).
2. Sound like a human who did their research.
3. Don't use overly corporate "I hope this finds you well" language.
4. Output ONLY the hook text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a hook for ${leadName} at ${companyName}.` }
    ],
    temperature: 0.8,
  });

  return response.choices[0].message.content || "";
}

export type AIChatStreamEvent =
  | { type: "delta"; content: string }
  | { type: "action"; actionTaken: string }
  | { type: "done"; success: boolean; functionsCalled?: string[] }
  | { type: "error"; error: string; errorDetails?: string };

/**
 * Process AI chat message with GPT-4
 */
export async function processAIChat(
  message: string, 
  userId: number,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{
  success: boolean;
  response: string;
  functionsCalled?: string[];
  error?: string;
}> {
  // Fallback if OpenAI not configured
  if (!openai || !process.env.OPENAI_API_KEY) {
    return {
      success: false,
      response: "AI features require OpenAI API key to be configured. Please contact your administrator.",
      error: "OpenAI API key not set"
    };
  }

  try {
    console.log('🤖 AI Chat Request:', message);

    const pending = pendingActionsByUserId.get(userId);
    if (pending && isConfirmMessage(message)) {
      pendingActionsByUserId.delete(userId);
      try {
        await executeFunction(pending.functionName, pending.args, userId);
        return {
          success: true,
          response: `✅ Done! ${describePendingAction(pending)}`,
          functionsCalled: [pending.functionName],
        };
      } catch (e: any) {
        return {
          success: false,
          response: `❌ I couldn't complete that action: ${e?.message || "Unknown error"}`,
          error: e?.message || "Unknown error",
        };
      }
    }

    // Build conversation messages
    const safeHistory = sanitizeConversationHistory(conversationHistory);
    const messages: any[] = [
      {
        role: "system",
        content: `You are an AI Business Manager assistant for a marketing platform. You're helpful, friendly, and conversational - like ChatGPT, but with the ability to take real actions!

You can help users:
- Manage their clients (list, create, search)
- Handle tasks (view, create, prioritize)
- Check their calendar and schedule
- Send messages to team members
- Review campaigns and invoices
- Answer questions naturally

Be warm, encouraging, and use emojis occasionally! 😊 When you take actions, confirm what you did. If you need more information, ask naturally.

IMPORTANT TOOL USAGE RULES:
- If you decide you need to call tools, respond ONLY with tool calls and DO NOT output any user-facing text in that message.
- For any write action (create_client, create_task, send_message), you MUST ask for confirmation first. After the user confirms by replying "confirm", then you may call the tool.

Current user ID: ${userId}`
      },
      ...safeHistory,
      { role: "user", content: message }
    ];

    // Call GPT-4 with function calling
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
    });

    const responseMessage = response.choices[0].message;
    const functionsCalled: string[] = [];

    // If GPT-4 wants to call functions
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Safe-mode: require confirmation for write actions
      const writeCall = (responseMessage.tool_calls as any[]).find((c: any) =>
        WRITE_FUNCTIONS.has(c?.function?.name)
      );
      if (writeCall) {
        try {
          const functionName = (writeCall as any).function.name;
          const functionArgs = JSON.parse((writeCall as any).function.arguments || "{}");
          const pendingAction: PendingAction = { functionName, args: functionArgs, createdAt: Date.now() };
          pendingActionsByUserId.set(userId, pendingAction);
          return {
            success: true,
            response: `I can do that. Please reply **confirm** to proceed:\n\n- ${describePendingAction(pendingAction)}`,
            functionsCalled: [functionName],
          };
        } catch (e: any) {
          return {
            success: false,
            response: `❌ I couldn't parse that action request: ${e?.message || "Unknown error"}`,
            error: e?.message || "Unknown error",
          };
        }
      }

      // Execute all requested functions
      const functionResults = [];
      
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = (toolCall as any).function.name;
        const functionArgs = JSON.parse((toolCall as any).function.arguments);
        
        functionsCalled.push(functionName);
        
        try {
          const result = await executeFunction(functionName, functionArgs, userId);
          functionResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(result),
          });
        } catch (error: any) {
          functionResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify({ error: error.message }),
          });
        }
      }

      // Get final response from GPT-4 with function results
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...messages,
          responseMessage,
          ...functionResults,
        ],
        temperature: 0.7,
      });

      return {
        success: true,
        response: finalResponse.choices[0].message.content || "Done! ✅",
        functionsCalled,
      };
    }

    // No functions needed, just return GPT-4's response
    return {
      success: true,
      response: responseMessage.content || "I'm here to help! What would you like to know? 😊",
    };

  } catch (error: any) {
    console.error('❌ AI Chat Error:', error);
    return {
      success: false,
      response: "Sorry, I had trouble processing that. Could you try again? 🤔",
      error: error.message,
    };
  }
}

/**
 * Streaming variant (NDJSON/SSE friendly): yields deltas and final metadata.
 */
export async function* processAIChatStream(
  message: string,
  userId: number,
  conversationHistory: Array<{ role: string; content: string }> = []
): AsyncGenerator<AIChatStreamEvent> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    yield {
      type: "error",
      error: "AI features require OpenAI API key to be configured.",
      errorDetails: "OpenAI API key not set",
    };
    return;
  }

  const pending = pendingActionsByUserId.get(userId);
  if (pending && isConfirmMessage(message)) {
    pendingActionsByUserId.delete(userId);
    try {
      await executeFunction(pending.functionName, pending.args, userId);
      yield { type: "delta", content: `✅ Done! ${describePendingAction(pending)}` };
      yield { type: "action", actionTaken: describePendingAction(pending) };
      yield { type: "done", success: true, functionsCalled: [pending.functionName] };
      return;
    } catch (e: any) {
      yield { type: "error", error: e?.message || "Failed to execute pending action" };
      return;
    }
  }

  const safeHistory = sanitizeConversationHistory(conversationHistory);
  const baseMessages: any[] = [
    {
      role: "system",
      content: `You are an AI Business Manager assistant for a marketing platform. You're helpful, friendly, and conversational - like ChatGPT, but with the ability to take real actions!

IMPORTANT TOOL USAGE RULES:
- If you decide you need to call tools, respond ONLY with tool calls and DO NOT output any user-facing text in that message.
- For any write action (create_client, create_task, send_message), you MUST ask for confirmation first. After the user confirms by replying "confirm", then you may call the tool.

Current user ID: ${userId}`,
    },
    ...safeHistory,
    { role: "user", content: message },
  ];

  const functionsCalled: string[] = [];
  let collectedContent = "";
  const toolCallsByIndex = new Map<
    number,
    { id?: string; name?: string; args: string }
  >();

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: baseMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream as any) {
      const delta = chunk?.choices?.[0]?.delta;
      const contentDelta = delta?.content;
      if (typeof contentDelta === "string" && contentDelta.length > 0) {
        collectedContent += contentDelta;
        yield { type: "delta", content: contentDelta };
      }

      const toolDeltas = delta?.tool_calls;
      if (Array.isArray(toolDeltas)) {
        for (const td of toolDeltas) {
          const idx = td.index;
          const existing = toolCallsByIndex.get(idx) || { args: "" };
          toolCallsByIndex.set(idx, {
            id: td.id ?? existing.id,
            name: td.function?.name ?? existing.name,
            args: (existing.args || "") + (td.function?.arguments || ""),
          });
        }
      }
    }

    // If tools were requested, execute them and stream the final answer
    if (toolCallsByIndex.size > 0) {
      const toolCalls = Array.from(toolCallsByIndex.entries())
        .sort(([a], [b]) => a - b)
        .map(([, v]) => ({
          id: v.id || `${Date.now()}`,
          type: "function" as const,
          function: {
            name: v.name || "unknown",
            arguments: v.args || "{}",
          },
        }));

      // Safe-mode confirmation for write tools
      const firstWrite = toolCalls.find((c) => WRITE_FUNCTIONS.has(c.function.name));
      if (firstWrite) {
        const functionName = firstWrite.function.name;
        const functionArgs = JSON.parse(firstWrite.function.arguments || "{}");
        const pendingAction: PendingAction = { functionName, args: functionArgs, createdAt: Date.now() };
        pendingActionsByUserId.set(userId, pendingAction);
        yield {
          type: "delta",
          content: `I can do that. Please reply **confirm** to proceed:\n\n- ${describePendingAction(pendingAction)}`,
        };
        yield { type: "done", success: true, functionsCalled: [functionName] };
        return;
      }

      const toolResults: any[] = [];
      for (const tc of toolCalls) {
        const fn = tc.function.name;
        functionsCalled.push(fn);
        let args: any = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          args = {};
        }
        try {
          const result = await executeFunction(fn, args, userId);
          toolResults.push({
            tool_call_id: tc.id,
            role: "tool",
            name: fn,
            content: JSON.stringify(result),
          });
        } catch (e: any) {
          toolResults.push({
            tool_call_id: tc.id,
            role: "tool",
            name: fn,
            content: JSON.stringify({ error: e?.message || "Tool execution failed" }),
          });
        }
      }

      const finalMessages: any[] = [
        ...baseMessages,
        {
          role: "assistant",
          content: collectedContent || null,
          tool_calls: toolCalls,
        },
        ...toolResults,
      ];

      const finalStream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: finalMessages,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of finalStream as any) {
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          yield { type: "delta", content: delta };
        }
      }

      yield { type: "done", success: true, functionsCalled };
      return;
    }

    // No tools, streamed content already
    yield { type: "done", success: true };
  } catch (e: any) {
    yield { type: "error", error: e?.message || "AI streaming failed" };
  }
}

