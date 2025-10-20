const DIALPAD_API_BASE = 'https://dialpad.com/api/v2';

export class DialpadService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
  }

  // Get call logs
  async getCallLogs(params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Cap limit at 50 (Dialpad API maximum)
      const safeParams = {
        ...params,
        limit: params?.limit && params.limit > 50 ? 50 : params?.limit,
      };
      
      const queryString = this.buildQueryString(safeParams);
      const url = `${DIALPAD_API_BASE}/call${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Calls fetched:', Array.isArray(data) ? data.length : (data.calls?.length || 0));
      // Ensure we return an array
      return Array.isArray(data) ? data : (data.calls || []);
    } catch (error: any) {
      console.error('❌ Error fetching call logs:', error.message);
      throw new Error(error.message || 'Failed to fetch call logs');
    }
  }

  // Get specific call details
  async getCallDetails(callId: string) {
    try {
      const url = `${DIALPAD_API_BASE}/call/${callId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error fetching call details:', error.message);
      throw new Error(error.message || 'Failed to fetch call details');
    }
  }

  // Make an outbound call
  async makeCall(data: {
    to_number: string;
    from_number?: string;
    from_extension_id?: string;
    from_user_id?: string;
  }) {
    try {
      const url = `${DIALPAD_API_BASE}/call`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Call started successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error making call:', error.message);
      throw new Error(error.message || 'Failed to make call');
    }
  }

  // Get SMS messages
  async getSmsMessages(params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Cap limit at 50 (Dialpad API maximum)
      const safeParams = {
        ...params,
        limit: params?.limit && params.limit > 50 ? 50 : params?.limit,
      };
      
      const queryString = this.buildQueryString(safeParams);
      const url = `${DIALPAD_API_BASE}/message${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Messages fetched:', Array.isArray(data) ? data.length : (data.messages?.length || 0));
      // Ensure we return an array
      return Array.isArray(data) ? data : (data.messages || []);
    } catch (error: any) {
      console.error('❌ Error fetching SMS messages:', error.message);
      throw new Error(error.message || 'Failed to fetch SMS messages');
    }
  }

  // Send SMS
  async sendSms(data: {
    to_numbers: string[];
    text: string;
    from_number?: string;
    from_user_id?: string;
  }) {
    try {
      const url = `${DIALPAD_API_BASE}/message`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ SMS sent successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error sending SMS:', error.message);
      throw new Error(error.message || 'Failed to send SMS');
    }
  }

  // Get contacts
  async getContacts(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    try {
      // Cap limit at 50 (Dialpad API maximum)
      const safeParams = {
        ...params,
        limit: params?.limit && params.limit > 50 ? 50 : params?.limit,
      };
      
      const queryString = this.buildQueryString(safeParams);
      const url = `${DIALPAD_API_BASE}/contacts${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Contacts fetched:', Array.isArray(data) ? data.length : (data.contacts?.length || 0));
      // Ensure we return an array
      return Array.isArray(data) ? data : (data.contacts || []);
    } catch (error: any) {
      console.error('❌ Error fetching contacts:', error.message);
      throw new Error(error.message || 'Failed to fetch contacts');
    }
  }

  // Create contact
  async createContact(data: {
    name: string;
    phones?: Array<{ type: string; value: string }>;
    emails?: Array<{ type: string; value: string }>;
    company?: string;
  }) {
    try {
      const url = `${DIALPAD_API_BASE}/contacts`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Contact created successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating contact:', error.message);
      throw new Error(error.message || 'Failed to create contact');
    }
  }

  // Get voicemails
  async getVoicemails(params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Cap limit at 50 (Dialpad API maximum)
      const safeParams = {
        ...params,
        limit: params?.limit && params.limit > 50 ? 50 : params?.limit,
      };
      
      const queryString = this.buildQueryString(safeParams);
      const url = `${DIALPAD_API_BASE}/voicemail${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error fetching voicemails:', error.message);
      throw new Error(error.message || 'Failed to fetch voicemails');
    }
  }

  // Get recording URL for a call
  async getRecordingUrl(callId: string) {
    try {
      const url = `${DIALPAD_API_BASE}/call/${callId}/recording`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error fetching recording:', error.message);
      throw new Error(error.message || 'Failed to fetch recording');
    }
  }

  // Get call stats
  async getCallStats(params: {
    start_time: string;
    end_time: string;
    target_type?: 'user' | 'office' | 'department' | 'call_center';
    target_id?: string;
  }) {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${DIALPAD_API_BASE}/stats/call${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error fetching call stats:', error.message);
      throw new Error(error.message || 'Failed to fetch call stats');
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const url = `${DIALPAD_API_BASE}/user/me`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error fetching current user:', error.message);
      throw new Error(error.message || 'Failed to fetch user info');
    }
  }
}

// Export a singleton instance if API key is available
export const dialpadService = process.env.DIALPAD_API_KEY 
  ? new DialpadService(process.env.DIALPAD_API_KEY)
  : null;
