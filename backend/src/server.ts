import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Normalizar FRONTEND_URL (quitar slash final si lo tiene)
const rawFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URL = rawFrontend.replace(/\/$/, ''); // ahora sin slash final

// Middleware: CORS robusto (acepta la versión con/sin slash y peticiones sin origin como curl/postman)
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            FRONTEND_URL,                    // e.g. https://agiledev-final.vercel.app
            `${FRONTEND_URL}/`               // e.g. https://agiledev-final.vercel.app/
        ];

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // not allowed
        return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
    },
    credentials: true,
}));

// Middleware para parsear JSON
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import mercadoPagoRoutes from './routes/mercadopago';
import authRoutes from './routes/auth';
import loansRoutes from './routes/loans';
import installmentsRoutes from './routes/installments';
import loanUtilsRoutes from './routes/loan-utils';
import notificationsRoutes from './routes/notifications';
import invoiceRoutes from './routes/invoices';

// Mount routes
app.use('/api/mercadopago', mercadoPagoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/loan-utils', loanUtilsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Start Cron Jobs
import { startCronJobs } from './services/cron';
startCronJobs();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📡 Accepting requests from: ${FRONTEND_URL}`);
});

export default app;
