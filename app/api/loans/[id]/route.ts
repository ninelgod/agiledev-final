
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const loanId = Number.parseInt(params.id)

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    })

    if (!loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ loan })
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json({ error: "Error al obtener préstamo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const loanId = Number.parseInt(params.id)
    const body = await request.json()
    const { bankName, loanType, totalAmount, installmentAmount, numberOfInstallments, dueDay, startDate, endDate } =
      body

    if (
      !bankName ||
      !loanType ||
      !totalAmount ||
      !installmentAmount ||
      !numberOfInstallments ||
      !dueDay ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      return NextResponse.json(
        { error: "La fecha de finalización debe ser posterior a la fecha de inicio" },
        { status: 400 },
      )
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar cuotas existentes
      await tx.installment.deleteMany({
        where: { loanId: loanId }
      })

      // Actualizar préstamo
      await tx.loan.update({
        where: { id: loanId },
        data: {
          bankName,
          loanType,
          totalAmount: Number(totalAmount),
          monthlyPayment: Number(installmentAmount),
          // dueDay field doesn't exist in Loan model in schema.prisma viewed earlier?
          // Wait, let's double check schema in Step 99.
          // Schema: loanCode, bankName, loanType, totalAmount, finalTotalAmount, monthlyPayment, startDate, endDate, paymentType, interestRate, isActive, createdAt.
          // THERE IS NO dueDay in schema!
          // The existing code was doing `due_day = ${dueDay}` in SQL.
          // If the schema doesn't have it, SQL would fail if I ran migration.
          // Maybe the user's DB has it but schema.prisma is out of sync?
          // OR the existing code was broken/legacy?
          // Step 99 schema definitely does NOT have `dueDay`.
          // I will ignore `dueDay` update to match Schema.
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      })

      // Generar nuevas cuotas
      let currentDate = new Date(start.getFullYear(), start.getMonth(), dueDay)

      if (currentDate < start) {
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      for (let i = 1; i <= numberOfInstallments; i++) {
        if (currentDate > end) break

        const dueDate = new Date(currentDate)

        await tx.installment.create({
          data: {
            loanId: loanId,
            installmentNumber: i,
            dueDate: dueDate,
            amount: Number(installmentAmount),
            isPaid: false
          }
        })

        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dueDay)
      }
    })

    const updatedLoan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { installments: { orderBy: { installmentNumber: 'asc' } } }
    })

    return NextResponse.json({ loan: updatedLoan })

  } catch (error) {
    console.error("Error updating loan:", error)
    return NextResponse.json({ error: "Error al actualizar préstamo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const loanId = Number.parseInt(params.id)

    await prisma.loan.delete({
      where: { id: loanId }
    })

    return NextResponse.json({ message: "Préstamo eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting loan:", error)
    return NextResponse.json({ error: "Error al eliminar préstamo" }, { status: 500 })
  }
}
