import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Validar que exista el access token
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno');
}

// Configurar cliente de MercadoPago
const client = new MercadoPagoConfig({
    accessToken: accessToken
});

// Exportar cliente y Preference para usar en otras partes del backend
import { Payment } from 'mercadopago';
export { client, Preference, Payment };
export const mercadoPagoPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
