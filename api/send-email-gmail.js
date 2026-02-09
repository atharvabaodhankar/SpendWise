// Gmail SMTP email service - works with any email address
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, userEmail, data } = req.body;

  if (!userEmail) {
    return res.status(400).json({ message: 'userEmail is required' });
  }

  try {
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password
      }
    });

    let subject, html;
    
    // Check if subject/html are directly provided
    if (req.body.subject && req.body.html) {
       subject = req.body.subject;
       html = req.body.html;
    } else if (type === 'test') {
      subject = '✅ Test Email - SpendWise';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Email Test Successful!</h2>
          <p>This is a test email from your SpendWise application using Gmail SMTP.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Test Details:</strong><br>
            • Sent to: ${userEmail}<br>
            • Time: ${new Date().toLocaleString()}<br>
            • Status: Success ✅<br>
            • Method: Gmail SMTP
          </div>
        </div>
      `;
    } else if (type === 'friend_request') {
      subject = 'New Friend Request - SpendWise';
      html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
           <h2>You have a new friend request!</h2>
           <p><strong>${data.senderName || 'Someone'}</strong> (${data.senderEmail}) wants to be your friend on SpendWise.</p>
           <p>Log in to accept the request.</p>
           <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}" style="display:inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to SpendWise</a>
        </div>
      `;
    } else if (type === 'bill_split') {
       subject = `New Expense Split: ₹${data.amount} - SpendWise`;
       html = `
         <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Expense Split</h2>
            <p><strong>${data.senderName}</strong> added you to a bill.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
               <p style="margin: 5px 0;"><strong>Note:</strong> ${data.description}</p>
               <p style="margin: 5px 0;"><strong>Your Share:</strong> <span style="color: #e11d48; font-weight: bold;">₹${data.amount}</span></p>
            </div>
            <p>Please review and settle up when possible.</p>
         </div>
       `;
    } else {
      // Handle other alert types here
      subject = '⚠️ SpendWise Alert';
      html = `<h2>Alert from SpendWise</h2><p>Alert type: ${type}</p>`;
    }

    const mailOptions = {
      from: `"SpendWise App" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully via Gmail',
      sentTo: userEmail
    });
    
  } catch (error) {
    console.error('Gmail email error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}