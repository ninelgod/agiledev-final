import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/installments?loanId=:loanId
 * Obtener todas las cuotas de un préstamo
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { loanId, userId } = req.query;

        if (loanId) {
            const installments = await prisma.installment.findMany({
                where: {
                    loanId: parseInt(loanId as string)
                },
                orderBy: {
                    dueDate: 'asc'
                }
            });
            return res.json({ installments });
        } else if (userId) {
            // Find all installments for all loans belonging to this user
            const installments = await prisma.installment.findMany({
                where: {
                    loan: {
                        userId: parseInt(userId as string),
                        isActive: true
                    }
                },
                include: {
                    loan: {
                        select: {
                            bankName: true,
                            loanType: true,
                            monthlyPayment: true,
                            totalAmount: true
                        }
                    }
                },
                orderBy: {
                    dueDate: 'asc'
                }
            });
            return res.json({ installments });
        } else {
            return res.status(400).json({ error: "loanId o userId es requerido" });
        }
    } catch (error) {
        console.error("Error fetching installments:", error);
        return res.status(500).json({ error: "Error al cargar cuotas" });
    }
});

/**
 * POST /api/installments
 * Crear una nueva cuota
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            loanId,
            installmentNumber,
            dueDate,
            amount,
            isPaid,
            paidDate,
            lateFee,
            notes
        } = req.body;

        if (!loanId || !installmentNumber || !dueDate || !amount) {
            return res.status(400).json({ error: "Campos requeridos faltantes" });
        }

        const installment = await prisma.installment.create({
            data: {
                loanId: parseInt(loanId),
                installmentNumber: parseInt(installmentNumber),
                dueDate: new Date(dueDate),
                amount: parseFloat(amount),
                isPaid: isPaid || false,
                paidDate: paidDate ? new Date(paidDate) : null,
                lateFee: lateFee ? parseFloat(lateFee) : null,
                notes: notes || null
            }
        });

        return res.status(201).json({ installment });
    } catch (error) {
        console.error("Error creating installment:", error);
        return res.status(500).json({ error: "Error al crear cuota" });
    }
});

/**
 * PUT /api/installments/:id
 * Actualizar una cuota (marcar como pagada, agregar mora, etc.)
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Convertir tipos si es necesario
        if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
        if (updateData.lateFee) updateData.lateFee = parseFloat(updateData.lateFee);
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
        if (updateData.paidDate) updateData.paidDate = new Date(updateData.paidDate);

        const installment = await prisma.installment.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return res.json({ installment });
    } catch (error) {
        console.error("Error updating installment:", error);
        return res.status(500).json({ error: "Error al actualizar cuota" });
    }
});

/**
 * POST /api/installments/:id/pay
 * Marcar una cuota como pagada
 */
router.post('/:id/pay', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { lateFee } = req.body;

        const installment = await prisma.installment.update({
            where: { id: parseInt(id) },
            data: {
                isPaid: true,
                paidDate: new Date(),
                lateFee: lateFee ? parseFloat(lateFee) : null
            }
        });

        return res.json({ installment });
    } catch (error) {
        console.error("Error marking installment as paid:", error);
        return res.status(500).json({ error: "Error al marcar cuota como pagada" });
    }
});

export default router;
