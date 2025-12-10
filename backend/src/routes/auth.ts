import { Router, type Request, type Response } from 'express';
import { hash, compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: "El usuario o email ya existe" });
        }

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        return res.json({ user });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Error al crear usuario" });
    }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Verificar si la cuenta está bloqueada
        if (user.loginBlockedUntil && user.loginBlockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.loginBlockedUntil.getTime() - Date.now()) / 60000);
            return res.status(429).json({
                error: `Cuenta bloqueada. Intenta nuevamente en ${minutesLeft} minutos.`
            });
        }

        // Verificar contraseña
        const isValid = await compare(password, user.password);

        if (!isValid) {
            // Incrementar intentos fallidos
            const failedAttempts = user.failedLoginAttempts + 1;
            const updateData: any = { failedLoginAttempts: failedAttempts };

            // Bloquear después de 5 intentos
            if (failedAttempts >= 5) {
                updateData.loginBlockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
            }

            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });

            const attemptsLeft = Math.max(0, 5 - failedAttempts);
            if (attemptsLeft > 0) {
                return res.status(401).json({
                    error: `Credenciales inválidas. Te quedan ${attemptsLeft} intentos.`
                });
            } else {
                return res.status(429).json({
                    error: "Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos."
                });
            }
        }

        // Login exitoso - resetear intentos fallidos
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                loginBlockedUntil: null
            }
        });

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
