import { storage } from "./storage";
import { UserRole } from "@shared/roles";
import { emailNotifications } from "./emailService";

/**
 * Background jobs for the MarketingOS system.
 * These are called from index.ts to keep the main process clean.
 */

// Helper: check for overdue invoices and send reminders
export async function checkOverdueInvoices() {
  try {
    const invoices = await storage.getInvoices();
    const now = new Date();
    const overdueInvoices = invoices.filter(invoice => 
      invoice.status === 'sent' && 
      invoice.dueDate && 
      new Date(invoice.dueDate) < now
    );
    
    for (const invoice of overdueInvoices) {
      if (invoice.clientId) {
        const clientUsers = await storage.getUsersByClientId(invoice.clientId);
        const { sendPushToUser } = await import('./push');
        
        for (const clientUser of clientUsers) {
          await storage.createNotification({
            userId: clientUser.id,
            type: 'error',
            title: '💰 Invoice Overdue',
            message: `Invoice #${invoice.invoiceNumber} is overdue. Please pay immediately.`,
            category: 'financial',
            actionUrl: '/client-billing',
            isRead: false,
          });

          await sendPushToUser(clientUser.id, {
            title: '💰 Invoice Overdue',
            body: `Invoice #${invoice.invoiceNumber} is overdue. Please pay immediately.`,
            url: '/client-billing',
          }).catch(err => console.error('Failed to send push notification:', err));

          // Send email notification to client user
          if (clientUser.email) {
            void emailNotifications.sendInvoiceOverdueEmail(
              clientUser.email,
              clientUser.firstName || clientUser.username,
              invoice.invoiceNumber || invoice.id
            ).catch(err => console.error('Failed to send invoice overdue email to client:', err));
          }
        }
      }
      
      const users = await storage.getUsers();
      const admins = users.filter(u => u.role === UserRole.ADMIN);
      const { sendPushToUser: sendPushToAdmin } = await import('./push');
      
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'warning',
          title: '💰 Invoice Overdue',
          message: `Invoice #${invoice.invoiceNumber} is overdue for client ${invoice.clientId}`,
          category: 'financial',
          actionUrl: `/invoices?invoiceId=${invoice.id}`,
          isRead: false,
        });

        await sendPushToAdmin(admin.id, {
          title: '💰 Invoice Overdue',
          body: `Invoice #${invoice.invoiceNumber} is overdue for client ${invoice.clientId}`,
          url: '/invoices',
        }).catch(err => console.error('Failed to send push notification:', err));

        // Send email notification to admin
        if (admin.email) {
          void emailNotifications.sendInvoiceOverdueAdminEmail(
            admin.email,
            admin.firstName || admin.username,
            invoice.invoiceNumber || invoice.id,
            `Client ${invoice.clientId}`
          ).catch(err => console.error('Failed to send invoice overdue email to admin:', err));
        }
      }
    }
    
    if (overdueInvoices.length > 0) {
      console.log(`✅ Checked ${overdueInvoices.length} overdue invoices and sent notifications`);
    }
  } catch (error) {
    console.error('Failed to check overdue invoices:', error);
  }
}

// Helper: meeting reminders for bookings/events in next 60 mins
export async function runMeetingReminders() {
  try {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    // @ts-ignore - API exists on storage implementation
    const events = await storage.getCalendarEvents();
    const upcoming = (events || []).filter((e: any) => {
      const start = e.start || e.datetime || e.date;
      if (!start) return false;
      const when = new Date(start);
      return when >= now && when <= inOneHour;
    });
    
    if (upcoming.length === 0) return;

    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('./push');

    for (const ev of upcoming) {
      const meetingTitle = ev.title || 'Scheduled meeting';
      const meetingTime = new Date(ev.start || ev.datetime).toLocaleTimeString();

      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'warning',
          title: '📅 Upcoming Meeting',
          message: `${meetingTitle} at ${meetingTime}`,
          category: 'communication',
          actionUrl: '/company-calendar',
          isRead: false,
        });
        await sendPushToUser(admin.id, {
          title: '📅 Upcoming Meeting',
          body: `${meetingTitle} in less than 1 hour`,
          url: '/company-calendar',
        }).catch(err => console.error('Failed to send push notification:', err));

        // Send email reminder
        if (admin.email) {
          void emailNotifications.sendMeetingReminderEmail(
            admin.email,
            admin.firstName || admin.username,
            meetingTitle,
            meetingTime
          ).catch(err => console.error('Failed to send meeting reminder email:', err));
        }
      }
    }
    console.log(`✅ Meeting reminders sent for ${upcoming.length} event(s)`);
  } catch (error) {
    console.error('Meeting reminders error:', error);
  }
}

// Start all background intervals
export function startBackgroundJobs() {
  console.log('🚀 Starting background intervals...');
  
  // Overdue invoice check (hourly)
  setInterval(checkOverdueInvoices, 60 * 60 * 1000);
  
  // Meeting reminders (every 15 mins)
  setInterval(runMeetingReminders, 15 * 60 * 1000);
}

