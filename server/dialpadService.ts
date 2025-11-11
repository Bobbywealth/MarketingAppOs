const DIALPAD_API_BASE = 'https://dialpad.com/api/v2';
const REQUEST_TIMEOUT = 5000; // 5 second timeout

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

  // Fetch with timeout
  private async fetchWithTimeout(url: string, options: any = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Dialpad API took too long to respond');
      }
      throw error;
    }
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
      console.log('✅ Calls fetched:', data.items?.length || 0);
      // Dialpad returns data in {items: [...]} format
      return data.items || [];
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
      console.log('📞 Making call with data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Dialpad Call API Error ${response.status}:`, errorText);
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText} - ${errorText}`);
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
      const url = `${DIALPAD_API_BASE}/sms${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Messages fetched:', data.items?.length || 0);
      // Dialpad returns data in {items: [...]} format
      return data.items || [];
    } catch (error: any) {
      console.error('❌ Error fetching SMS messages:', error.message);
      throw new Error(error.message || 'Failed to fetch SMS messages');
    }
  }

  // Send SMS
  async sendSms(data: {
    to_numbers?: string[];
    to_number?: string;
    text: string;
    from_number?: string;
    from_user_id?: string;
  }) {
    try {
      const url = `${DIALPAD_API_BASE}/sms`;
      console.log('📤 Sending SMS with data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Dialpad SMS API Error ${response.status}:`, errorText);
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText} - ${errorText}`);
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
    owner_id?: string;
  }) {
    try {
      // Cap limit at 50 (Dialpad API maximum)
      const safeParams = {
        ...params,
        limit: params?.limit && params.limit > 50 ? 50 : params?.limit,
      };
      
      const queryString = this.buildQueryString(safeParams);
      const url = `${DIALPAD_API_BASE}/contacts${queryString}`;
      
      console.log('📇 Fetching contacts with params:', safeParams);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Dialpad Contacts API Error ${response.status}:`, errorText);
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Contacts fetched:', data.items?.length || 0);
      // Dialpad returns data in {items: [...]} format
      return data.items || [];
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
      const url = `${DIALPAD_API_BASE}/calls/${callId}/recording`;
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
      const url = `${DIALPAD_API_BASE}/users/me`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const user = await response.json();
      console.log('✅ Got Dialpad user info:', user);
      return user;
    } catch (error: any) {
      console.error('❌ Error fetching user info:', error.message);
      throw error;
    }
  }

  // Test Dialpad API connection
  async testConnection() {
    try {
      // Test by fetching a single call record
      const url = `${DIALPAD_API_BASE}/call?limit=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Connected to Dialpad! API key is valid.');
      return { connected: true, apiKeyValid: true };
    } catch (error: any) {
      console.error('❌ Dialpad connection test failed:', error.message);
      throw error;
    }
  }
}

// Export a singleton instance if API key is available
export const dialpadService = process.env.DIALPAD_API_KEY 
  ? new DialpadService(process.env.DIALPAD_API_KEY)
  : null;
