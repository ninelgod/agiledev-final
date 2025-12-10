'use client';

import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';

// Componente para el botón de pago de MercadoPago (Payment Brick)
export function MercadoPagoButton({
    amount,
    description,
    externalReference,
    onSuccess,
    onError
}: {
    amount: number;
    description: string;
    externalReference?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}) {
    const [initialized, setInitialized] = useState(false);

    // Inicializar MercadoPago SDK
    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (publicKey && !initialized) {
            initMercadoPago(publicKey);
            setInitialized(true);
        }
    }, [initialized]);

    if (!initialized) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Cargando pasarela...</span>
            </div>
        );
    }

    const customization = {
        paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
            mercadoPago: "all",
        },
        visual: {
            style: {
                theme: 'default', // 'default' | 'dark' | 'bootstrap' | 'flat'
            },
            hidePaymentButton: false
        }
    };

    const initialization = {
        amount: Number(amount),
        preferenceId: undefined, // No needed for direct payment configuration in some versions but needed for others? 
        // For Payment Brick, we pass amount directly usually or use preference if we want pre-saved.
        // Actually, Payment Brick can work with just amount for "Card Payment".
    };

    const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
        // Callback llamado al hacer clic en el botón de enviar datos
        return new Promise((resolve, reject) => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            fetch(`${apiUrl}/api/mercadopago/process_payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    external_reference: externalReference,
                    description: description
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.status === 'approved') {
                        resolve();
                        if (onSuccess) onSuccess();
                    } else {
                        reject();
                        if (onError) onError(new Error("Pago no aprobado: " + (data.status_detail || data.status)));
                    }
                })
                .catch((error) => {
                    reject();
                    if (onError) onError(error);
                });
        });
    };

    const onErrorCallback = async (error: any) => {
        console.log(error);
        if (onError) onError(error);
    };

    const onReady = async () => {
        // Ocultar loader si existiera
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white p-2 rounded-lg">
            <Payment
                initialization={{ amount: Number(amount) }}
                customization={customization as any}
                onSubmit={onSubmit}
                onReady={onReady}
                onError={onErrorCallback}
            />
        </div>
    );
}
