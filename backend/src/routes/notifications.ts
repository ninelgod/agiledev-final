import { Router, type Request, type Response } from 'express';
import webpush from '../lib/web-push';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/notifications/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
    try {
        const { subscription, userId } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        console.log(`🔔 Registering push subscription for user ${userId}`);

        // Save to DB (Update or Create logic might be needed depending on schema)
        // Check if subscription already exists for this endpoint
        const existing = await prisma.pushSubscription.findFirst({
            where: {
                endpoint: subscription.endpoint,
                userId: Number(userId)
            }
        });

        if (!existing) {
            await prisma.pushSubscription.create({
                data: {
                    userId: Number(userId),
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            });
            console.log('✅ Subscription saved to DB');
        } else {
            console.log('ℹ️ Subscription already exists');
        }

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('❌ Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// POST /api/notifications/test
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        console.log(`🧪 Sending test notification to user ${userId}`);

        // Get all subscriptions for user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: Number(userId) }
        });

        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No active subscriptions found for this user.' });
        }

        const payload = JSON.stringify({
            title: '¡Prueba Exitosa! 🚀',
            body: 'Las notificaciones push están funcionando correctamente en este dispositivo.',
            icon: '/icon.png' // Ensure this icon exists or use generic
        });

        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload);
                return { success: true, id: sub.id };
            } catch (err: any) {
                console.error(`⚠️ Failed to send to sub ${sub.id}:`, err.statusCode);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription is gone, delete it
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    return { success: false, id: sub.id, error: 'Expired' };
                }
                return { success: false, id: sub.id, error: err.message };
            }
        }));

        const successCount = results.filter(r => r.success).length;

        if (successCount > 0) {
            return res.json({ message: `Sent to ${successCount} devices.` });
        } else {
            return res.status(500).json({ error: 'Failed to send to any device.', details: results });
        }

    } catch (error: any) {
        console.error('❌ Error sending test notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
