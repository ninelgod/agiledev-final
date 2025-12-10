import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Ensure keys are available
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
    console.warn('⚠️ VAPID keys are missing in .env. Push notifications will not work.');
} else {
    webpush.setVapidDetails(
        'mailto:admin@example.com',
        publicKey,
        privateKey
    );
}

export default webpush;
