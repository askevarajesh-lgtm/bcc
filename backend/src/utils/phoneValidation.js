const { parsePhoneNumberFromString } = require('libphonenumber-js');

/**
 * Validates a phone number using libphonenumber-js.
 * 
 * @param {string} phone - The local phone number without country code
 * @param {string} countryCode - The numeric country code (e.g., '91' for India)
 * @returns {object} - { isValid: boolean, message?: string }
 */
const validatePhoneNumber = (phone, countryCode) => {
  if (!phone) {
    return { isValid: true };
  }

  const cCode = countryCode || '91';
  const phoneNumber = parsePhoneNumberFromString("+" + cCode + phone);

  if (!phoneNumber || !phoneNumber.isValid()) {
    return { 
      isValid: false, 
      message: 'Please enter a valid phone number for the selected country.' 
    };
  }

  return { isValid: true };
};

module.exports = {
  validatePhoneNumber
};
