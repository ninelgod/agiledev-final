
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSMS } from "@/lib/sms"

export async function GET(request: NextRequest) {
    try {
        console.log("[CRON] Checking for due debts...")

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayStr = today.toISOString().split("T")[0]
        const checkDate = new Date(todayStr)

        const dueInstallments = await prisma.installment.findMany({
            where: {
                dueDate: {
                    equals: checkDate
                },
                isPaid: false,
                loan: {
                    isActive: true,
                    user: {
                        notificationsEnabled: true,
                        phoneNumber: { not: null }
                    }
                }
            },
            include: {
                loan: {
                    include: {
                        user: true
                    }
                }
            }
        })

        console.log(`[CRON] Found ${dueInstallments.length} installments due today.`)

        const notificationsSent = []

        for (const installment of dueInstallments) {
            const user = installment.loan.user
            if (user.phoneNumber) {
                const message = `Hola ${user.username}, hoy vence tu cuota de ${installment.loan.bankName} por S/ ${installment.amount}.`
                const result = await sendSMS(user.phoneNumber, message)
                console.log(`[SMS] Result for ${user.username}:`, result)

                notificationsSent.push({
                    user: user.username,
                    phone: user.phoneNumber,
                    message: message,
                    status: result.success ? "SENT" : "FAILED",
                    error: result.error
                })
            }
        }

        return NextResponse.json({
            success: true,
            processed: dueInstallments.length,
            notifications: notificationsSent
        })

    } catch (error) {
        console.error("[CRON] Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
