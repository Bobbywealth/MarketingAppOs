import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email transporter configuration
let transporter: Transporter | null = null;

export function initializeEmailService() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(process.env.SMTP_TLS_REJECT_UNAUTHORIZED
      ? { tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' } }
      : {}),
  });

  console.log('✅ Email service initialized');
  return transporter;
}

// Premium Email Wrapper
function renderEmail(title: string, content: string, themeColor: string = '#3b82f6') {
  const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
  const logoUrl = `${appUrl}/logo.png`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, ${themeColor} 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; }
        .footer img { height: 32px; margin-bottom: 16px; opacity: 0.8; }
        .button { display: inline-block; background-color: ${themeColor}; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s; }
        .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
        .info-label { color: #6b7280; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
        .info-value { color: #111827; font-size: 15px; font-weight: 600; margin-bottom: 16px; }
        hr { border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <img src="${logoUrl}" alt="Marketing Team App">
            <p>© ${new Date().getFullYear()} Marketing Team App. All rights reserved.</p>
            <p>123 Marketing Way, Creative Suite 100</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template functions
export const emailTemplates = {
  // Welcome email for new users
  welcomeUser: (userName: string, userEmail: string) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const content = `
      <h2 style="margin-top: 0;">Hi ${userName}! 👋</h2>
      <p>Welcome to the <strong>Marketing Team App</strong>. We're thrilled to have you join our premium marketing ecosystem.</p>
      
      <p>Your account is ready. You now have access to enterprise-grade tools to manage clients, campaigns, and content with precision.</p>
      
      <div class="card">
        <div class="info-label">YOUR LOGIN EMAIL</div>
        <div class="info-value">${userEmail}</div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Use this email to access your personalized dashboard.</p>
      </div>

      <h3>✨ Premium Features Await:</h3>
      <ul style="padding-left: 20px; color: #4b5563;">
        <li style="margin-bottom: 8px;"><strong>Advanced CRM:</strong> Manage client relationships with depth and clarity.</li>
        <li style="margin-bottom: 8px;"><strong>Task Intelligence:</strong> Stay ahead of deadlines with smart reminders.</li>
        <li style="margin-bottom: 8px;"><strong>Campaign Analytics:</strong> Monitor performance with high-fidelity charts.</li>
        <li style="margin-bottom: 8px;"><strong>Team Collaboration:</strong> Seamlessly work with your creative specialists.</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${appUrl}/auth" class="button">Access Your Dashboard →</a>
      </div>
      
      <hr>
      <p style="font-size: 14px; color: #6b7280;">If you have any questions, our support team is just a reply away.</p>
    `;
    return {
      subject: '🎉 Welcome to the Marketing Team App!',
      html: renderEmail('Welcome to the Team', content, '#3b82f6')
    };
  },

  // Alert admin about new user signup
  newUserAlert: (adminName: string, newUserName: string, newUserEmail: string, newUserRole: string) => {
    const content = `
      <h2 style="margin-top: 0;">Hi ${adminName},</h2>
      <p>A new member has just joined your team on the Marketing Team App.</p>
      
      <div class="card">
        <div class="badge" style="background-color: #dbeafe; color: #1e40af;">NEW MEMBER</div>
        <div style="display: flex; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <div class="info-label">FULL NAME</div>
            <div class="info-value">${newUserName}</div>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <div class="info-label">ROLE ASSIGNED</div>
            <div class="info-value" style="text-transform: capitalize;">${newUserRole}</div>
          </div>
        </div>
        <div class="info-label">EMAIL ADDRESS</div>
        <div class="info-value">${newUserEmail}</div>
      </div>
      
      <p>They have been sent a premium welcome pack and are ready to be integrated into your workflows.</p>
    `;
    return {
      subject: '👤 New Team Member Added',
      html: renderEmail('New Team Member', content, '#8b5cf6')
    };
  },

  // New client created alert
  newClientAlert: (adminName: string, clientName: string, clientCompany: string, clientEmail: string) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const content = `
      <h2 style="margin-top: 0;">Hi ${adminName},</h2>
      <p>Success! A new client has been successfully added to your CRM pipeline.</p>
      
      <div class="card">
        <div class="badge" style="background-color: #d1fae5; color: #065f46;">NEW CLIENT</div>
        <div class="info-label">CLIENT NAME</div>
        <div class="info-value">${clientName}</div>
        
        <div class="info-label">COMPANY</div>
        <div class="info-value">${clientCompany || 'Not Provided'}</div>
        
        <div class="info-label">EMAIL</div>
        <div class="info-value">${clientEmail || 'Not Provided'}</div>
      </div>
      
      <div style="text-align: center;">
        <a href="${appUrl}/clients" class="button" style="background-color: #10b981;">Review Client Profile →</a>
      </div>
    `;
    return {
      subject: '🎯 New Client Added',
      html: renderEmail('New Client Onboarded', content, '#10b981')
    };
  },

  // Task created/assigned notification
  taskAssigned: (assigneeName: string, assigneeEmail: string, taskTitle: string, taskDescription: string, priority: string, dueDate: string | null, assignedBy: string) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    let priorityColor = '#6b7280';
    let priorityBg = '#f3f4f6';
    
    if (priority === 'urgent') { priorityColor = '#991b1b'; priorityBg = '#fee2e2'; }
    else if (priority === 'high') { priorityColor = '#9a3412'; priorityBg = '#ffedd5'; }
    else if (priority === 'normal') { priorityColor = '#1e40af'; priorityBg = '#dbeafe'; }

    const content = `
      <h2 style="margin-top: 0;">Hi ${assigneeName}! 👋</h2>
      <p>You have been assigned a new task by <strong>${assignedBy}</strong>.</p>
      
      <div class="card" style="border-left: 4px solid ${priorityColor};">
        <div class="badge" style="background-color: ${priorityBg}; color: ${priorityColor};">${priority} priority</div>
        <h3 style="margin: 8px 0; font-size: 18px;">${taskTitle}</h3>
        <p style="color: #4b5563; font-size: 14px;">${taskDescription || 'No description provided'}</p>
        
        <hr style="margin: 15px 0;">
        
        <div style="display: flex; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <div class="info-label">DUE DATE</div>
            <div class="info-value">${dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}</div>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <div class="info-label">ASSIGNED BY</div>
            <div class="info-value">${assignedBy}</div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${appUrl}/tasks" class="button" style="background-color: #f59e0b;">View Task Details →</a>
      </div>
    `;
    return {
      subject: `📋 New Task Assigned: ${taskTitle}`,
      html: renderEmail('New Task Assigned', content, '#f59e0b')
    };
  },

  // Task due date reminder
  taskDueReminder: (assigneeName: string, assigneeEmail: string, taskTitle: string, dueDate: string, hoursUntilDue: number) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const isOverdue = hoursUntilDue <= 0;
    const themeColor = isOverdue ? '#ef4444' : '#f59e0b';
    
    const content = `
      <h2 style="margin-top: 0;">Hi ${assigneeName},</h2>
      <p>This is a reminder about an upcoming task deadline.</p>
      
      <div class="card" style="border-top: 4px solid ${themeColor}; text-align: center;">
        <div class="badge" style="background-color: ${isOverdue ? '#fee2e2' : '#ffedd5'}; color: ${isOverdue ? '#991b1b' : '#9a3412'};">
          ${isOverdue ? '🚨 OVERDUE' : '⚠️ DUE SOON'}
        </div>
        <h3 style="margin: 12px 0 8px 0; font-size: 20px;">${taskTitle}</h3>
        <p style="font-size: 16px; font-weight: 700; color: ${themeColor}; margin-bottom: 8px;">
          Due ${new Date(dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          ${isOverdue ? 'This task required attention ' + Math.abs(Math.round(hoursUntilDue)) + ' hours ago.' : 'This task is due in approximately ' + Math.round(hoursUntilDue) + ' hours.'}
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${appUrl}/tasks" class="button" style="background-color: ${themeColor};">Take Action Now →</a>
      </div>
    `;
    return {
      subject: `⏰ Task Due ${isOverdue ? 'Overdue' : 'Soon'}: ${taskTitle}`,
      html: renderEmail('Task Deadline Alert', content, themeColor)
    };
  },
};

