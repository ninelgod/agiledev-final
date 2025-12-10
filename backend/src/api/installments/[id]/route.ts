
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/backend/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { isPaid, lateFee, notes } = body
    const installmentId = Number.parseInt(params.id)

    const dataToUpdate: any = {}

    if (isPaid !== undefined) {
      dataToUpdate.isPaid = isPaid
      dataToUpdate.paidDate = isPaid ? new Date() : null
    }

    if (lateFee !== undefined) {
      dataToUpdate.lateFee = Number(lateFee)
    }

    if (notes !== undefined) {
      dataToUpdate.notes = notes
    }

    const installment = await prisma.installment.update({
      where: { id: installmentId },
      data: dataToUpdate
    })

    console.log("[v0] Cuota actualizada:", installmentId, { isPaid, lateFee, notes })

    return NextResponse.json({ installment })
  } catch (error) {
    console.error("Error updating installment:", error)
    return NextResponse.json({ error: "Error al actualizar cuota" }, { status: 500 })
  }
}
