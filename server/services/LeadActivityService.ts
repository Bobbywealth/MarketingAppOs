import { Request, Response } from "express";
import { storage } from "../storage";
import {
  getAccessibleLeadOr404
} from "../routes/utils";

export const handleCreateLeadActivity = async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const leadId = req.params.id;
    const { type, subject, description, outcome } = req.body;

    // Create activity
    const activity = await storage.createLeadActivity({
      leadId,
      userId,
      type,
      subject,
      description,
      outcome,
      metadata: {},
    });

    // Notify assigned agent if someone else added an activity
    if (lead.assignedToId && Number(lead.assignedToId) !== Number(userId)) {
      storage.createNotification({
        userId: lead.assignedToId,
        type: 'info',
        title: `💬 New ${type} Activity`,
        message: `A new ${type} was added to lead ${lead.company} by another team member.`,
        category: 'lead',
        actionUrl: `/leads?leadId=${lead.id}`,
        isRead: false,
      }).catch(err => console.error("Failed to notify agent about activity:", err));
    }

    // Update lead's last contact info if it's a contact activity
    if (['call', 'email', 'sms', 'meeting'].includes(type)) {
      await storage.updateLead(leadId, {
        lastContactMethod: type,
        lastContactDate: new Date().toISOString(),
        lastContactNotes: description?.substring(0, 500) || null,
      });
    }

    res.status(201).json(activity);
  } catch (error) {
    console.error("Error creating lead activity:", error);
    res.status(500).json({ message: "Failed to create activity" });
  }
};

export const handleGetLeadActivities = async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    const activities = await storage.getLeadActivities(req.params.id);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};
