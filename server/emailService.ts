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

// Email template functions
export const emailTemplates = {
  // Welcome email for new users
  welcomeUser: (userName: string, userEmail: string) => ({
    subject: '🎉 Welcome to Marketing Team App!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Marketing Team App!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Your account has been successfully created. You now have access to our powerful marketing and CRM platform.</p>
              
              <h3>✨ What you can do:</h3>
              <ul>
                <li>📊 Manage clients and campaigns</li>
                <li>📋 Track tasks and deadlines</li>
                <li>📅 Schedule content across platforms</li>
                <li>💬 Collaborate with your team</li>
                <li>📈 Monitor analytics and performance</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || 'https://www.marketingteam.app'}/auth" class="button">
                  Get Started →
                </a>
              </p>
              
              <p><strong>Your Login Email:</strong> ${userEmail}</p>
              <p>If you have any questions, feel free to reach out to your team admin.</p>
            </div>
            <div class="footer">
              <p>© 2025 Marketing Team App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Alert admin about new user signup
  newUserAlert: (adminName: string, newUserName: string, newUserEmail: string, newUserRole: string) => ({
    subject: '👤 New Team Member Added',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👤 New Team Member</h1>
            </div>
            <div class="content">
              <h2>Hi ${adminName},</h2>
              <p>A new team member has been added to your Marketing Team App.</p>
              
              <div class="info-box">
                <p><strong>👤 Name:</strong> ${newUserName}</p>
                <p><strong>📧 Email:</strong> ${newUserEmail}</p>
                <p><strong>🎭 Role:</strong> ${newUserRole}</p>
                <p><strong>🕐 Added:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>The new team member has been sent a welcome email with their login credentials.</p>
            </div>
            <div class="footer">
              <p>© 2025 Marketing Team App</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // New client created alert
  newClientAlert: (adminName: string, clientName: string, clientCompany: string, clientEmail: string) => ({
    subject: '🎯 New Client Added',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Client Added!</h1>
            </div>
            <div class="content">
              <h2>Hi ${adminName},</h2>
              <p>Great news! A new client has been added to your CRM.</p>
              
              <div class="info-box">
                <p><strong>👤 Client:</strong> ${clientName}</p>
                <p><strong>🏢 Company:</strong> ${clientCompany || 'N/A'}</p>
                <p><strong>📧 Email:</strong> ${clientEmail || 'N/A'}</p>
                <p><strong>🕐 Added:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || 'https://www.marketingteam.app'}/clients" class="button">
                  View Client →
                </a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Marketing Team App</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Task created/assigned notification
  taskAssigned: (assigneeName: string, assigneeEmail: string, taskTitle: string, taskDescription: string, priority: string, dueDate: string | null, assignedBy: string) => ({
    subject: `📋 New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .task-box { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .priority-urgent { background: #ef4444; color: white; }
            .priority-high { background: #f97316; color: white; }
            .priority-normal { background: #3b82f6; color: white; }
            .priority-low { background: #6b7280; color: white; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assigned</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}! 👋</h2>
              <p>You've been assigned a new task by <strong>${assignedBy}</strong>.</p>
              
              <div class="task-box">
                <h3>${taskTitle}</h3>
                <p><span class="priority priority-${priority}">${priority.toUpperCase()}</span></p>
                <p><strong>Description:</strong><br>${taskDescription || 'No description provided'}</p>
                ${dueDate ? `<p><strong>⏰ Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                <p><strong>📅 Assigned:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || 'https://www.marketingteam.app'}/tasks" class="button">
                  View Task →
                </a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Marketing Team App</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Task due date reminder
  taskDueReminder: (assigneeName: string, assigneeEmail: string, taskTitle: string, dueDate: string, hoursUntilDue: number) => ({
    subject: `⏰ Task Due ${hoursUntilDue <= 24 ? 'Soon' : 'Reminder'}: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Task Due Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName},</h2>
              <p>This is a friendly reminder about an upcoming task deadline.</p>
              
              <div class="alert-box">
                <h3>📋 ${taskTitle}</h3>
                <p style="font-size: 18px; margin: 15px 0;">
                  <strong>Due: ${new Date(dueDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong>
                </p>
                <p style="color: #ef4444; font-weight: bold;">
                  ${hoursUntilDue <= 0 ? '🚨 OVERDUE!' : hoursUntilDue <= 24 ? `⚠️ Due in ${Math.round(hoursUntilDue)} hours` : `Due in ${Math.round(hoursUntilDue / 24)} days`}
                </p>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || 'https://www.marketingteam.app'}/tasks" class="button">
                  View Task →
                </a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Marketing Team App</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
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

