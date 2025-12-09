
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';

// Manual .env parsing to avoid 'dotenv' dependency if not installed
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        value = value.trim().replace(/^["'](.*)["']$/, '$1');
        env[key.trim()] = value;
    }
});

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const fromNumber = env.TWILIO_PHONE_NUMBER;

console.log('--- Twilio Configuration Check ---');
console.log(`Account SID: ${accountSid ? (accountSid.substring(0, 6) + '...') : 'MISSING'}`);
console.log(`Auth Token: ${authToken ? 'PRESENT' : 'MISSING'}`);
console.log(`From Number: ${fromNumber || 'MISSING'}`);

if (!accountSid || !authToken || !fromNumber) {
    console.error('ERROR: Missing credentials in .env');
    process.exit(1);
}

const client = twilio(accountSid, authToken);
const to = '+15157177998'; // User's number from previous turn

console.log(`\nAttempting to send test SMS to ${to}...`);

client.messages.create({
    body: 'Test SMS from your Debt Management System',
    from: fromNumber,
    to: to,
})
    .then(message => {
        console.log('SUCCESS! Message sent.');
        console.log(`SID: ${message.sid}`);
    })
    .catch(error => {
        console.error('FAILED to send message.');
        console.error('Error Code:', error.code);
        console.error('Message:', error.message);

        if (error.code === 21608) {
            console.log('\nTIP: This is a "Verified Caller ID" error. On a Trial account, you can ONLY send to numbers you have verified in the Twilio Console.');
        }
    });
