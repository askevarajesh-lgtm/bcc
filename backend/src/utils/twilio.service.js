const twilio = require('twilio');

/**
 * Validates Twilio credentials by attempting to fetch incoming phone numbers
 * and messaging services.
 * 
 * @param {string} accountSid 
 * @param {string} authToken 
 * @returns {Promise<Array<string>>} List of available sender IDs or phone numbers
 */
const testConnection = async (accountSid, authToken) => {
  try {
    const client = twilio(accountSid, authToken);
    
    // Fetch incoming phone numbers
    const numbersResponse = await client.incomingPhoneNumbers.list({ limit: 20 });
    const numbers = numbersResponse.map(n => n.phoneNumber);
    
    // Fetch messaging services
    const servicesResponse = await client.messaging.v1.services.list({ limit: 20 });
    const services = servicesResponse.map(s => s.sid);
    
    return [...numbers, ...services];
  } catch (error) {
    throw new Error(`Twilio authentication failed: ${error.message}`);
  }
};

/**
 * Sends an SMS message using Twilio.
 * 
 * @param {string} accountSid 
 * @param {string} authToken 
 * @param {string} from Sender phone number or messaging service SID
 * @param {string} to Recipient phone number
 * @param {string} body Message body
 * @returns {Promise<object>} Twilio message response
 */
const sendSms = async (accountSid, authToken, from, to, body) => {
  try {
    const client = twilio(accountSid, authToken);
    
    const payload = {
      to,
      body,
    };
    
    // If the 'from' value is a Messaging Service SID (starts with MG),
    // use messagingServiceSid instead of from
    if (from.startsWith('MG')) {
      payload.messagingServiceSid = from;
    } else {
      payload.from = from;
    }
    
    const message = await client.messages.create(payload);
    return message;
  } catch (error) {
    throw new Error(`Failed to send Twilio SMS: ${error.message}`);
  }
};

module.exports = {
  testConnection,
  sendSms,
};
