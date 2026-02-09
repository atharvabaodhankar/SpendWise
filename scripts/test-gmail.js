
// scripts/test-gmail.js
// Usage: node scripts/test-gmail.js <email-address>

async function verifyEnv() {
  console.log('Checking environment variables...');
  try {
    const response = await fetch('http://localhost:3000/api/check-env');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Environment Status:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to check environment:', error.message);
    return null;
  }
}

async function sendTestEmail(email) {
  console.log(`\nSending test email to ${email}...`);
  try {
    const response = await fetch('http://localhost:3000/api/gmail-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail: email }),
    });

    const data = await response.json();
    
    if (response.ok) {
        console.log('✅ Success:', data);
    } else {
        console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Network/Server Error:', error.message);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/test-gmail.js <email-address>');
  console.log('Example: node scripts/test-gmail.js myemail@example.com');
  // Run env check anyway
  await verifyEnv();
} else {
  await verifyEnv();
  await sendTestEmail(email);
}
