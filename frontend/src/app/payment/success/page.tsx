'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const [processing, setProcessing] = useState(true);
    const [message, setMessage] = useState("Verificando pago...");

    useEffect(() => {
        const processPayment = async () => {
            // Obtener parámetros de la URL que MercadoPago envía
            const info = {
                collection_id: searchParams.get('collection_id'),
                collection_status: searchParams.get('collection_status'),
                payment_id: searchParams.get('payment_id'),
                status: searchParams.get('status'),
                external_reference: searchParams.get('external_reference'),
                payment_type: searchParams.get('payment_type'),
                merchant_order_id: searchParams.get('merchant_order_id'),
                preference_id: searchParams.get('preference_id'),
                site_id: searchParams.get('site_id'),
                processing_mode: searchParams.get('processing_mode'),
                merchant_account_id: searchParams.get('merchant_account_id')
            };

            setPaymentInfo(info);
            console.log('Pago recibido:', info);

            // Si el pago está aprobado y tenemos referencia (ID de cuota)
            if (info.status === 'approved' && info.external_reference) {
                try {
                    setMessage("Registrando pago en el sistema...");
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    const installmentId = info.external_reference;

                    const response = await fetch(`${apiUrl}/api/installments/${installmentId}/pay`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            paymentMethod: 'Tarjeta (MercadoPago)',
                            notes: `Pago online completado. ID MP: ${info.payment_id}`
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("No se pudo registrar el pago en la base de datos.");
                    }

                    setMessage("¡Pago registrado y confirmado!");
                } catch (error) {
                    console.error("Error registrando pago:", error);
                    setMessage("El pago fue exitoso en MercadoPago, pero hubo un error actualizando el sistema. Por favor contacta soporte.");
                }
            } else if (info.status === 'pending') {
                setMessage("Tu pago está procesándose. Se actualizará cuando se confirme.");
            } else {
                setMessage("El estado del pago no es definitivo.");
            }
            setProcessing(false);
        };

        if (searchParams.get('status')) {
            processPayment();
        } else {
            setProcessing(false);
            setMessage("No se encontró información del pago.");
        }

    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        {processing ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        ) : (
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {processing ? "Procesando..." : "Resultado del Pago"}
                    </h1>

                    <p className="text-gray-600 mb-6 font-medium">
                        {message}
                    </p>

                    {paymentInfo && !processing && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <h2 className="font-semibold text-gray-900 mb-3">Detalles del pago</h2>
                            <div className="space-y-2 text-sm">
                                {paymentInfo.payment_id && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">ID de Pago:</span>
                                        <span className="font-medium text-gray-900">{paymentInfo.payment_id}</span>
                                    </div>
                                )}
                                {paymentInfo.status && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Estado MP:</span>
                                        <span className="font-medium text-green-600 capitalize">{paymentInfo.status}</span>
                                    </div>
                                )}
                                {paymentInfo.external_reference && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cuota ID:</span>
                                        <span className="font-medium text-gray-900">{paymentInfo.external_reference}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Link
                            href="/dashboard"
                            className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

