import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { subscription, userId } = await request.json()

        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Subscription and User ID required' }, { status: 400 })
        }

        // Check if subscription already exists for this user
        const existing = await prisma.pushSubscription.findFirst({
            where: {
                userId: Number(userId),
                endpoint: subscription.endpoint
            }
        })

        if (existing) {
            return NextResponse.json({ message: 'Subscription already exists' })
        }

        await prisma.pushSubscription.create({
            data: {
                userId: Number(userId),
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        })

        return NextResponse.json({ message: 'Subscription saved successfully' })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return NextResponse.json({ error: 'Error saving subscription' }, { status: 500 })
    }
}
