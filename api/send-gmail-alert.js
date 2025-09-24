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
    } else if (type === 'critical_balance') {
      subject = '🚨 Critical Balance Alert - SpendWise';
      html = generateCriticalBalanceEmail(data.balance);
    } else if (type === 'daily_expense') {
      subject = '📊 Daily Expense Alert - SpendWise';
      html = generateDailyExpenseEmail(data.totalExpenses);
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

function generateCriticalBalanceEmail(balance) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Critical Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Immediate Attention Required</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #ff3838; margin-top: 0;">Critical Balance Alert</h2>
          
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #ff3838; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #333;">
              Your total balance: <strong style="color: #ff3838; font-size: 32px; display: block; margin-top: 10px;">₹${balance.toFixed(2)}</strong>
            </p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">🚨 Immediate Action Required:</h3>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li><strong>Review and reduce unnecessary expenses</strong></li>
              <li><strong>Consider adding funds to your accounts</strong></li>
              <li><strong>Set up an emergency budget plan</strong></li>
              <li><strong>Avoid non-essential purchases</strong></li>
            </ul>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Critical Alert • SpendWise App ⚠️
          </p>
        </div>
      </div>
    </div>
  `;
}

function generateDailyExpenseEmail(totalExpenses) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Expense Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Daily Spending Monitoring</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #667eea; margin-top: 0;">Daily Expense Limit Exceeded</h2>
          
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #333;">
              Today's expenses: <strong style="color: #667eea; font-size: 32px; display: block; margin-top: 10px;">₹${totalExpenses.toFixed(2)}</strong>
            </p>
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 16px;">
              Daily limit: ₹2,000.00
            </p>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">💡 Budget Tips:</h3>
            <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
              <li>Review today's transactions for unnecessary expenses</li>
              <li>Consider postponing non-essential purchases</li>
              <li>Set spending alerts for tomorrow</li>
              <li>Track your weekly budget progress</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Stay on track with your daily budget goals! 🎯
          </p>
        </div>
      </div>
    </div>
  `;
}