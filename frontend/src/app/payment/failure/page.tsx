'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailurePage() {
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
        console.log('Pago fallido:', info);
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Pago Rechazado
                    </h1>

                    <p className="text-gray-600 mb-6">
                        No se pudo procesar tu pago. Por favor, intenta nuevamente.
                    </p>

                    {paymentInfo && paymentInfo.status && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <h2 className="font-semibold text-gray-900 mb-3">Detalles</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estado:</span>
                                    <span className="font-medium text-red-600">{paymentInfo.status}</span>
                                </div>
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
                        <h3 className="font-semibold text-blue-900 mb-2">Posibles causas:</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Fondos insuficientes</li>
                            <li>Datos de tarjeta incorrectos</li>
                            <li>Límite de compra excedido</li>
                            <li>Tarjeta bloqueada o vencida</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.history.back()}
                            className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Intentar Nuevamente
                        </button>

                        <Link
                            href="/dashboard"
                            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

