// Check if environment variables are set
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const envCheck = {
      GMAIL_USER: process.env.GMAIL_USER ? 'Set ✅' : 'Missing ❌',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'Set ✅' : 'Missing ❌',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set ✅' : 'Missing ❌'
    };

    res.status(200).json({ 
      message: 'Environment variables check',
      variables: envCheck
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check environment variables',
      details: error.message 
    });
  }
}