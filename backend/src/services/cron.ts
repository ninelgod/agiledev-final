import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import webpush from '../lib/web-push';

const prisma = new PrismaClient();

// Function to check due debts and send notifications
export const checkDueDebts = async () => {
    console.log('⏰ Running daily check for due debts...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find installments due TODAY or TOMORROW
        const dueInstallments = await prisma.installment.findMany({
            where: {
                dueDate: {
                    gte: today,
                    lt: tomorrow
                },
                isPaid: false, // Changed from status: 'PENDING'
                loan: {
                    user: {
                        pushSubscriptions: {
                            some: {} // Only fetch if user has active subs
                        }
                    }
                }
            },
            include: {
                loan: {
                    include: {
                        user: {
                            include: {
                                pushSubscriptions: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`📋 Found ${dueInstallments.length} installments due soon.`);

        for (const installment of dueInstallments) {
            const user = installment.loan.user;
            if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) continue;

            const payload = JSON.stringify({
                title: '📅 Recordatorio de Pago',
                body: `Hola ${user.username}, tu cuota #${installment.installmentNumber} de S/ ${installment.amount} vence hoy.`,
                icon: '/icon.png'
            });

            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    }, payload);
                    console.log(`✅ Notification sent to user ${user.id}`);
                } catch (error: any) {
                    console.error(`⚠️ Failed to send to user ${user.id}:`, error.statusCode);
                    // Cleanup dead subscriptions
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error in cron job:', error);
    }
};

// Schedule the task
// Run every day at 9:00 AM
export const startCronJobs = () => {
    cron.schedule('0 9 * * *', () => {
        checkDueDebts();
    });
    console.log('✅ Cron jobs scheduled (Daily at 9:00 AM)');
};
