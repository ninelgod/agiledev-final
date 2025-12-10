'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPendingPage() {
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<any>(null);

    useEffect(() => {
        const info = {
            collection_id: searchParams.get('collection_id'),
            collection_status: searchParams.get('collection_status'),
            payment_id: searchParams.get('payment_id'),
            status: searchParams.get('status'),
            external_reference: searchParams.get('external_reference'),
            payment_type: searchParams.get('payment_type'),
            merchant_order_id: searchParams.get('merchant_order_id'),
            preference_id: searchParams.get('preference_id')
        };

        setPaymentInfo(info);
        console.log('Pago pendiente:', info);
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-10 h-10 text-yellow-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Pago Pendiente
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Tu pago está siendo procesado. Te notificaremos cuando se confirme.
                    </p>

                    {paymentInfo && (
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
                                        <span className="text-gray-600">Estado:</span>
                                        <span className="font-medium text-yellow-600">{paymentInfo.status}</span>
                                    </div>
                                )}
                                {paymentInfo.external_reference && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Referencia:</span>
                                        <span className="font-medium text-gray-900">{paymentInfo.external_reference}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-blue-900 mb-2">¿Qué significa esto?</h3>
                        <p className="text-sm text-blue-800">
                            Algunos métodos de pago requieren tiempo adicional para procesarse.
                            Recibirás una notificación por email cuando el pago sea confirmado.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/dashboard"
                            className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Volver al Dashboard
                        </Link>

                        <Link
                            href="/dashboard"
                            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Ver mis préstamos
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

