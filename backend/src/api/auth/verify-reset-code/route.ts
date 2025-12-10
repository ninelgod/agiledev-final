
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/backend/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email y código son requeridos' }, { status: 400 })
    }

    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!resetCode) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    if (resetCode.blockedUntil && resetCode.blockedUntil > new Date()) {
      const remainingTime = Math.ceil((resetCode.blockedUntil.getTime() - Date.now()) / 1000 / 60)
      return NextResponse.json({
        error: `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minutos`,
        attemptsLeft: 0
      }, { status: 429 })
    }

    const isValidCode = await bcrypt.compare(code, resetCode.code)

    if (!isValidCode) {
      const newAttempts = resetCode.attempts + 1
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

      if (newAttempts >= 3) {
        const blockedUntil = new Date(Date.now() + 2 * 60 * 1000)
        await prisma.passwordResetCode.update({
          where: { id: resetCode.id },
          data: { attempts: newAttempts, blockedUntil }
        })
        console.log(`[SECURITY] Código bloqueado para email: ${email}, IP: ${clientIP}, intentos: ${newAttempts}`)
        return NextResponse.json({
          error: 'Código incorrecto. Acceso bloqueado por 2 minutos',
          attemptsLeft: 0
        }, { status: 429 })
      } else {
        await prisma.passwordResetCode.update({
          where: { id: resetCode.id },
          data: { attempts: newAttempts }
        })
        console.log(`[SECURITY] Intento fallido de verificación para email: ${email}, IP: ${clientIP}, intentos: ${newAttempts}`)
        return NextResponse.json({
          error: `Código incorrecto. Te quedan ${3 - newAttempts} intentos`,
          attemptsLeft: 3 - newAttempts
        }, { status: 400 })
      }
    }

    // Código válido
    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { used: true, attempts: 0 }
    })

    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    console.log(`[SECURITY] Código verificado exitosamente para email: ${email}, IP: ${clientIP}`)

    return NextResponse.json({ message: 'Código verificado correctamente' })

  } catch (error) {
    console.error('Error en verify-reset-code:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
