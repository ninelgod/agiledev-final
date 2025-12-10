import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Ver todos los usuario
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true
        }
    });

    console.log('👥 Usuarios en la base de datos:');
    console.log(users);

    // Ver todos los préstamos
    const loans = await prisma.loan.findMany({
        where: { isActive: true },
        include: {
            installments: true,
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    console.log('\n💰 Préstamos en la base de datos:');
    loans.forEach(loan => {
        console.log(`- ID: ${loan.id}, Usuario: ${loan.user.username} (ID: ${loan.userId}), Banco: ${loan.bankName}, Cuotas: ${loan.installments.length}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
