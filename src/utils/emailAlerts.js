// Email alert thresholds
const ALERT_THRESHOLDS = {
  LOW_BALANCE: 1000,
  CRITICAL_BALANCE: 500,
  DAILY_EXPENSE_LIMIT: 2000,
  WEEKLY_EXPENSE_LIMIT: 10000
};

// Send email alert via Vercel API route
const sendEmailAlert = async (type, userEmail, data) => {
  try {
    const response = await fetch('/api/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        userEmail,
        data
      })
    });

    if (response.ok) {
      console.log(`${type} email alert sent successfully to ${userEmail}`);
    } else {
      console.error('Failed to send email alert:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
};

// Check if user should receive balance alert
export const checkBalanceAlert = async (userEmail, currentBalances, previousBalances) => {
  const currentTotal = (currentBalances.online || 0) + (currentBalances.cash || 0);
  const previousTotal = (previousBalances?.online || 0) + (previousBalances?.cash || 0);

  // Low balance alert (crossed threshold)
  if (currentTotal < ALERT_THRESHOLDS.LOW_BALANCE && previousTotal >= ALERT_THRESHOLDS.LOW_BALANCE) {
    await sendEmailAlert('low_balance', userEmail, { balance: currentTotal });
  }

  // Critical balance alert
  if (currentTotal < ALERT_THRESHOLDS.CRITICAL_BALANCE && previousTotal >= ALERT_THRESHOLDS.CRITICAL_BALANCE) {
    await sendEmailAlert('critical_balance', userEmail, { balance: currentTotal });
  }
};

// Check daily expense limits
export const checkDailyExpenseAlert = async (userEmail, todayExpenses) => {
  if (todayExpenses > ALERT_THRESHOLDS.DAILY_EXPENSE_LIMIT) {
    await sendEmailAlert('daily_expense', userEmail, { totalExpenses: todayExpenses });
  }
};

// Send balance alert email
const sendBalanceAlert = async (userEmail, balance, type) => {
  const isLow = type === 'low';
  const isCritical = type === 'critical';

  const emailData = {
    to: [userEmail],
    message: {
      subject: `${isCritical ? '🚨 Critical' : '⚠️ Low'} Balance Alert - SpendWise`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: ${isCritical ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)'}; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${isCritical ? '🚨' : '⚠️'} SpendWise Alert</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Balance Monitoring System</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: ${isCritical ? '#ff3838' : '#ff7043'}; margin-top: 0;">
              ${isCritical ? 'Critical Balance Alert' : 'Low Balance Warning'}
            </h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${isCritical ? '#ff3838' : '#ff7043'}; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">
                Your total balance: <strong style="color: ${isCritical ? '#ff3838' : '#ff7043'}; font-size: 24px;">₹${balance.toFixed(2)}</strong>
              </p>
            </div>

            ${isCritical ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">🚨 Immediate Action Required:</h3>
                <ul style="color: #856404; margin: 10px 0;">
                  <li>Review and reduce unnecessary expenses</li>
                  <li>Consider adding funds to your accounts</li>
                  <li>Set up an emergency budget plan</li>
                  <li>Avoid non-essential purchases</li>
                </ul>
              </div>
            ` : `
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0c5460; margin-top: 0;">💡 Recommendations:</h3>
                <ul style="color: #0c5460; margin: 10px 0;">
                  <li>Review your recent expenses</li>
                  <li>Plan your budget for the coming days</li>
                  <li>Consider reducing discretionary spending</li>
                </ul>
              </div>
            `}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${window.location.origin}" 
                 style="background: ${isCritical ? '#ff3838' : '#ff7043'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: all 0.3s;">
                ${isCritical ? 'Take Action Now' : 'View Dashboard'}
              </a>
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              This is an automated alert from SpendWise. Stay in control of your finances! 💰
            </p>
          </div>
        </div>
      `
    }
  };

  try {
    await addDoc(collection(db, 'mail'), emailData);
    console.log('Balance alert email queued successfully');
  } catch (error) {
    console.error('Error sending balance alert:', error);
  }
};

// Send daily expense alert
const sendDailyExpenseAlert = async (userEmail, totalExpenses) => {
  const emailData = {
    to: [userEmail],
    message: {
      subject: '📊 Daily Expense Limit Exceeded - SpendWise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 SpendWise Alert</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Daily Expense Monitoring</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #667eea; margin-top: 0;">Daily Expense Limit Exceeded</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">
                Today's expenses: <strong style="color: #667eea; font-size: 24px;">₹${totalExpenses.toFixed(2)}</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #6c757d;">
                Daily limit: ₹${ALERT_THRESHOLDS.DAILY_EXPENSE_LIMIT.toFixed(2)}
              </p>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">💡 Budget Tips:</h3>
              <ul style="color: #155724; margin: 10px 0;">
                <li>Review today's transactions for any unnecessary expenses</li>
                <li>Consider postponing non-essential purchases</li>
                <li>Set spending alerts for tomorrow</li>
                <li>Track your weekly budget progress</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${window.location.origin}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Review Today's Expenses
              </a>
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              Stay on track with your daily budget goals! 🎯
            </p>
          </div>
        </div>
      `
    }
  };

  try {
    await addDoc(collection(db, 'mail'), emailData);
    console.log('Daily expense alert email queued successfully');
  } catch (error) {
    console.error('Error sending daily expense alert:', error);
  }
};

// Send weekly summary email
export const sendWeeklySummary = async (userEmail, weeklyData) => {
  const { totalExpenses, categoryBreakdown, averageDaily, balance } = weeklyData;

  const emailData = {
    to: [userEmail],
    message: {
      subject: '📈 Weekly Expense Summary - SpendWise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">📈 Weekly Summary</h1>
            <p style="color: white; opacity: 0.9;">Your spending insights</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2>This Week's Overview</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #4facfe; margin-top: 0;">Total Spent</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">₹${totalExpenses.toFixed(2)}</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #4facfe; margin-top: 0;">Daily Average</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">₹${averageDaily.toFixed(2)}</p>
              </div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Top Categories</h3>
              ${Object.entries(categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([category, amount]) => `
                  <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span>${category}</span>
                    <strong>₹${amount.toFixed(2)}</strong>
                  </div>
                `).join('')}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${window.location.origin}" 
                 style="background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Detailed Analytics
              </a>
            </div>
          </div>
        </div>
      `
    }
  };

  try {
    await addDoc(collection(db, 'mail'), emailData);
    console.log('Weekly summary email queued successfully');
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
};

export { ALERT_THRESHOLDS };