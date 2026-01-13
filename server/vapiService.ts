import axios from 'axios';

const VAPI_API_KEY = process.env.VAPI_API_KEY?.trim();
const VAPI_BASE_URL = 'https://api.vapi.ai';

/**
 * Interface for Vapi Call Response
 */
export interface VapiCallResponse {
  success: boolean;
  id?: string;
  error?: string;
  status?: string;
}

/**
 * Start an outbound call via Vapi.ai
 * 
 * @param to The recipient's phone number in E.164 format
 * @param assistantId The ID of the Vapi assistant to use
 * @param customerName Optional name of the customer for personalization
 * @returns 
 */
export async function startVapiCall(
  to: string, 
  assistantId: string, 
  customerName?: string
): Promise<VapiCallResponse> {
  if (!VAPI_API_KEY) {
    console.warn('⚠️ VAPI_API_KEY not configured. Calls will not be placed.');
    return { success: false, error: 'VAPI_API_KEY is missing' };
  }

  try {
    const requestData: any = {
      assistantId: assistantId,
      customer: {
        number: to,
        name: customerName,
      },
      type: 'outboundPhoneCall',
    };

    // Only add phoneNumberId if it's a valid-looking UUID
    const vapiPhoneId = process.env.VAPI_PHONE_NUMBER_ID;
    if (vapiPhoneId && vapiPhoneId.length > 10) {
      requestData.phoneNumberId = vapiPhoneId;
    }

    const response = await axios.post(
      `${VAPI_BASE_URL}/call`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Vapi call initiated: ${response.data.id}`);
    return { 
      success: true, 
      id: response.data.id, 
      status: response.data.status 
    };
  } catch (error: any) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || error.message || 'Unknown Vapi error';

    console.error('❌ Vapi call error:', {
      status,
      message,
      data,
    });

    return {
      success: false,
      error: `Vapi error (${status}): ${message}`,
    };
  }
}

/**
 * List available assistants from Vapi
 */
export async function listVapiAssistants() {
  if (!VAPI_API_KEY) return [];

  try {
    const response = await axios.get(`${VAPI_BASE_URL}/assistant`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Vapi assistants:', error);
    return [];
  }
}

/**
 * Get call details from Vapi
 */
export async function getVapiCall(callId: string) {
  if (!VAPI_API_KEY) return null;

  try {
    const response = await axios.get(`${VAPI_BASE_URL}/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching Vapi call ${callId}:`, error);
    return null;
  }
}
