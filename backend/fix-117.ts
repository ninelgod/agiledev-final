
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log("Fixing Installment 117...");
    const updated = await prisma.installment.update({
        where: { id: 117 },
        data: {
            isPaid: true,
            paidDate: new Date()
        }
    });
    console.log("Fixed:", updated);
}

fix()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
