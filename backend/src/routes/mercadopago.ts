import { Router, type Request, type Response } from 'express';
import { Payment, Preference } from 'mercadopago';
import { client } from '../lib/mercadopago';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/mercadopago/create-preference
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
 */
router.post('/process_payment', async (req: Request, res: Response) => {
    try {

        // LOG 1 — Ver lo que llega crudo desde el frontend
        console.log("📥 [RAW BODY RECEIVED]:", req.body);

        const {
            transaction_amount,
            token,
            description,
            installments,
            payment_method_id,
            issuer_id,
            payer,
            external_reference
        } = req.body;

        // LOG 2 — Ver exacto cómo llega el amount
        console.log("💲 RAW transaction_amount:", transaction_amount, "typeof:", typeof transaction_amount);

        // Normalizar y validar amount
        const amount = Number(String(transaction_amount).replace(',', '.').trim());

        if (isNaN(amount) || amount <= 0) {
            console.log("❌ Invalid amount after parsing:", amount);
            return res.status(400).json({
                error: 'transaction_amount inválido',
                received: transaction_amount
            });
        }

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'token requerido' });
        }
        if (!payment_method_id || !installments) {
            return res.status(400).json({ error: 'payment_method_id e installments requeridos' });
        }
        if (!payer || !payer.email || !payer.identification || !payer.identification.number) {
            return res.status(400).json({ error: 'payer incompleto' });
        }

        const idNumber = String(payer.identification.number).replace(/\D/g, '');

        const paymentData = {
            body: {
                transaction_amount: Math.round(amount * 100) / 100,
                token,
                description,
                installments: Number(installments),
                payment_method_id,
                issuer_id,
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification.type,
                        number: idNumber
                    }
                },
                external_reference
            }
        };

        // LOG 3 — ver lo que se enviará a MP (sin token real)
        console.log('📤 [SERVER → MP] paymentData:', {
            ...paymentData.body,
            token: token ? '[PROTECTED]' : null
        });

        const payment = new Payment(client);
        const result = await payment.create(paymentData);

        // LOG 4 — ver la respuesta completa de MercadoPago
        console.log('✅ [MP RESPONSE]:', result);

        /**
         * Aquí sigue tu lógica de actualizar BD si está aprobado
         * (lo mantengo igual)
         */

        return res.status(201).json({
            id: result.id,
            status: result.status,
            status_detail: result.status_detail
        });

    } catch (err: any) {

        // LOG 5 — error ultra detallado
        console.error('❌ [ERROR PROCESSING PAYMENT]:', {
            message: err.message,
            stack: err.stack,
            response: err.response ? err.response.data : null
        });

        return res.status(500).json({
            error: 'Error al procesar el pago',
            details: err.message,
            mp_error: err.response ? err.response.data : null
        });
    }
});

export default router;
