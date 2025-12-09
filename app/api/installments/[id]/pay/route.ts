
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const installmentId = parseInt(params.id)
        const { paymentMethod, notes } = await request.json()

        if (isNaN(installmentId)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 })
        }

        // Use transaction to ensure atomicity
        // Agregamos ": any" para que TypeScript no se queje
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Get installment
            const installment = await tx.installment.findUnique({
                where: { id: installmentId }
            })

            if (!installment) {
                throw new Error("Cuota no encontrada")
            }

            if (installment.isPaid) {
                throw new Error("Esta cuota ya está pagada")
            }

            // 2. Mark as paid
            const paymentDate = new Date()
            await tx.installment.update({
                where: { id: installmentId },
                data: {
                    isPaid: true,
                    paidDate: paymentDate
                }
            })

            // 3. Create payment record
            const paymentNote = `Pago de cuota #${installment.installmentNumber}. Método: ${paymentMethod || 'No especificado'}. ${notes || ''}`

            await tx.payment.create({
                data: {
                    loanId: installment.loanId,
                    amount: installment.amount,
                    paymentDate: paymentDate,
                    paymentMonth: installment.dueDate, // using due date as reference for month
                    notes: paymentNote
                }
            })

            return installment
        })

        console.log(`[PAYMENT] Installment ${installmentId} paid. Amount: ${result.amount}`)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Error processing payment:", error)
        if (error.message === "Cuota no encontrada") {
            return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 })
        }
        if (error.message === "Esta cuota ya está pagada") {
            return NextResponse.json({ error: "Esta cuota ya está pagada" }, { status: 400 })
        }
        return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 })
    }
}
