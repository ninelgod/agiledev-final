import { Router, type Request, type Response } from 'express';
import { Payment } from 'mercadopago';
import { Preference, client } from '../lib/mercadopago';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/mercadopago/create-preference
 * Crea una preferencia de pago en MercadoPago (Modelo Redirect - Billetera)
 */
router.post('/create-preference', async (req: Request, res: Response) => {
    try {
        const { items, back_urls, auto_return, external_reference } = req.body;

        // Validar que items exista y tenga al menos un elemento
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items son requeridos' });
        }

        const preference = new Preference(client);

        const preferenceData: any = {
            body: {
                items: items,
                back_urls: back_urls,
                auto_return: auto_return,
            }
        };

        // Agregar referencia externa si se proporciona
        if (external_reference) {
            preferenceData.body.external_reference = external_reference;
        }

        const response = await preference.create(preferenceData);

        return res.json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point,
            preference_id: response.id
        });

    } catch (error: any) {
        return res.status(500).json({
            error: 'Error al crear la preferencia de pago',
            details: error.message
        });
    }
});

/**
 * POST /api/mercadopago/process_payment
 * Procesa un pago directo (Brick) y actualiza la BD
 */
router.post('/process_payment', async (req: Request, res: Response) => {
    try {
        const { transaction_amount, token, description, installments, payment_method_id, issuer_id, payer, external_reference } = req.body;

        const payment = new Payment(client);

        const paymentData = {
            body: {
                transaction_amount: Number(transaction_amount),
                token,
                description,
                installments: Number(installments),
                payment_method_id,
                issuer_id,
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification.type,
                        number: payer.identification.number
                    }
                },
                external_reference
            }
        };

        console.log('💳 Processing Brick Payment for installment:', external_reference);

        const result = await payment.create(paymentData);
        const { status, status_detail, id } = result;

        console.log('✅ Payment Status:', status);

        if (status === 'approved' && external_reference) {
            // Actualizar BD inmediatamente
            try {
                const installmentId = Number(external_reference);
                await prisma.installment.update({
                    where: { id: installmentId },
                    data: {
                        isPaid: true,
                        // Usamos paidDate según schema.prisma
                        paidDate: new Date(),
                    }
                });

                // Verificar si el préstamo está completamente pagado
                const installment = await prisma.installment.findUnique({
                    where: { id: installmentId },
                    select: { loanId: true }
                });

                if (installment) {
                    const loanId = installment.loanId;
                    const pendingInstallments = await prisma.installment.count({
                        where: {
                            loanId: loanId,
                            isPaid: false
                        }
                    });

                    if (pendingInstallments === 0) {
                        // El préstamo se completa. 
                        // Usamos isActive: false para "cerrarlo", ya que no hay campo status.
                        await prisma.loan.update({
                            where: { id: loanId },
                            data: { isActive: false }
                        });
                        console.log('🎉 Loan fully paid and archived!');
                    }
                }

                console.log('💾 Database updated for installment:', installmentId);
            } catch (dbError) {
                console.error('❌ Error updating DB after payment:', dbError);
                // No fallamos la request principal porque el pago financiero fue exitoso
            }
        }

        return res.status(201).json({
            id,
            status,
            status_detail
        });

    } catch (error: any) {
        console.error('❌ Error processing payment:', error);
        return res.status(500).json({
            error: 'Error al procesar el pago',
            details: error.message,
            mp_error: error.response ? error.response.data : null
        });
    }
});

export default router;
