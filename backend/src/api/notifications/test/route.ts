
import { type NextRequest, NextResponse } from 'next/server'
import { sendNotificationToUser } from '@/backend/lib/web-push'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    console.log('[API Tests] Test Notification Request Received')
    try {
        let body;
        try {
            body = await request.json()
            console.log('[API Tests] Body parsed:', body)
        } catch (e) {
            console.error('[API Tests] JSON parse failed', e)
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { userId } = body

        if (!userId) {
            console.error('[API Tests] Missing userId')
            return NextResponse.json({ error: 'UserID required' }, { status: 400 })
        }

        console.log(`[API Tests] Sending to userId: ${userId}`)
        const result = await sendNotificationToUser(Number(userId), {
            title: 'Prueba de Notificación',
            body: '¡Si lees esto, las notificaciones funcionan en este dispositivo!',
            url: '/dashboard'
        })
        console.log('[API Tests] Result from sendNotificationToUser:', result)

        if (!result.success) {
            console.warn('[API Tests] Send failed or no subs')
            return NextResponse.json({
                success: false,
                message: result.count === 0 ? 'No se encontró suscripción para este usuario en la BD.' : 'Error al enviar a los servicios Push.',
                details: result
            }, { status: 404 })
        }

        return NextResponse.json({ success: true, count: result.count })

    } catch (error: any) {
        console.error('[API Tests] Critical Error:', error)
        // Ensure we send a valid JSON response even on crash
        return NextResponse.json({
            error: 'Server error',
            details: error.message
        }, { status: 500 })
    }
}
