
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
    }

    const loans = await prisma.loan.findMany({
      where: {
        userId: Number(userId),
        isActive: true
      },
      include: {
        installments: {
          where: { isPaid: false },
          orderBy: { dueDate: 'asc' },
          take: 1
        }
      },
      orderBy: { paymentType: 'asc' }
    })

    console.log("[v0] Préstamos encontrados:", loans.length)

    return NextResponse.json({ loans })
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      loanCode,
      bankName,
      loanType,
      totalAmount,
      installmentAmount,
      numberOfInstallments,
      paymentType,
      interestRate,
      startDate,
      endDate,
    } = body

    if (
      !userId ||
      !bankName ||
      !loanType ||
      !totalAmount ||
      !installmentAmount ||
      !numberOfInstallments ||
      !paymentType ||
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

    console.log("[v0] Creando préstamo con", numberOfInstallments, "cuotas")

    const finalTotalAmount = Number(installmentAmount) * Number(numberOfInstallments)

    // Crear el préstamo y cuotas en transacción
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          userId: Number(userId),
          loanCode,
          bankName,
          loanType,
          totalAmount: Number(totalAmount),
          finalTotalAmount: Number(finalTotalAmount),
          monthlyPayment: Number(installmentAmount),
          paymentType,
          interestRate: Number(interestRate),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: true
        }
      })

      // Crear cuotas
      let currentDate = new Date(start)
      for (let i = 1; i <= numberOfInstallments; i++) {
        if (currentDate > end) break

        let dueDate: Date

        if (paymentType.includes("Plazo fijo")) {
          const match = paymentType.match(/día (\d+)/);
          const dueDay = match ? parseInt(match[1]) : 15;
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dueDay);
          if (dueDate < currentDate) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }
          currentDate = new Date(dueDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (paymentType.includes("Plazo de acuerdo a días")) {
          const match = paymentType.match(/cada (\d+) días/);
          const daysInterval = match ? parseInt(match[1]) : 30;
          dueDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + daysInterval);
        } else if (paymentType === "Fin de mes") {
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          dueDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        await tx.installment.create({
          data: {
            loanId: newLoan.id,
            installmentNumber: i,
            dueDate: dueDate,
            amount: Number(installmentAmount),
            isPaid: false
          }
        })
      }

      return newLoan
    })

    console.log("[v0] Préstamo creado con ID:", loan.id)

    const loanWithInstallments = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    })

    return NextResponse.json({ loan: loanWithInstallments })
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json({ error: "Error al crear préstamo" }, { status: 500 })
  }
}