// Send email function
export async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!transporter) {
    console.warn('⚠️  Email not sent - service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Marketing Team App'}" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      ...(process.env.SMTP_REPLY_TO ? { replyTo: process.env.SMTP_REPLY_TO } : {}),
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper functions for sending specific emails
export const emailNotifications = {
  async sendWelcomeEmail(userName: string, userEmail: string) {
    const { subject, html } = emailTemplates.welcomeUser(userName, userEmail);
    return sendEmail(userEmail, subject, html);
  },

  async sendNewUserAlertToAdmins(adminEmails: string[], newUserName: string, newUserEmail: string, newUserRole: string) {
    const { subject, html } = emailTemplates.newUserAlert('Admin', newUserName, newUserEmail, newUserRole);
    return sendEmail(adminEmails, subject, html);
  },

  async sendNewClientAlert(adminEmails: string[], clientName: string, clientCompany: string, clientEmail: string) {
    const { subject, html } = emailTemplates.newClientAlert('Admin', clientName, clientCompany, clientEmail);
    return sendEmail(adminEmails, subject, html);
  },

  async sendTaskAssignedEmail(assigneeName: string, assigneeEmail: string, taskTitle: string, taskDescription: string, priority: string, dueDate: string | null, assignedBy: string) {
    const { subject, html } = emailTemplates.taskAssigned(assigneeName, assigneeEmail, taskTitle, taskDescription, priority, dueDate, assignedBy);
    return sendEmail(assigneeEmail, subject, html);
  },

  async sendTaskDueReminder(assigneeName: string, assigneeEmail: string, taskTitle: string, dueDate: string) {
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const { subject, html } = emailTemplates.taskDueReminder(assigneeName, assigneeEmail, taskTitle, dueDate, hoursUntilDue);
    return sendEmail(assigneeEmail, subject, html);
  },
};
