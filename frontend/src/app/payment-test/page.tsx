'use client';

import { MercadoPagoButton } from '@/frontend/components/MercadoPagoButton';

export default function PaymentTestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Prueba de Pago con MercadoPago
                        </h1>
                        <p className="text-gray-600">
                            Haz clic en el botón para realizar un pago de prueba
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h2 className="font-semibold text-blue-900 mb-3">Detalles del pago</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-800">Descripción:</span>
                                <span className="font-medium text-blue-900">Pago de prueba</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-800">Monto:</span>
                                <span className="font-medium text-blue-900">$100.00</span>
                            </div>
                        </div>
                    </div>

                    <MercadoPagoButton
                        amount={100}
                        description="Pago de prueba - Gestor de Préstamos"
                        onSuccess={() => console.log('Preferencia creada exitosamente')}
                        onError={(error) => console.error('Error:', error)}
                    />

                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Nota:</strong> Estás usando credenciales de prueba. Los pagos no serán reales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

