import { CircuitBreaker } from './lib/circuit-breaker';
import { log } from './vite';

const DIALPAD_API_BASE = 'https://dialpad.com/api/v2';
const REQUEST_TIMEOUT = 5000; // 5 second timeout

// Dialpad circuit breaker: trip after 3 failures, reset after 60s
const dialpadCircuit = new CircuitBreaker(3, 60000);

export class DialpadService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async executeWithCircuit<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    try {
      return await dialpadCircuit.execute(fn);
    } catch (error) {
      log(`❌ Dialpad error (${operation}): ${error instanceof Error ? error.message : 'Unknown error'}`, "dialpad");
      throw error;
    }
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
    return this.executeWithCircuit(async () => {
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
      log(`✅ Calls fetched: ${data.items?.length || 0}`, "dialpad");
      // Dialpad returns data in {items: [...]} format
      return data.items || [];
    }, "getCallLogs");
  }

  // Get specific call details
  async getCallDetails(callId: string) {
    return this.executeWithCircuit(async () => {
      const url = `${DIALPAD_API_BASE}/call/${callId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }, "getCallDetails");
  }

  // Make an outbound call
  async makeCall(data: {
    phone_number: string;
    user_id?: string; // Required by Dialpad API
    from_number?: string;
    from_extension_id?: string;
  }) {
    return this.executeWithCircuit(async () => {
      const url = `${DIALPAD_API_BASE}/call`;
      log(`📞 Making call to: ${data.phone_number}`, "dialpad");
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      log(`✅ Call started successfully: ${result.id}`, "dialpad");
      return result;
    }, "makeCall");
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
    user_id?: string; // Dialpad expects 'user_id' not 'from_user_id'
  }) {
    return this.executeWithCircuit(async () => {
      const url = `${DIALPAD_API_BASE}/sms`;
      log(`📤 Sending SMS to: ${data.to_number || data.to_numbers?.join(',')}`, "dialpad");
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      log(`✅ SMS sent successfully: ${result.id}`, "dialpad");
      return result;
    }, "sendSms");
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
      // Try to get users list (API key owner should be first)
      const url = `${DIALPAD_API_BASE}/users?limit=1`;
      console.log('🔍 Fetching Dialpad user from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Dialpad Users API Error ${response.status}:`, errorText);
        throw new Error(`Dialpad API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Got Dialpad users response:', JSON.stringify(data, null, 2));
      
      // Dialpad returns users in {items: [...]} format
      const user = data.items?.[0] || data[0] || data;
      
      if (!user || !user.id) {
        throw new Error('No user ID found in Dialpad response');
      }
      
      console.log('✅ Using Dialpad user ID:', user.id);
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
