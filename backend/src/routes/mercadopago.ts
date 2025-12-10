import { Router, type Request, type Response } from 'express';
import { Payment, Preference } from 'mercadopago';
import { client } from '../lib/mercadopago';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/mercadopago/create-preference
 * Crea una preferencia de pago
 */
router.post('/create-preference', async (req: Request, res: Response) => {
    try {
        const { items, back_urls, auto_return, external_reference } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items son requeridos' });
        }

        const preference = new Preference(client);

        const preferenceData: any = {
            items,
            back_urls,
            auto_return,
        };

        if (external_reference) {
            preferenceData.external_reference = external_reference;
        }

        const response = await preference.create({ body: preferenceData });

        return res.json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point,
            preference_id: response.id
        });

    } catch (error: any) {
        console.error('❌ Error creando preferencia:', error);
        return res.status(500).json({
            error: 'Error al crear la preferencia',
            details: error.message
        });
    }
});

/**
 * POST /api/mercadopago/process_payment
 * Procesa un pago directo del Brick
 */
router.post('/process_payment', async (req: Request, res: Response) => {
    try {
        const { transaction_amount, token, description, installments, payment_method_id, issuer_id, payer, external_reference } = req.body;

        const payment = new Payment(client);

        const paymentData = {
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
        };

        console.log('💳 Processing Brick Payment:', external_reference);

        const result = await payment.create({ body: paymentData });
        const { status, status_detail, id } = result;

        console.log('✅ Payment Status:', status);

        if (status === 'approved' && external_reference) {
            const installmentId = Number(external_reference);

            try {
                await prisma.installment.update({
                    where: { id: installmentId },
                    data: {
                        isPaid: true,
                        paidDate: new Date(),
                    }
                });

                const installment = await prisma.installment.findUnique({
                    where: { id: installmentId },
                    select: { loanId: true }
                });

                if (installment) {
                    const pending = await prisma.installment.count({
                        where: { loanId: installment.loanId, isPaid: false }
                    });

                    if (pending === 0) {
                        await prisma.loan.update({
                            where: { id: installment.loanId },
                            data: { isActive: false }
                        });
                        console.log('🎉 Loan fully paid!');
                    }
                }

            } catch (dbError) {
                console.error('❌ DB update error:', dbError);
            }
        }

        return res.status(201).json({ id, status, status_detail });

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
