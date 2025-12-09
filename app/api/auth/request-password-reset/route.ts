
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, oldPassword } = await request.json()

    if (!email || !oldPassword) {
      return NextResponse.json({ error: 'Email y contraseña antigua son requeridos' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password)

    if (!isValidPassword) {
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      console.log(`[SECURITY] Intento de cambio de contraseña fallido para email: ${email}, IP: ${clientIP}`)
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
    }

    // Verificar si hay códigos activos
    const activeCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (activeCode) {
      if (activeCode.blockedUntil && activeCode.blockedUntil > new Date()) {
        const remainingTime = Math.ceil((activeCode.blockedUntil.getTime() - Date.now()) / 1000 / 60)
        return NextResponse.json({
          error: `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minutos`
        }, { status: 429 })
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedCode = await bcrypt.hash(code, 10)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.passwordResetCode.create({
      data: {
        email,
        code: hashedCode,
        expiresAt,
        ipAddress: clientIP as string
      }
    })

    console.log(`[SECURITY] Código de reset enviado a: ${email}, IP: ${clientIP}`)

    try {
      await sendPasswordResetCode(email, code)
    } catch (emailError) {
      console.error('Error enviando email:', emailError)
      return NextResponse.json({ error: 'Error enviando el código de verificación' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Código de verificación enviado al email' })

  } catch (error) {
    console.error('Error en request-password-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
