// Simple Gmail test endpoint
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ message: 'userEmail is required' });
  }

  try {
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"SpendWise App" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 Gmail Test - SpendWise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">🎉 Gmail SMTP Working!</h2>
          <p>This email was sent using Gmail SMTP from your SpendWise app!</p>
          <p><strong>This means you can now send emails to ANY email address! 🚀</strong></p>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <strong>Test Details:</strong><br>
            • Sent to: ${userEmail}<br>
            • Time: ${new Date().toLocaleString()}<br>
            • Method: Gmail SMTP ✅<br>
            • Status: Success! 🎉
          </div>
          <p style="color: #666; font-size: 14px;">
            Now you can send alerts to any user without domain verification!
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Gmail test email sent successfully!',
      sentTo: userEmail
    });
    
  } catch (error) {
    console.error('Gmail error:', error);
    res.status(500).json({ 
      error: 'Failed to send Gmail email',
      details: error.message 
    });
  }
}