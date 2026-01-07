import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import fs from "fs";
import path from "path";
import { CircuitBreaker } from './lib/circuit-breaker';
import { log } from './vite';

// Email circuit breaker: trip after 3 failures, reset after 1 minute
const emailCircuit = new CircuitBreaker(3, 60000);

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
  const appUrlRaw = process.env.APP_URL || 'https://www.marketingteam.app';
  const appUrl = appUrlRaw.replace(/\/+$/, "");

  // Prefer a hard override, otherwise prefer an embedded CID logo (best for Outlook),
  // and finally fall back to a public URL if we can't find a logo file on disk.
  const overriddenLogoUrl = process.env.EMAIL_LOGO_URL?.trim();
  const cidLogoSrc = "cid:marketingteam-logo";
  const publicLogoUrl = `${appUrl}/logo.png`;
  const logoSrc = overriddenLogoUrl || (resolveEmailLogoPath() ? cidLogoSrc : publicLogoUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .header { background: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f1f5f9; }
        /* Email clients (especially iOS Gmail/Mail) can ignore some CSS, so we also inline critical sizing on the <img>. */
        .header img { display: block; margin: 0 auto 20px; max-width: 220px; width: 220px; height: auto; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; color: #0f172a; }
        .content { padding: 40px 40px; background-color: #ffffff; }
        .footer { text-align: center; padding: 40px; background-color: #f8fafc; color: #64748b; font-size: 14px; border-top: 1px solid #f1f5f9; }
        .footer-logo { display: block; margin: 0 auto 16px; max-width: 160px; width: 160px; height: auto; filter: grayscale(1); opacity: 0.5; }
        .button { display: inline-block; background-color: ${themeColor}; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .info-value { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        hr { border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0; }
        .text-gradient { background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <img
              src="${logoSrc}"
              alt="Marketing Team App Logo"
              width="220"
              style="display:block; margin:0 auto 20px; max-width:220px; width:220px; height:auto;"
            >
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <img
              src="${logoSrc}"
              alt="Marketing Team App Logo"
              class="footer-logo"
              width="160"
              style="display:block; margin:0 auto 16px; max-width:160px; width:160px; height:auto; filter:grayscale(1); opacity:0.5;"
            >
            <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} Marketing Team. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function resolveEmailLogoPath(): string | null {
  // Candidates for dev + production. In production, the server code runs from `dist/`
  // and assets are served from `dist/public/`.
  const candidates = [
    path.resolve(import.meta.dirname, "public", "logo.png"),
    path.resolve(import.meta.dirname, "..", "dist", "public", "logo.png"),
    path.resolve(import.meta.dirname, "..", "client", "public", "logo.png"),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

function maybeGetLogoAttachment():
  | { filename: string; path: string; cid: string; contentDisposition: "inline" }
  | null {
  // If a hard URL is configured, don't attach anything.
  if (process.env.EMAIL_LOGO_URL?.trim()) return null;

  const logoPath = resolveEmailLogoPath();
  if (!logoPath) return null;

  return {
    filename: "logo.png",
    path: logoPath,
    cid: "marketingteam-logo",
    contentDisposition: "inline",
  };
}

// Email template functions
export const emailTemplates = {
  // ... rest of the code ...
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

  // Email verification template
  verifyEmail: (userName: string, verifyUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">Hi ${userName}! 👋</h2>
      <p>Thank you for using the <strong>Marketing Team App</strong>. To ensure the security of your account and that you receive important updates, please verify your email address.</p>
      
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="button" style="background-color: #1a1a1a;">Verify Your Email Address →</a>
      </div>
      
      <div class="card">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Once verified, you'll have full access to your CRM dashboard and will receive all system notifications directly in your main inbox.
      </p>
    `;
    return {
      subject: '📧 Verify Your Email Address - Marketing Team App',
      html: renderEmail('Email Verification', content, '#1a1a1a')
    };
  },

  // Enrollment invitation for new clients
  enrollmentInvitation: (clientName: string, packageName: string, checkoutUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">Welcome, ${clientName}! 👋</h2>
      <p>We're excited to have you on board. To get started with your <strong>${packageName}</strong>, please complete your enrollment and set up your payment method.</p>
      
      <div class="card">
        <div class="info-label">SELECTED PACKAGE</div>
        <div class="info-value">${packageName}</div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Securely add your card on file to activate your services and start your journey with us.</p>
      </div>

      <div style="text-align: center;">
        <a href="${checkoutUrl}" class="button" style="background-color: #3b82f6;">Finish Enrollment & Pay →</a>
      </div>
      
      <hr>
      <p style="font-size: 14px; color: #6b7280;">If you have any questions about the package or the enrollment process, please don't hesitate to reach out.</p>
    `;
    return {
      subject: `🚀 Finish your enrollment for ${packageName}`,
      html: renderEmail('Complete Your Enrollment', content, '#3b82f6')
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
      subject: `👤 New team member: ${newUserName}`,
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
      subject: `🎯 New client: ${clientName}`,
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
    const dueLabel = new Date(dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    
    const content = `
      <h2 style="margin-top: 0;">Hi ${assigneeName},</h2>
      <p>This is a reminder about an upcoming task deadline.</p>
      
      <div class="card" style="border-top: 4px solid ${themeColor}; text-align: center;">
        <div class="badge" style="background-color: ${isOverdue ? '#fee2e2' : '#ffedd5'}; color: ${isOverdue ? '#991b1b' : '#9a3412'};">
          ${isOverdue ? '🚨 OVERDUE' : '⚠️ DUE SOON'}
        </div>
        <h3 style="margin: 12px 0 8px 0; font-size: 20px;">${taskTitle}</h3>
        <p style="font-size: 16px; font-weight: 700; color: ${themeColor}; margin-bottom: 8px;">
          Due ${dueLabel}
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
      subject: `${isOverdue ? '🚨 Overdue' : '⏰ Due soon'}: ${taskTitle} (due ${dueLabel})`,
      html: renderEmail('Task Deadline Alert', content, themeColor)
    };
  },

  // Task completed notification
  taskCompleted: (actorName: string, taskTitle: string, taskUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">Task Completed ✅</h2>
      <p><strong>${actorName}</strong> has marked a task as completed.</p>
      
      <div class="card" style="border-left: 4px solid #10b981;">
        <h3 style="margin: 0; font-size: 18px;">${taskTitle}</h3>
      </div>
      
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background-color: #10b981;">View Task Details →</a>
      </div>
    `;
    return {
      subject: `✅ ${actorName} completed: ${taskTitle}`,
      html: renderEmail('Task Completed', content, '#10b981')
    };
  },

  // Task comment notification
  taskCommented: (commenterName: string, taskTitle: string, comment: string, taskUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">New Comment 💬</h2>
      <p><strong>${commenterName}</strong> commented on <strong>${taskTitle}</strong>:</p>
      
      <div class="card" style="font-style: italic; color: #4b5563;">
        "${comment.length > 200 ? comment.substring(0, 200) + '...' : comment}"
      </div>
      
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button">Reply to Comment →</a>
      </div>
    `;
    return {
      subject: `💬 ${commenterName} commented: ${taskTitle}`,
      html: renderEmail('New Task Comment', content, '#3b82f6')
    };
  },

  // Announcement notification
  announcement: (title: string, message: string, actionUrl?: string) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const content = `
      <h2 style="margin-top: 0;">📣 Team Announcement</h2>
      <h3 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">${title}</h3>
      
      <div class="card" style="background-color: #f0fdfa; border: 1px solid #ccfbf1;">
        <p style="white-space: pre-wrap; margin: 0;">${message}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${appUrl}${actionUrl || '/dashboard'}" class="button" style="background-color: #0d9488;">View in Dashboard →</a>
      </div>
    `;
    return {
      subject: `📣 Announcement: ${title}`,
      html: renderEmail('New Announcement', content, '#0d9488')
    };
  },

  // Security alert notification
  securityAlert: (title: string, message: string) => {
    const content = `
      <h2 style="margin-top: 0; color: #dc2626;">🚨 Security Alert</h2>
      <p>A security-related event was detected in your account.</p>
      
      <div class="card" style="border: 1px solid #fee2e2; background-color: #fef2f2;">
        <h3 style="margin-top: 0; font-size: 16px; color: #991b1b;">${title}</h3>
        <p style="margin-bottom: 0; color: #b91c1c;">${message}</p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        If you did not expect this, please review your account security settings immediately.
      </p>
    `;
    return {
      subject: `🚨 Security Alert: ${title}`,
      html: renderEmail('Security Alert', content, '#dc2626')
    };
  },

  // Password reset notification
  passwordReset: (resetUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">🔐 Password Reset Request</h2>
      <p>We received a request to reset your password for the Marketing Team App.</p>
      
      <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" style="background-color: #1a1a1a;">Reset Your Password →</a>
      </div>
      
      <div class="card">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `;
    return {
      subject: '🔐 Password Reset Request',
      html: renderEmail('Password Reset', content, '#1a1a1a')
    };
  },

  // Lead assigned to an agent
  leadAssigned: (agentName: string, leadName: string, leadCompany: string, leadUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">Hi ${agentName}! 👋</h2>
      <p>A new lead has been assigned to you.</p>
      
      <div class="card">
        <div class="badge" style="background-color: #dbeafe; color: #1e40af;">NEW ASSIGNMENT</div>
        <div class="info-label">LEAD NAME</div>
        <div class="info-value">${leadName || 'Not Provided'}</div>
        
        <div class="info-label">COMPANY</div>
        <div class="info-value">${leadCompany}</div>
      </div>
      
      <div style="text-align: center;">
        <a href="${leadUrl}" class="button" style="background-color: #3b82f6;">View Lead Details →</a>
      </div>
    `;
    const leadLabel = leadName ? `${leadCompany} (${leadName})` : leadCompany;
    return {
      subject: `🎯 Lead assigned to you: ${leadLabel}`,
      html: renderEmail('Lead Assignment', content, '#3b82f6')
    };
  },

  // Lead stage changed
  leadStageChanged: (userName: string, leadCompany: string, oldStage: string, newStage: string, leadUrl: string) => {
    const oldStageLabel = oldStage.replaceAll('_', ' ');
    const newStageLabel = newStage.replaceAll('_', ' ');
    const content = `
      <h2 style="margin-top: 0;">Hi ${userName},</h2>
      <p>A lead's stage has been updated.</p>
      
      <div class="card">
        <div class="info-label">LEAD</div>
        <div class="info-value">${leadCompany}</div>
        
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="flex: 1;">
            <div class="info-label">OLD STAGE</div>
            <div class="info-value" style="text-transform: capitalize; color: #64748b;">${oldStageLabel}</div>
          </div>
          <div style="font-size: 20px; color: #94a3b8;">→</div>
          <div style="flex: 1;">
            <div class="info-label">NEW STAGE</div>
            <div class="info-value" style="text-transform: capitalize; color: #10b981;">${newStageLabel}</div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${leadUrl}" class="button" style="background-color: #10b981;">Review Lead Pipeline →</a>
      </div>
    `;
    return {
      subject: `📈 ${leadCompany}: ${oldStageLabel} → ${newStageLabel}`,
      html: renderEmail('Lead Stage Update', content, '#10b981')
    };
  },

  // Lead converted to client
  leadConverted: (userName: string, leadCompany: string, clientUrl: string) => {
    const content = `
      <h2 style="margin-top: 0;">Success! 🎉</h2>
      <p>A lead has been successfully converted into a client.</p>
      
      <div class="card" style="border: 1px solid #dcfce7; background-color: #f0fdf4;">
        <div class="badge" style="background-color: #10b981; color: white;">CLOSED WON</div>
        <div class="info-label">NEW CLIENT</div>
        <div class="info-value" style="font-size: 24px;">${leadCompany}</div>
      </div>
      
      <p>Onboarding tasks have been auto-generated and the sales commission has been recorded.</p>
      
      <div style="text-align: center;">
        <a href="${clientUrl}" class="button" style="background-color: #10b981;">View Client Dashboard →</a>
      </div>
    `;
    return {
      subject: `🎊 Converted to client: ${leadCompany}`,
      html: renderEmail('Lead Successfully Converted', content, '#10b981')
    };
  },

  // Creator Approval notification
  creatorApproved: (creatorName: string, creatorEmail: string) => {
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const content = `
      <h2 style="margin-top: 0;">Congratulations, ${creatorName}! 🎉</h2>
      <p>We're thrilled to inform you that your application to the <strong>Marketing Team Creator Network</strong> has been approved!</p>
      
      <p>You now have full access to your creator back office where you can view assignments, update your profile, and manage your content visits.</p>
      
      <div class="card">
        <div class="info-label">YOUR LOGIN EMAIL</div>
        <div class="info-value">${creatorEmail}</div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Use the password you created during signup to log in.</p>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/auth" class="button" style="background-color: #3b82f6;">Log In to Creator Back Office →</a>
      </div>
      
      <hr>
      <p style="font-size: 14px; color: #6b7280;">Welcome to the team! We can't wait to see the incredible content you'll create.</p>
    `;
    return {
      subject: `🎉 Creator application approved: ${creatorName}`,
      html: renderEmail('Application Approved', content, '#3b82f6')
    };
  },

  // Creator Decline notification
  creatorDeclined: (creatorName: string) => {
    const content = `
      <h2 style="margin-top: 0;">Hi ${creatorName},</h2>
      <p>Thank you for your interest in joining the <strong>Marketing Team Creator Network</strong>.</p>
      
      <p>After carefully reviewing your application and current network needs, we are unable to move forward with your application at this time.</p>
      
      <p>We appreciate the time you took to apply and wish you the very best in your content creation journey. Feel free to re-apply in 6 months if your portfolio has significant updates.</p>
      
      <hr>
      <p style="font-size: 14px; color: #6b7280;">Thank you again for your interest.</p>
    `;
    return {
      subject: `Update on your creator application: ${creatorName}`,
      html: renderEmail('Application Update', content, '#64748b')
    };
  },

  // General action alert (for admins)
  actionAlert: (title: string, message: string, actionUrl: string, type: string = 'info') => {
    let themeColor = '#1a1a1a';
    if (type === 'success') themeColor = '#10b981';
    if (type === 'warning') themeColor = '#f59e0b';
    if (type === 'error') themeColor = '#ef4444';

    const content = `
      <h2 style="margin-top: 0;">Action Required / Update</h2>
      <p>${message}</p>
      
      <div style="text-align: center;">
        <a href="${actionUrl}" class="button" style="background-color: ${themeColor};">Review Details →</a>
      </div>
    `;
    return {
      subject: `${title}`,
      html: renderEmail(title, content, themeColor)
    };
  },
};

// Marketing Email Template
export const marketingTemplates = {
  broadcast: (subject: string, content: string) => {
    return {
      subject,
      html: renderEmail(subject, content, '#1a1a1a')
    };
  }
};

// Send email function
export async function sendEmail(to: string | string[], subject: string, html: string, options?: { from?: string, fromName?: string }) {
  if (!transporter) {
    console.warn('⚠️  Email not sent - service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const fromEmail = options?.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'business@marketingteam.app';
    const fromName = options?.fromName || process.env.SMTP_FROM_NAME || 'Marketing Team';
    const logoAttachment = maybeGetLogoAttachment();
    
    const info = await emailCircuit.execute(() => 
      transporter!.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        ...(process.env.SMTP_REPLY_TO ? { replyTo: process.env.SMTP_REPLY_TO } : { replyTo: fromEmail }),
        ...(logoAttachment ? { attachments: [logoAttachment] } : {}),
      })
    );

    log(`✅ Email sent: ${info.messageId}`, "email");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    log(`❌ Email send error: ${error instanceof Error ? error.message : 'Unknown error'}`, "email");
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

  async sendTaskCompletedEmail(toEmail: string, actorName: string, taskTitle: string, taskUrl: string) {
    const { subject, html } = emailTemplates.taskCompleted(actorName, taskTitle, taskUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendTaskCommentEmail(toEmail: string, commenterName: string, taskTitle: string, comment: string, taskUrl: string) {
    const { subject, html } = emailTemplates.taskCommented(commenterName, taskTitle, comment, taskUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendAnnouncementEmail(toEmail: string | string[], title: string, message: string, actionUrl?: string) {
    const { subject, html } = emailTemplates.announcement(title, message, actionUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendSecurityAlertEmail(toEmail: string | string[], title: string, message: string) {
    const { subject, html } = emailTemplates.securityAlert(title, message);
    return sendEmail(toEmail, subject, html);
  },

  async sendActionAlertEmail(toEmail: string | string[], title: string, message: string, actionUrl: string, type: string = 'info') {
    const { subject, html } = emailTemplates.actionAlert(title, message, actionUrl, type);
    return sendEmail(toEmail, subject, html);
  },

  async sendPasswordResetEmail(toEmail: string, resetUrl: string) {
    const { subject, html } = emailTemplates.passwordReset(resetUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendVerificationEmail(userName: string, toEmail: string, verifyUrl: string) {
    const { subject, html } = emailTemplates.verifyEmail(userName, verifyUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendEnrollmentInvitation(toEmail: string, clientName: string, packageName: string, checkoutUrl: string) {
    const { subject, html } = emailTemplates.enrollmentInvitation(clientName, packageName, checkoutUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendLeadAssignedEmail(toEmail: string, agentName: string, leadName: string, leadCompany: string, leadUrl: string) {
    const { subject, html } = emailTemplates.leadAssigned(agentName, leadName, leadCompany, leadUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendLeadStageChangedEmail(toEmail: string, userName: string, leadCompany: string, oldStage: string, newStage: string, leadUrl: string) {
    const { subject, html } = emailTemplates.leadStageChanged(userName, leadCompany, oldStage, newStage, leadUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendLeadConvertedEmail(toEmail: string, userName: string, leadCompany: string, clientUrl: string) {
    const { subject, html } = emailTemplates.leadConverted(userName, leadCompany, clientUrl);
    return sendEmail(toEmail, subject, html);
  },

  async sendCreatorApprovedEmail(toEmail: string, creatorName: string) {
    const { subject, html } = emailTemplates.creatorApproved(creatorName, toEmail);
    return sendEmail(toEmail, subject, html);
  },

  async sendCreatorDeclinedEmail(toEmail: string, creatorName: string) {
    const { subject, html } = emailTemplates.creatorDeclined(creatorName);
    return sendEmail(toEmail, subject, html);
  },
};
