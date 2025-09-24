// Gmail-based email alerts - works with any email address
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, userEmail, data } = req.body;

  if (!userEmail) {
    return res.status(400).json({ message: 'userEmail is required' });
  }

  try {
    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'Gmail credentials not configured',
        message: 'Please add GMAIL_USER and GMAIL_APP_PASSWORD to environment variables' 
      });
    }

    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');
    
    // Create Gmail transporter
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    let subject, html;
    
    if (type === 'test') {
      subject = '🎉 Gmail Test - SpendWise';
      html = `
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
      `;
    } else if (type === 'low_balance') {
      subject = '⚠️ Low Balance Alert - SpendWise';
      html = generateLowBalanceEmail(data.balance);
    } else {
      subject = '📧 SpendWise Alert';
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
      message: 'Email sent successfully via Gmail!',
      sentTo: userEmail
    });
    
  } catch (error) {
    console.error('Gmail email error:', error);
    res.status(500).json({ 
      error: 'Failed to send Gmail email',
      details: error.message 
    });
  }
}

function generateLowBalanceEmail(balance) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ SpendWise Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Balance Monitoring System</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #ff7043; margin-top: 0;">Low Balance Warning</h2>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff7043; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #333;">
              Your total balance: <strong style="color: #ff7043; font-size: 32px; display: block; margin-top: 10px;">₹${balance.toFixed(2)}</strong>
            </p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">💡 Recommendations:</h3>
            <ul style="color: #1976d2; margin: 10px 0; padding-left: 20px;">
              <li>Review your recent expenses</li>
              <li>Plan your budget for the coming days</li>
              <li>Consider reducing discretionary spending</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Sent via Gmail SMTP • SpendWise App 💰
          </p>
        </div>
      </div>
    </div>
  `;
}