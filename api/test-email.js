// Simple test endpoint for email functionality
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ message: "userEmail is required" });
  }

  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        error: "RESEND_API_KEY not configured",
        message: "Please add RESEND_API_KEY to your environment variables",
      });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailContent = {
      from: "SpendWise <onboarding@resend.dev>",
      to: [userEmail],
      subject: "✅ Test Email - SpendWise",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Email Test Successful!</h2>
          <p>This is a test email from your SpendWise application.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Test Details:</strong><br>
            • Sent to: ${userEmail}<br>
            • Time: ${new Date().toLocaleString()}<br>
            • Status: Success ✅
          </div>
        </div>
      `,
    };

    const result = await resend.emails.send(emailContent);

    res.status(200).json({
      success: true,
      id: result.id,
      message: "Test email sent successfully",
      sentTo: userEmail,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
}
