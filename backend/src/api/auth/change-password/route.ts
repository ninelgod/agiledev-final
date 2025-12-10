
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/backend/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, código y nueva contraseña son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword)
    if (!hasLetter) {
      return NextResponse.json({ error: 'La contraseña debe contener al menos una letra' }, { status: 400 })
    }

    // Checking if code was used recently (last 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const recentCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: email,
        used: true,
        createdAt: { gt: fiveMinutesAgo }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!recentCode) {
      return NextResponse.json({ error: 'Código no verificado o expirado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    })

    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    console.log(`[SECURITY] Contraseña cambiada exitosamente para email: ${email}, IP: ${clientIP}`)

    return NextResponse.json({ message: 'Contraseña cambiada exitosamente' })

  } catch (error) {
    console.error('Error en change-password:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
