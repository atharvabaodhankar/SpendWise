// Gmail SMTP email service - works with any email address
import nodemailer from 'nodemailer';

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
      subject = `🤝 Friend Request from ${data.senderName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👋 New Friend Request</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              <strong>${data.senderName}</strong> (${data.senderEmail}) wants to connect with you on SpendWise!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Accept this request to split bills and track shared expenses together.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Log in to SpendWise to accept or decline this request.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'friend_accepted') {
      subject = `✅ ${data.accepterName} accepted your friend request!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Friend Request Accepted!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Great news! <strong>${data.accepterName}</strong> (${data.accepterEmail}) accepted your friend request.
            </p>
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                ✨ You can now split bills and manage shared expenses together!
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Log in to SpendWise to start tracking your shared expenses.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'bill_split') {
      subject = `💳 Bill Split: ₹${data.amount} from ${data.senderName}`;
      const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const settleUrl = data.debtId && data.settleToken
        ? `${appUrl}/api/settle-debt?debtId=${data.debtId}&token=${data.settleToken}`
        : null;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 Bill Split Alert</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              <strong>${data.senderName}</strong> split a bill with you!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Description:</span>
                <strong style="color: #374151;">${data.description}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">Your Share:</span>
                <strong style="color: #f59e0b; font-size: 20px;">₹${data.amount}</strong>
              </div>
            </div>
            ${settleUrl ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="${settleUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 8px 20px rgba(16,185,129,0.35);">
                ✅ Mark as Paid
              </a>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">One click to notify ${data.senderName} that you've paid</p>
            </div>
            ` : ''}
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                📝 This expense has been added to your SpendWise dashboard. You can also mark it as paid from the app.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'debt_marked_paid') {
      subject = `✅ ${data.debtorName} marked ₹${data.amount} as paid`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💵 Payment Notification</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              <strong>${data.debtorName}</strong> marked a payment as complete!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Description:</span>
                <strong style="color: #374151;">${data.description}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">Amount:</span>
                <strong style="color: #3b82f6; font-size: 20px;">₹${data.amount}</strong>
              </div>
            </div>
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
                ⏳ Please confirm receipt of this payment in your SpendWise dashboard to settle the debt.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'payment_confirmed') {
      subject = `🎉 Payment confirmed by ${data.creditorName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Debt Settled!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Great news! <strong>${data.creditorName}</strong> confirmed receipt of your payment.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Description:</span>
                <strong style="color: #374151;">${data.description}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">Amount Settled:</span>
                <strong style="color: #10b981; font-size: 20px;">₹${data.amount}</strong>
              </div>
            </div>
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                ✨ This debt has been cleared from your records. All settled up!
              </p>
            </div>
          </div>
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