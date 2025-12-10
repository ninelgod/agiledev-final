import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));
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

// Mount routes
app.use('/api/mercadopago', mercadoPagoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/loan-utils', loanUtilsRoutes);


// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 Accepting requests from: ${FRONTEND_URL}`);
});

export default app;
