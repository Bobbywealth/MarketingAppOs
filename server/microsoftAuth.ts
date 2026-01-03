import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
};

const pca = new ConfidentialClientApplication(msalConfig);

const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';
// 'offline_access' is REQUIRED to get refresh tokens for persistent login
// NOTE: Adding calendar scopes requires users to re-consent once.
const SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
];

export function getAuthUrl(state?: string): string {
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
    state: state,
  };

  return pca.getAuthCodeUrl(authCodeUrlParameters).then((url) => url);
}

export async function getTokenFromCode(code: string): Promise<any> {
  const tokenRequest: AuthorizationCodeRequest = {
    code,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresOn: response.expiresOn,
      account: response.account,
    };
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<any> {
  if (!refreshToken) {
    throw new Error('No refresh token provided');
  }

  try {
    const refreshTokenRequest = {
      refreshToken,
      // For refresh requests, we exclude 'offline_access' as it's only for the initial request
      // and can sometimes cause AADSTS9002313 (malformed request)
      scopes: SCOPES.filter(s => s !== 'offline_access'),
      redirectUri: REDIRECT_URI,
    };

    console.log(`[MicrosoftAuth] Attempting to refresh token (RT length: ${refreshToken.length})`);
    const response = await pca.acquireTokenByRefreshToken(refreshTokenRequest);
    
    if (!response) {
      throw new Error('No response from Microsoft during token refresh');
    }

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresOn: response.expiresOn,
    };
  } catch (error: any) {
    console.error('Error refreshing token:', {
      message: error.message,
      errorCode: error.errorCode,
      subError: error.subError,
      stack: error.stack
    });
    throw error;
  }
}

export function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Calendar operations (Microsoft Graph)
type GraphDateTime = { dateTime: string; timeZone?: string };
type GraphLocation = { displayName?: string };
type GraphAttendee = { emailAddress?: { address?: string; name?: string }; type?: string };

function getCalendarUserPath(): string {
  // If you want to force a specific mailbox/calendar (e.g. business@wolfpaqmarketing.app),
  // set MICROSOFT_CALENDAR_MAILBOX to that email/UPN.
  const mailbox = (process.env.MICROSOFT_CALENDAR_MAILBOX || '').trim();
  if (mailbox) return `/users/${encodeURIComponent(mailbox)}`;
  return '/me';
}

export async function listCalendarView(
  accessToken: string,
  startIso: string,
  endIso: string,
  timeZone: string = 'America/New_York'
) {
  const client = getGraphClient(accessToken);
  const base = getCalendarUserPath();

  try {
    const events = await client
      .api(`${base}/calendarView`)
      .header('Prefer', `outlook.timezone="${timeZone}"`)
      .query({
        startDateTime: startIso,
        endDateTime: endIso,
        $top: 200,
        $orderby: 'start/dateTime',
      })
      .select('id,subject,bodyPreview,start,end,location,attendees,webLink,onlineMeeting')
      .get();

    return events.value || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    subject: string;
    bodyPreview?: string;
    start: GraphDateTime;
    end: GraphDateTime;
    location?: GraphLocation;
    attendees?: GraphAttendee[];
  }
) {
  const client = getGraphClient(accessToken);
  const base = getCalendarUserPath();

  try {
    return await client.api(`${base}/events`).post({
      subject: event.subject,
      body: event.bodyPreview
        ? { contentType: 'Text', content: event.bodyPreview }
        : undefined,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  patch: {
    subject?: string;
    bodyPreview?: string;
    start?: GraphDateTime;
    end?: GraphDateTime;
    location?: GraphLocation;
  }
) {
  const client = getGraphClient(accessToken);
  const base = getCalendarUserPath();

  try {
    await client.api(`${base}/events/${eventId}`).patch({
      subject: patch.subject,
      body: patch.bodyPreview
        ? { contentType: 'Text', content: patch.bodyPreview }
        : undefined,
      start: patch.start,
      end: patch.end,
      location: patch.location,
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const client = getGraphClient(accessToken);
  const base = getCalendarUserPath();

  try {
    await client.api(`${base}/events/${eventId}`).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

// Email operations
export async function getEmails(accessToken: string, folder: string = 'inbox', top: number = 50) {
  const client = getGraphClient(accessToken);
  
  try {
    let folderPath = 'inbox';
    if (folder === 'sent') folderPath = 'sentItems';
    else if (folder === 'spam') folderPath = 'junkemail';
    else if (folder === 'trash') folderPath = 'deletedItems';
    
    const messages = await client
      .api(`/me/mailFolders/${folderPath}/messages`)
      .select('id,subject,from,toRecipients,ccRecipients,bodyPreview,receivedDateTime,isRead,hasAttachments')
      .top(top)
      .orderby('receivedDateTime DESC')
      .get();

    return messages.value;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

export async function getEmailById(accessToken: string, messageId: string) {
  const client = getGraphClient(accessToken);
  
  try {
    const message = await client
      .api(`/me/messages/${messageId}`)
      .select('id,subject,from,toRecipients,ccRecipients,bccRecipients,body,bodyPreview,receivedDateTime,sentDateTime,isRead,hasAttachments,attachments')
      .get();

    return message;
  } catch (error) {
    console.error('Error fetching email:', error);
    throw error;
  }
}

export async function sendEmail(accessToken: string, emailData: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}) {
  const client = getGraphClient(accessToken);
  
  const message = {
    subject: emailData.subject,
    body: {
      contentType: emailData.isHtml ? 'HTML' : 'Text',
      content: emailData.body,
    },
    toRecipients: emailData.to.map(email => ({
      emailAddress: { address: email }
    })),
    ccRecipients: emailData.cc?.map(email => ({
      emailAddress: { address: email }
    })) || [],
    bccRecipients: emailData.bcc?.map(email => ({
      emailAddress: { address: email }
    })) || [],
  };

  try {
    await client.api('/me/sendMail').post({ message });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function replyToEmail(accessToken: string, messageId: string, body: string, isHtml?: boolean) {
  const client = getGraphClient(accessToken);
  
  const reply = {
    comment: body,
  };

  try {
    await client.api(`/me/messages/${messageId}/reply`).post(reply);
    return { success: true };
  } catch (error) {
    console.error('Error replying to email:', error);
    throw error;
  }
}

export async function markAsRead(accessToken: string, messageId: string, isRead: boolean = true) {
  const client = getGraphClient(accessToken);
  
  try {
    await client.api(`/me/messages/${messageId}`).patch({ isRead });
    return { success: true };
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}

export async function getUserProfile(accessToken: string) {
  const client = getGraphClient(accessToken);
  
  try {
    const user = await client.api('/me').select('displayName,mail,userPrincipalName').get();
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

