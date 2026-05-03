import nodemailer from "nodemailer";

// Email transporter configuration
// Update these with your SMTP settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendInvoiceEmail = async (userEmail, userName, subscriptionDetails) => {
  try {
    const transporter = createTransporter();

    const planNames = {
      free: "Free Plan",
      bronze: "Bronze Plan",
      silver: "Silver Plan",
      gold: "Gold Plan",
    };

    const planLimits = {
      free: "1 question per day",
      bronze: "5 questions per day",
      silver: "10 questions per day",
      gold: "Unlimited questions",
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f48024; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Stack Overflow Clone</h1>
            <h2>Subscription Invoice</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Thank you for your subscription! Your payment has been successfully processed.</p>
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <div class="detail-row">
                <strong>Plan:</strong>
                <span>${planNames[subscriptionDetails.plan] || subscriptionDetails.plan}</span>
              </div>
              <div class="detail-row">
                <strong>Amount Paid:</strong>
                <span>₹${subscriptionDetails.amount}</span>
              </div>
              <div class="detail-row">
                <strong>Payment ID:</strong>
                <span>${subscriptionDetails.paymentId || "N/A"}</span>
              </div>
              <div class="detail-row">
                <strong>Start Date:</strong>
                <span>${new Date(subscriptionDetails.startDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <strong>End Date:</strong>
                <span>${new Date(subscriptionDetails.endDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <strong>Features:</strong>
                <span>${planLimits[subscriptionDetails.plan] || "N/A"}</span>
              </div>
            </div>

            <p>Your subscription is now active. You can start posting questions according to your plan limits.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Stack Overflow Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `Subscription Invoice - ${planNames[subscriptionDetails.plan]}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return false;
  }
};

export const sendOTPEmail = async (userEmail, userName, otp) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f48024; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .otp-box { background-color: white; padding: 30px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #f48024; letter-spacing: 5px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Stack Overflow Clone</h1>
            <h2>Login Verification Code</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>You are logging in from Google Chrome. For security purposes, please use the following One-Time Password (OTP) to complete your login:</p>
            
            <div class="otp-box">
              <p style="margin-bottom: 10px;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you did not request this login, please ignore this email</li>
              </ul>
            </div>

            <p>Enter this code in the login page to complete your authentication.</p>
            <p>If you have any concerns, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Stack Overflow Clone. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: "Login Verification Code - Stack Overflow Clone",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

