import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
    );
  }

  getAuthUrl(userId: number): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId.toString(), // Pass user ID in state to identify user after callback
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async listEvents(maxResults: number = 10) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }

  async createEvent(event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: event.end,
          timeZone: 'America/New_York',
        },
      },
    });

    return response.data;
  }

  async updateEvent(eventId: string, event: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
  }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const updateData: any = {};
    if (event.summary) updateData.summary = event.summary;
    if (event.description) updateData.description = event.description;
    if (event.location) updateData.location = event.location;
    if (event.start) {
      updateData.start = {
        dateTime: event.start,
        timeZone: 'America/New_York',
      };
    }
    if (event.end) {
      updateData.end = {
        dateTime: event.end,
        timeZone: 'America/New_York',
      };
    }

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
    });

    return response.data;
  }

  async deleteEvent(eventId: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  async syncEvents(localEvents: Array<{
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    googleEventId?: string;
  }>) {
    const syncedEvents = [];

    for (const localEvent of localEvents) {
      try {
        if (localEvent.googleEventId) {
          // Update existing Google event
          const googleEvent = await this.updateEvent(localEvent.googleEventId, {
            summary: localEvent.title,
            description: localEvent.description,
            start: localEvent.start,
            end: localEvent.end,
            location: localEvent.location,
          });
          syncedEvents.push({ localId: localEvent.id, googleId: googleEvent.id });
        } else {
          // Create new Google event
          const googleEvent = await this.createEvent({
            summary: localEvent.title,
            description: localEvent.description,
            start: localEvent.start,
            end: localEvent.end,
            location: localEvent.location,
          });
          syncedEvents.push({ localId: localEvent.id, googleId: googleEvent.id });
        }
      } catch (error) {
        console.error(`Failed to sync event ${localEvent.id}:`, error);
      }
    }

    return syncedEvents;
  }
}

export const googleCalendarService = new GoogleCalendarService();

