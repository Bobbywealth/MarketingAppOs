import axios from 'axios';

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

  // Get call logs
  async getCallLogs(params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await axios.get(`${DIALPAD_API_BASE}/call`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching call logs:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch call logs');
    }
  }

  // Get specific call details
  async getCallDetails(callId: string) {
    try {
      const response = await axios.get(`${DIALPAD_API_BASE}/call/${callId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching call details:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch call details');
    }
  }

  // Make an outbound call
  async makeCall(data: {
    to_number: string;
    from_number?: string;
    from_extension_id?: string;
  }) {
    try {
      const response = await axios.post(`${DIALPAD_API_BASE}/calls`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error making call:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to make call');
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
      const response = await axios.get(`${DIALPAD_API_BASE}/sms/messages`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching SMS messages:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch SMS messages');
    }
  }

  // Send SMS
  async sendSms(data: {
    to_numbers: string[];
    text: string;
    from_number?: string;
  }) {
    try {
      const response = await axios.post(`${DIALPAD_API_BASE}/sms/messages`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending SMS:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send SMS');
    }
  }

  // Get contacts
  async getContacts(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    try {
      const response = await axios.get(`${DIALPAD_API_BASE}/contact`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching contacts:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch contacts');
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
      const response = await axios.post(`${DIALPAD_API_BASE}/contact`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating contact:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create contact');
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
      const response = await axios.get(`${DIALPAD_API_BASE}/voicemail`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching voicemails:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch voicemails');
    }
  }

  // Get recording URL for a call
  async getRecordingUrl(callId: string) {
    try {
      const response = await axios.get(`${DIALPAD_API_BASE}/call/${callId}/recording`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching recording:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch recording');
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
      const response = await axios.get(`${DIALPAD_API_BASE}/stats/call`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching call stats:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch call stats');
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await axios.get(`${DIALPAD_API_BASE}/user/me`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch user info');
    }
  }
}

// Export a singleton instance if API key is available
export const dialpadService = process.env.DIALPAD_API_KEY 
  ? new DialpadService(process.env.DIALPAD_API_KEY)
  : null;

