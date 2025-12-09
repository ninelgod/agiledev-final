
import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const { username, email, password } = await request.json()

        if (!username || !email || !password) {
            return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        })

        if (existingUser) {
            return NextResponse.json({ error: "El usuario o email ya existe" }, { status: 400 })
        }

        const hashedPassword = await hash(password, 10)

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
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
    }
}
