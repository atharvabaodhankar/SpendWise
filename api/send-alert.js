// Vercel API Route for sending email alerts
// This works with Resend email service

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, userEmail, data } = req.body;

  // Validate required fields
  if (!type || !userEmail || !data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ 
        error: 'RESEND_API_KEY not configured',
        message: 'Please add RESEND_API_KEY to your environment variables' 
      });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    let emailContent;
    
    switch (type) {
      case 'low_balance':
        emailContent = {
          from: 'SpendWise <onboarding@resend.dev>',
          to: [userEmail],
          subject: '⚠️ Low Balance Alert - SpendWise',
          html: generateLowBalanceEmail(data.balance)
        };
        break;
        
      case 'critical_balance':
        emailContent = {
          from: 'SpendWise <onboarding@resend.dev>',
          to: [userEmail],
          subject: '🚨 Critical Balance Alert - SpendWise',
          html: generateCriticalBalanceEmail(data.balance)
        };
        break;
        
      case 'daily_expense':
        emailContent = {
          from: 'SpendWise <onboarding@resend.dev>',
          to: [userEmail],
          subject: '📊 Daily Expense Alert - SpendWise',
          html: generateDailyExpenseEmail(data.totalExpenses)
        };
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid alert type' });
    }

    // Send email using Resend
    const result = await resend.emails.send(emailContent);
    
    res.status(200).json({ 
      success: true, 
      id: result.id,
      message: 'Email sent successfully' 
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}

// Email template functions
function generateLowBalanceEmail(balance) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Low Balance Alert - SpendWise</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">⚠️ SpendWise Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Balance Monitoring System</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #ff7043; margin-top: 0; font-size: 24px;">Low Balance Warning</h2>
          
          <!-- Balance Display -->
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff7043; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #333;">
              Your total balance: <strong style="color: #ff7043; font-size: 32px; display: block; margin-top: 10px;">₹${balance.toFixed(2)}</strong>
            </p>
          </div>

          <!-- Recommendations -->
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0; font-size: 18px;">💡 Recommendations:</h3>
            <ul style="color: #0c5460; margin: 10px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Review your recent expenses</li>
              <li style="margin-bottom: 8px;">Plan your budget for the coming days</li>
              <li style="margin-bottom: 8px;">Consider reducing discretionary spending</li>
              <li style="margin-bottom: 8px;">Set up spending alerts for better control</li>
            </ul>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" 
               style="background: #ff7043; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #e9ecef; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            This is an automated alert from SpendWise. Stay in control of your finances! 💰
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCriticalBalanceEmail(balance) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Critical Balance Alert - SpendWise</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🚨 Critical Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Immediate Attention Required</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #ff3838; margin-top: 0; font-size: 24px;">Critical Balance Alert</h2>
          
          <!-- Balance Display -->
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff3838; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #333;">
              Your total balance: <strong style="color: #ff3838; font-size: 32px; display: block; margin-top: 10px;">₹${balance.toFixed(2)}</strong>
            </p>
          </div>

          <!-- Critical Actions -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0; font-size: 18px;">🚨 Immediate Action Required:</h3>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Review and reduce unnecessary expenses</strong></li>
              <li style="margin-bottom: 8px;"><strong>Consider adding funds to your accounts</strong></li>
              <li style="margin-bottom: 8px;"><strong>Set up an emergency budget plan</strong></li>
              <li style="margin-bottom: 8px;"><strong>Avoid non-essential purchases</strong></li>
            </ul>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" 
               style="background: #ff3838; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Take Action Now
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #e9ecef; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            This is a critical alert from SpendWise. Please take immediate action! ⚠️
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDailyExpenseEmail(totalExpenses) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Expense Alert - SpendWise</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📊 Expense Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Daily Spending Monitoring</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #667eea; margin-top: 0; font-size: 24px;">Daily Expense Limit Exceeded</h2>
          
          <!-- Expense Display -->
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #333; text-align: center;">
              Today's expenses: <strong style="color: #667eea; font-size: 32px; display: block; margin-top: 10px;">₹${totalExpenses.toFixed(2)}</strong>
            </p>
            <p style="margin: 15px 0 0 0; color: #6c757d; text-align: center; font-size: 16px;">
              Daily limit: ₹2,000.00
            </p>
          </div>

          <!-- Budget Tips -->
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0; font-size: 18px;">💡 Budget Tips:</h3>
            <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Review today's transactions for unnecessary expenses</li>
              <li style="margin-bottom: 8px;">Consider postponing non-essential purchases</li>
              <li style="margin-bottom: 8px;">Set spending alerts for tomorrow</li>
              <li style="margin-bottom: 8px;">Track your weekly budget progress</li>
            </ul>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Review Today's Expenses
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #e9ecef; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Stay on track with your daily budget goals! 🎯
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}