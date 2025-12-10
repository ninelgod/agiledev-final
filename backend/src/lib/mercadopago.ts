import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Cargar variables de entorno
dotenv.config();

// Validar que exista el access token
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno');
}

// Configurar cliente de MercadoPago (SDK nuevo)
export const client = new MercadoPagoConfig({
    accessToken: accessToken
});

// Exportar clases del SDK nuevo correctamente
export { Preference, Payment };

// Public key para el frontend
export const mercadoPagoPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
