# SDK de MercadoPago en React - Documentación Frontend

## ✅ Instalación Completada

El SDK de MercadoPago para React ha sido instalado exitosamente:

```bash
npm install @mercadopago/sdk-react --legacy-peer-deps
```

**Nota:** Se usó `--legacy-peer-deps` debido a que el proyecto usa React 19, pero el SDK de MercadoPago requiere React 18. Esto es seguro y funcional.

## Configuración Inicial

### 1. Agregar la Public Key al .env.local

Asegúrate de tener la clave pública de MercadoPago en tu archivo `.env.local`:

```env
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-85214b9d-1cba-4b8d-a2f5-aec5ba2a69cc
```

### 2. Inicializar el SDK

Crea un componente wrapper para inicializar MercadoPago:

```tsx
// src/frontend/components/MercadoPagoProvider.tsx
'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import { useEffect } from 'react';

export function MercadoPagoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey);
    }
  }, []);

  return <>{children}</>;
}
```

## Opciones de Integración

### Opción 1: Checkout Pro (Redirección)

Esta es la opción más simple. Creas una preferencia en el backend y rediriges al usuario:

```tsx
'use client';

import { useState } from 'react';

export function PaymentButton({ amount, description }: { amount: number, description: string }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Crear preferencia en el backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mercadopago/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: 'loan-payment',
            title: description,
            quantity: 1,
            unit_price: amount
          }],
          back_urls: {
            success: `${window.location.origin}/payment/success`,
            failure: `${window.location.origin}/payment/failure`,
            pending: `${window.location.origin}/payment/pending`
          },
          auto_return: 'approved'
        })
      });

      const data = await response.json();
      
      // Redirigir al checkout de MercadoPago
      window.location.href = data.init_point;
      
    } catch (error) {
      console.error('Error al crear preferencia:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Procesando...' : 'Pagar con MercadoPago'}
    </button>
  );
}
```

### Opción 2: Wallet Brick (Botón Integrado)

Muestra el botón de MercadoPago directamente en tu página:

```tsx
'use client';

import { Wallet } from '@mercadopago/sdk-react';
import { useState, useEffect } from 'react';

export function MercadoPagoWallet({ amount, description }: { amount: number, description: string }) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  useEffect(() => {
    // Crear preferencia cuando el componente se monta
    const createPreference = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mercadopago/create-preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: 'loan-payment',
              title: description,
              quantity: 1,
              unit_price: amount
            }],
            back_urls: {
              success: `${window.location.origin}/payment/success`,
              failure: `${window.location.origin}/payment/failure`,
              pending: `${window.location.origin}/payment/pending`
            },
            auto_return: 'approved'
          })
        });

        const data = await response.json();
        setPreferenceId(data.id);
        
      } catch (error) {
        console.error('Error al crear preferencia:', error);
      }
    };

    createPreference();
  }, [amount, description]);

  if (!preferenceId) {
    return <div>Cargando...</div>;
  }

  return (
    <Wallet
      initialization={{ preferenceId }}
      customization={{
        texts: {
          valueProp: 'smart_option'
        }
      }}
    />
  );
}
```

### Opción 3: Payment Brick (Checkout Embebido)

Integra el checkout completo dentro de tu página:

```tsx
'use client';

import { Payment } from '@mercadopago/sdk-react';

export function MercadoPagoPayment({ amount, description }: { amount: number, description: string }) {
  const initialization = {
    amount: amount,
    preferenceId: '<PREFERENCE_ID>', // Obtener del backend
  };

  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
      ticket: 'all',
      bankTransfer: 'all',
    },
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    // Procesar el pago
    console.log('Método de pago:', selectedPaymentMethod);
    console.log('Datos del formulario:', formData);
  };

  const onError = async (error: any) => {
    console.error('Error en el pago:', error);
  };

  const onReady = async () => {
    console.log('Brick listo');
  };

  return (
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onReady={onReady}
      onError={onError}
    />
  );
}
```

## Recomendación

Para tu caso de uso (gestor de préstamos), **recomiendo usar la Opción 1 (Checkout Pro con redirección)** porque:

1. ✅ Es más simple de implementar
2. ✅ MercadoPago maneja toda la seguridad del pago
3. ✅ Soporta todos los métodos de pago automáticamente
4. ✅ Ya tienes las páginas de retorno configuradas
5. ✅ Menos código que mantener

## Próximos Pasos

1. ✅ SDK instalado
2. ⏭️ Crear componente de botón de pago
3. ⏭️ Integrar en la vista de préstamos/cuotas
4. ⏭️ Configurar webhooks para confirmación automática
5. ⏭️ Actualizar estado de cuotas después del pago

## Variables de Entorno Requeridas

Asegúrate de tener en `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-85214b9d-1cba-4b8d-a2f5-aec5ba2a69cc
```

## Recursos Adicionales

- [Documentación oficial de MercadoPago SDK React](https://github.com/mercadopago/sdk-react)
- [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Checkout Bricks](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/landing)
