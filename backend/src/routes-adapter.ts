import { Router, type Request, type Response } from 'express';

/**
 * Adaptador para convertir rutas de Next.js a Express
 * Mantiene la misma lógica pero adaptada al formato de Express
 */

// Helper para crear respuestas JSON similares a NextResponse
export const createJsonResponse = (data: any, status: number = 200) => {
    return { data, status };
};

// Helper para manejar errores de forma consistente
export const handleError = (error: any, res: Response) => {
    console.error('API Error:', error);

    if (error.message?.includes('Cuenta bloqueada') || error.message?.includes('Te quedan')) {
        return res.status(429).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error interno del servidor' });
};

// Exportar Router para uso en rutas
export { Router };
