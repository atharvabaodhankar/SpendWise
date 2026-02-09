
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Usage: node scripts/direct-test.js <email-address>");
  process.exit(1);
}

const mailOptions = {
  from: `"Direct Test" <${process.env.GMAIL_USER}>`,
  to: userEmail,
  subject: 'SMTP Direct Test',
  text: 'If you receive this, your Gmail SMTP credentials are correct!'
};

console.log(`Attempting to send email to ${userEmail} using ${process.env.GMAIL_USER}...`);

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
} catch (error) {
  console.error('❌ Error sending email:', error.message);
  if (error.message.includes('Invalid login')) {
    console.log('\nTIP: Make sure you are using an "App Password" from Google, not your regular password.');
    console.log('Go to: https://myaccount.google.com/apppasswords');
  }
}
