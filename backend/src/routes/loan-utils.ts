import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/loans/:id/generate-installments
 * Generar cuotas para un préstamo existente que no tiene cuotas
 */
router.post('/:id/generate-installments', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { numberOfInstallments } = req.body;

        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(id) },
            include: { installments: true }
        });

        if (!loan) {
            return res.status(404).json({ error: "Préstamo no encontrado" });
        }

        if (loan.installments.length > 0) {
            return res.status(400).json({ error: "El préstamo ya tiene cuotas generadas" });
        }

        // Generar cuotas
        const installments = [];
        const start = new Date(loan.startDate);
        let currentDate = new Date(start);
        const numInstallments = numberOfInstallments || 12;

        for (let i = 1; i <= numInstallments; i++) {
            let dueDate: Date;

            // Determinar la fecha de vencimiento según el tipo de pago
            if (loan.paymentType.includes('Plazo fijo')) {
                const dayMatch = loan.paymentType.match(/día (\d+)/);
                const dueDay = dayMatch ? parseInt(dayMatch[1]) : 15;

                dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dueDay);

                if (dueDate < currentDate) {
                    dueDate.setMonth(dueDate.getMonth() + 1);
                }
                currentDate = new Date(dueDate);
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (loan.paymentType.includes('días')) {
                const daysMatch = loan.paymentType.match(/cada (\d+) días/);
                const daysInterval = daysMatch ? parseInt(daysMatch[1]) : 30;

                dueDate = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + daysInterval);
            } else if (loan.paymentType.includes('Fin de mes')) {
                dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                dueDate = new Date(currentDate);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            installments.push({
                loanId: loan.id,
                installmentNumber: i,
                dueDate: dueDate,
                amount: loan.monthlyPayment,
                isPaid: false,
                paidDate: null
            });
        }

        await prisma.installment.createMany({
            data: installments
        });

        const updatedLoan = await prisma.loan.findUnique({
            where: { id: loan.id },
            include: {
                installments: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        });

        return res.json({
            message: `${installments.length} cuotas generadas exitosamente`,
            loan: updatedLoan
        });
    } catch (error) {
        console.error("Error generating installments:", error);
        return res.status(500).json({ error: "Error al generar cuotas" });
    }
});

export default router;
