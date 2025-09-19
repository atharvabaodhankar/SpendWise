// Test email endpoint - you can delete this after testing
const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'SpendWise <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 SpendWise Email Test - Success!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; color: white;">
            <h1 style="margin: 0;">🎉 Email Test Successful!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your SpendWise email alerts are working perfectly!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">✅ Everything is Set Up!</h2>
            <p>Your SpendWise app can now send:</p>
            <ul>
              <li>⚠️ Low balance alerts (₹1000 threshold)</li>
              <li>🚨 Critical balance alerts (₹500 threshold)</li>
              <li>📊 Daily expense alerts (₹2000 threshold)</li>
            </ul>
            <p><strong>You can now delete the test-email.js file and start using your app!</strong></p>
          </div>
        </div>
      `
    });

    res.status(200).json({ 
      success: true, 
      id: result.id,
      message: 'Test email sent successfully!' 
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
}