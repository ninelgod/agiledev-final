# API de MercadoPago - Documentación

## Configuración Completada

✅ SDK de MercadoPago instalado
✅ Configuración en `src/lib/mercadopago.ts`
✅ Rutas API creadas en `src/routes/mercadopago.ts`
✅ Rutas montadas en el servidor Express

## Endpoints Disponibles

### 1. Test de Configuración
**GET** `/api/mercadopago/test`

Verifica que la configuración de MercadoPago esté funcionando correctamente.

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Configuración de MercadoPago funcionando correctamente",
  "preference_id": "123456789-abc123...",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

### 2. Crear Preferencia de Pago
**POST** `/api/mercadopago/create-preference`

Crea una preferencia de pago en MercadoPago y retorna el ID para iniciar el checkout.

**Body de la petición:**
```json
{
  "items": [
    {
      "id": "item-123",
      "title": "Mi producto",
      "quantity": 1,
      "unit_price": 2000,
      "description": "Descripción del producto (opcional)"
    }
  ],
  "back_urls": {
    "success": "https://tu-frontend.com/payment/success",
    "failure": "https://tu-frontend.com/payment/failure",
    "pending": "https://tu-frontend.com/payment/pending"
  },
  "auto_return": "approved",
  "external_reference": "ORDER-123"
}
```

**Configuración de URLs de Retorno:**

Las `back_urls` definen a dónde se redirige al usuario después del pago:
- **success**: URL cuando el pago es aprobado
- **failure**: URL cuando el pago es rechazado  
- **pending**: URL cuando el pago está pendiente de confirmación

El atributo `auto_return` controla el retorno automático:
- **"approved"**: Redirige automáticamente solo cuando el pago es aprobado (recomendado)
- **"all"**: Redirige automáticamente en todos los casos

El tiempo de redireccionamiento será de hasta 40 segundos. También se mostrará un botón "Volver al sitio".


**Campos opcionales:**
- `back_urls`: URLs de retorno después del pago
- `auto_return`: Retorno automático ('approved' o 'all')
- `external_reference`: Referencia externa para identificar el pago

**Respuesta exitosa:**
```json
{
  "id": "123456789-abc123...",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "preference_id": "123456789-abc123..."
}
```

## Ejemplo de Uso desde el Frontend

```typescript
// Crear una preferencia de pago
const createPaymentPreference = async (items: any[]) => {
  try {
    const response = await fetch('http://localhost:4000/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items,
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();
    
    // Redirigir al usuario al checkout de MercadoPago
    window.location.href = data.init_point;
    
  } catch (error) {
    console.error('Error al crear preferencia:', error);
  }
};

// Ejemplo de uso
createPaymentPreference([
  {
    id: 'loan-payment-123',
    title: 'Pago de préstamo',
    quantity: 1,
    unit_price: 5000,
    description: 'Cuota mensual de préstamo'
  }
]);
```

## Probar la Integración

### 1. Iniciar el servidor backend
```bash
cd backend
npm run dev
```

### 2. Probar el endpoint de test
```bash
curl http://localhost:4000/api/mercadopago/test
```

### 3. Crear una preferencia de prueba
```bash
curl -X POST http://localhost:4000/api/mercadopago/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "test-item",
        "title": "Producto de prueba",
        "quantity": 1,
        "unit_price": 100
      }
    ]
  }'
```

## Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu archivo `.env`:

```env
MERCADOPAGO_PUBLIC_KEY=TEST-85214b9d-1cba-4b8d-a2f5-aec5ba2a69cc
MERCADOPAGO_ACCESS_TOKEN=TEST-2770665122477567-121002-1e3c0f514e1d43e9fb761c4755dec0e2-376664174
```

## Próximos Pasos

1. ✅ Configuración completada
2. ✅ URLs de retorno configuradas
3. ✅ Páginas de retorno creadas en el frontend
4. ⏭️ Integrar en el frontend para iniciar pagos
5. ⏭️ Configurar webhooks para recibir notificaciones de pago
6. ⏭️ Implementar lógica de confirmación de pago
7. ⏭️ Actualizar estado de préstamos/cuotas después del pago

## Páginas de Retorno Creadas

Se han creado tres páginas en el frontend para manejar los diferentes estados de pago:

### 1. `/payment/success` - Pago Exitoso
- Muestra confirmación de pago aprobado
- Extrae y muestra información del pago desde los parámetros de URL
- Botones para volver al dashboard

### 2. `/payment/failure` - Pago Rechazado  
- Muestra mensaje de pago rechazado
- Lista posibles causas del rechazo
- Botón para intentar nuevamente

### 3. `/payment/pending` - Pago Pendiente
- Muestra mensaje de pago en proceso
- Explica que recibirá notificación cuando se confirme
- Botón para volver al dashboard

**Parámetros que MercadoPago envía en la URL de retorno:**
- `collection_id`: ID de la colección
- `collection_status`: Estado de la colección
- `payment_id`: ID del pago
- `status`: Estado del pago (approved, rejected, pending)
- `external_reference`: Referencia externa que enviaste
- `payment_type`: Tipo de pago usado
- `merchant_order_id`: ID de la orden del comerciante
- `preference_id`: ID de la preferencia creada


## Notas Importantes

- Estás usando credenciales de **TEST**, por lo que los pagos no serán reales
- Para producción, deberás cambiar a credenciales de producción
- El `init_point` es la URL donde debes redirigir al usuario para que complete el pago
- Guarda el `preference_id` para poder rastrear el pago posteriormente
