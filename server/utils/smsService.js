// SMS Service for sending OTP to mobile numbers
// Note: This is a placeholder implementation. In production, you would use a service like:
// - Twilio
// - AWS SNS
// - MessageBird
// - Nexmo/Vonage

/**
 * Send OTP via SMS
 * @param {String} phoneNumber - Phone number with country code
 * @param {String} otp - OTP code to send
 * @returns {Promise<Boolean>} Success status
 */
export const sendSMS = async (phoneNumber, otp) => {
  try {
    // In production, replace this with actual SMS service API call
    // Example with Twilio:
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    await client.messages.create({
      body: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */

    // For development/testing, log the OTP
    console.log(`[SMS] Sending OTP to ${phoneNumber}: ${otp}`);
    console.log(`[SMS] In production, this would be sent via SMS service`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In development, you can return the OTP in the response for testing
    // In production, return true after successful SMS send
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};

/**
 * Validate phone number format
 * @param {String} phoneNumber - Phone number to validate
 * @returns {Boolean} Is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Basic validation - accepts international format with + prefix
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
};

