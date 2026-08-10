const sendpulse = require('sendpulse-api');

let isInitialized = false;
let isInitializing = false;

const initSendPulse = () => {
  return new Promise((resolve, reject) => {
    if (isInitialized) return resolve();
    if (isInitializing) {
      // Simple backoff if multiple concurrent requests happen during init
      setTimeout(() => resolve(initSendPulse()), 500);
      return;
    }
    isInitializing = true;
    sendpulse.init(
      process.env.SENDPULSE_CLIENT_ID,
      process.env.SENDPULSE_CLIENT_SECRET,
      '/tmp/',
      (token) => {
        if (token && token.is_error) {
          isInitializing = false;
          reject(new Error('Failed to initialize SendPulse: ' + JSON.stringify(token)));
        } else {
          isInitialized = true;
          isInitializing = false;
          resolve(token);
        }
      }
    );
  });
};

exports.sendOtpEmail = async (toEmail, otp) => {
  try {
    await initSendPulse();
    
    return new Promise((resolve, reject) => {
      const emailParams = {
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Use the OTP below to proceed.</p>
            <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
        `,
        text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
        subject: 'Password Reset OTP',
        from: {
          name: process.env.SENDPULSE_FROM_NAME || 'M1 WORKFORCE THEMILABS',
          email: process.env.SENDPULSE_FROM_EMAIL || 'dev@askeva.io',
        },
        to: [
          {
            email: toEmail,
          },
        ],
      };

      sendpulse.smtpSendMail((response) => {
        if (response && response.is_error) {
          console.error('SendPulse error:', response);
          reject(new Error('Failed to send OTP email'));
        } else {
          resolve(response);
        }
      }, emailParams);
    });
  } catch (error) {
    console.error('Error in sendOtpEmail:', error);
    throw error;
  }
};
