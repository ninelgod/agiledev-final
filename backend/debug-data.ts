
const dotenv = require('dotenv');
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Data ---');

    // 1. Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log('No users found.');
        return;
    }
    console.log(`User found: ${user.username} (ID: ${user.id})`);

    // 2. Get loans for user
    const loans = await prisma.loan.findMany({
        where: { userId: user.id, isActive: true }
    });
    console.log(`Active loans for user: ${loans.length}`);
    loans.forEach(l => console.log(`- Loan ID: ${l.id}, Bank: ${l.bankName}, Amount: ${l.totalAmount}`));

    if (loans.length === 0) return;

    // 3. Get installments for user (simulating the API call)
    const installments = await prisma.installment.findMany({
        where: {
            loan: {
                userId: user.id,
                isActive: true
            }
        },
        select: {
            id: true,
            loanId: true,
            installmentNumber: true,
            amount: true,
            isPaid: true
        },
        orderBy: { dueDate: 'asc' }
    });

    console.log(`Total installments found via relation: ${installments.length}`);

    // Check specific loan installments
    const loanId = loans[0].id;
    const loanInstallments = installments.filter(i => i.loanId === loanId);
    console.log(`Installments for first loan (ID ${loanId}): ${loanInstallments.length}`);
    loanInstallments.forEach(i => {
        console.log(`   #${i.installmentNumber} - Amount: ${i.amount} - Paid: ${i.isPaid}`);
    });

    // Check filtered pending
    const pending = loanInstallments.filter(i => !i.isPaid);
    console.log(`Pending installments for first loan: ${pending.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
