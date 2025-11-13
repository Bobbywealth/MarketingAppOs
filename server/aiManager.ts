import OpenAI from 'openai';
import { storage } from './storage';

/**
 * GPT-4 Powered AI Business Manager
 * Natural conversation + Real actions
 */

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const newTask = await storage.createTask({
        title: args.title,
        description: null,
        status: 'pending',
        priority: args.priority || 'medium',
        assignedTo: String(userId),
        createdBy: String(userId),
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        senderId: userId,
        recipientId: recipient.id,
        content: args.message,
        createdAt: new Date(),
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
          amount: i.totalAmount,
          status: i.status,
          dueDate: i.dueDate
        }))
      };
    }

    default:
      return { error: "Unknown function" };
  }
}

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

    // Build conversation messages
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

Current user ID: ${userId}`
      },
      ...conversationHistory,
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
      // Execute all requested functions
      const functionResults = [];
      
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
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

