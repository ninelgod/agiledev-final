
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking for user 'JuanManolo'...");
    const user = await prisma.user.findUnique({
        where: { username: "JuanManolo" }
    });

    if (user) {
        console.log("User found:", user);
    } else {
        console.log("User 'JuanManolo' not found.");
        // Check for similar
        const users = await prisma.user.findMany();
        console.log("Existing users:", users.map(u => u.username));
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
