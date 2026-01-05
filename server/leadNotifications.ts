import { storage } from "./storage";
import { UserRole } from "@shared/roles";
import { Lead } from "@shared/schema";

export async function notifyAboutLeadAction(params: {
  lead: Lead;
  action: 'created' | 'assigned' | 'stage_changed' | 'converted';
  actorId?: number;
  oldStage?: string;
  newStage?: string;
}) {
  const { lead, action, actorId, oldStage, newStage } = params;
  
  try {
    const allUsers = await storage.getUsers();
    const admins = allUsers.filter(u => u.role === UserRole.ADMIN);
    const assignedAgent = lead.assignedToId ? allUsers.find(u => u.id === lead.assignedToId) : null;
    
    const { sendPushToUser } = await import('./push');
    const { emailNotifications } = await import('./emailService');
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const leadUrl = `${appUrl}/leads?leadId=${lead.id}`;
    
    let title = '';
    let message = '';
    let category = 'lead';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (action) {
      case 'created':
        title = '🎯 New Lead Created';
        message = `New lead ${lead.company} has been added to the pipeline.`;
        type = 'info';
        break;
      case 'assigned':
        title = '🎯 Lead Assigned';
        message = `Lead ${lead.company} has been assigned to ${assignedAgent?.firstName || assignedAgent?.username || 'an agent'}.`;
        type = 'info';
        break;
      case 'stage_changed':
        title = '📈 Lead Stage Updated';
        message = `Lead ${lead.company} moved from ${oldStage?.replace('_', ' ')} to ${newStage?.replace('_', ' ')}.`;
        type = 'success';
        break;
      case 'converted':
        title = '🎊 Lead Converted';
        message = `Lead ${lead.company} has been successfully converted to a client!`;
        type = 'success';
        break;
    }

    // List of user IDs to notify (admins + assigned agent)
    const notifyUserIds = new Set<number>();
    admins.forEach(admin => {
      if (admin.id !== actorId) notifyUserIds.add(admin.id);
    });
    if (assignedAgent && assignedAgent.id !== actorId) {
      notifyUserIds.add(assignedAgent.id);
    }

    for (const userId of notifyUserIds) {
      const user = allUsers.find(u => u.id === userId);
      if (!user) continue;

      // 1. Create In-App Notification
      await storage.createNotification({
        userId: user.id,
        type,
        title,
        message,
        category,
        actionUrl: action === 'converted' ? `/clients?clientId=${lead.convertedToClientId}` : `/leads?leadId=${lead.id}`,
        isRead: false,
      });

      // 2. Send Push Notification
      await sendPushToUser(user.id, {
        title,
        body: message,
        url: action === 'converted' ? `/clients?clientId=${lead.convertedToClientId}` : `/leads?leadId=${lead.id}`,
      }).catch(err => console.error(`Failed to send lead push to user ${user.id}:`, err));

      // 3. Send Email Notification
      if (user.email) {
        try {
          const prefs = await storage.getUserNotificationPreferences(user.id).catch(() => null);
          if (prefs?.emailNotifications !== false) {
            if (action === 'assigned' && user.id === lead.assignedToId) {
              await emailNotifications.sendLeadAssignedEmail(user.email, user.firstName || user.username, lead.name || '', lead.company, leadUrl);
            } else if (action === 'stage_changed') {
              await emailNotifications.sendLeadStageChangedEmail(user.email, user.firstName || user.username, lead.company, oldStage || '', newStage || '', leadUrl);
            } else if (action === 'converted') {
              const clientUrl = `${appUrl}/clients?clientId=${lead.convertedToClientId}`;
              await emailNotifications.sendLeadConvertedEmail(user.email, user.firstName || user.username, lead.company, clientUrl);
            } else {
              // Default to action alert for admins on creation etc.
              await emailNotifications.sendActionAlertEmail(user.email, title, message, action === 'converted' ? `${appUrl}/clients?clientId=${lead.convertedToClientId}` : leadUrl, type);
            }
          }
        } catch (emailErr) {
          console.error(`Failed to send lead email to user ${user.id}:`, emailErr);
        }
      }
    }
  } catch (error) {
    console.error('Failed to process lead notifications:', error);
  }
}

