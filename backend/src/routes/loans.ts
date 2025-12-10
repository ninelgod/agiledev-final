import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/loans?userId=:userId
 * Obtener todos los préstamos de un usuario
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId es requerido" });
        }

        const loans = await prisma.loan.findMany({
            where: {
                userId: parseInt(userId as string),
                isActive: true
            },
            include: {
                installments: {
                    orderBy: {
                        dueDate: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json({ loans });
    } catch (error) {
        console.error("Error fetching loans:", error);
        return res.status(500).json({ error: "Error al cargar préstamos" });
    }
});

/**
 * POST /api/loans
 * Crear un nuevo préstamo
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            userId,
            bankName,
            loanType,
            totalAmount,
            monthlyPayment,
            numberOfInstallments,
            paymentType,
            paymentFrequency,
            interestRate,
            startDate,
            endDate,
            loanCode,
            paidInstallments
        } = req.body;

        // Validaciones básicas
        if (!userId || !bankName || !loanType || !totalAmount || !monthlyPayment || !paymentType || !startDate || !endDate) {
            console.log('Missing fields:', { userId, bankName, loanType, totalAmount, monthlyPayment, paymentType, startDate, endDate });
            return res.status(400).json({ error: "Todos los campos requeridos deben estar presentes" });
        }

        // Calcular finalTotalAmount
        const numInstallments = parseInt(numberOfInstallments) || 1;
        const finalTotal = parseFloat(monthlyPayment) * numInstallments;

        // Crear el préstamo
        const loan = await prisma.loan.create({
            data: {
                userId: parseInt(userId),
                bankName,
                loanType,
                totalAmount: parseFloat(totalAmount),
                finalTotalAmount: finalTotal,
                monthlyPayment: parseFloat(monthlyPayment),
                paymentType,
                interestRate: interestRate ? parseFloat(interestRate) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                loanCode: loanCode || null,
                isActive: true
            }
        });

        // Generar cuotas automáticamente
        const installments = [];
        const start = new Date(startDate);
        let currentDate = new Date(start);
        const paidSet = new Set(paidInstallments || []);

        for (let i = 1; i <= numInstallments; i++) {
            let dueDate: Date;

            // Determinar la fecha de vencimiento según el tipo de pago
            if (paymentType.includes('Plazo fijo')) {
                // Extraer el día del mes del paymentType
                const dayMatch = paymentType.match(/día (\d+)/);
                const dueDay = dayMatch ? parseInt(dayMatch[1]) : 15;

                dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dueDay);

                if (dueDate < currentDate) {
                    dueDate.setMonth(dueDate.getMonth() + 1);
                }
                currentDate = new Date(dueDate);
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (paymentType.includes('días')) {
                // Extraer el intervalo de días del paymentType
                const daysMatch = paymentType.match(/cada (\d+) días/);
                const daysInterval = daysMatch ? parseInt(daysMatch[1]) : 30;

                dueDate = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + daysInterval);
            } else if (paymentType.includes('Fin de mes')) {
                dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                // Default: mensual
                dueDate = new Date(currentDate);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            installments.push({
                loanId: loan.id,
                installmentNumber: i,
                dueDate: dueDate,
                amount: parseFloat(monthlyPayment),
                isPaid: paidSet.has(i),
                paidDate: paidSet.has(i) ? new Date() : null
            });
        }

        // Crear todas las cuotas
        await prisma.installment.createMany({
            data: installments
        });

        // Obtener el préstamo con las cuotas
        const loanWithInstallments = await prisma.loan.findUnique({
            where: { id: loan.id },
            include: {
                installments: {
                    orderBy: {
                        dueDate: 'asc'
                    }
                }
            }
        });

        return res.status(201).json({ loan: loanWithInstallments });
    } catch (error) {
        console.error("Error creating loan:", error);
        return res.status(500).json({ error: "Error al crear préstamo" });
    }
});

/**
 * PUT /api/loans/:id
 * Actualizar un préstamo
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Convertir tipos si es necesario
        if (updateData.totalAmount) updateData.totalAmount = parseFloat(updateData.totalAmount);
        if (updateData.finalTotalAmount) updateData.finalTotalAmount = parseFloat(updateData.finalTotalAmount);
        if (updateData.monthlyPayment) updateData.monthlyPayment = parseFloat(updateData.monthlyPayment);
        if (updateData.interestRate) updateData.interestRate = parseFloat(updateData.interestRate);
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        const loan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                installments: true
            }
        });

        return res.json({ loan });
    } catch (error) {
        console.error("Error updating loan:", error);
        return res.status(500).json({ error: "Error al actualizar préstamo" });
    }
});

/**
 * DELETE /api/loans/:id
 * Eliminar un préstamo (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const loan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
        });

        return res.json({ message: "Préstamo eliminado exitosamente", loan });
    } catch (error) {
        console.error("Error deleting loan:", error);
        return res.status(500).json({ error: "Error al eliminar préstamo" });
    }
});

export default router;
