
const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('--- Starting API Verification ---');

    // 1. Register User
    const randomSuffix = Math.floor(Math.random() * 10000);
    const userPayload = {
        username: `testuser${randomSuffix}`,
        email: `test${randomSuffix}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    };

    console.log(`\n1. Registering user: ${userPayload.username}`);
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
    });

    if (!registerRes.ok) {
        console.error('Registration failed:', await registerRes.text());
        return;
    }

    const user = await registerRes.json();
    console.log('User registered successfully. ID:', user.id);

    // 2. Create Loan
    console.log('\n2. Creating Loan...');
    const startDate = new Date().toISOString().split('T')[0];
    // Calculate end date for 6 months
    const endDateObj = new Date();
    endDateObj.setMonth(endDateObj.getMonth() + 6);
    const endDate = endDateObj.toISOString().split('T')[0];

    const loanPayload = {
        userId: user.id,
        bankName: 'Test Bank',
        loanType: 'Personal',
        totalAmount: 1000,
        installmentAmount: 200, // Simplification
        numberOfInstallments: 6,
        paymentType: 'Plazo fijo',
        interestRate: 10,
        startDate: startDate,
        endDate: endDate,
        loanCode: `LOAN-${randomSuffix}`
    };

    const loanRes = await fetch(`${BASE_URL}/api/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanPayload)
    });

    if (!loanRes.ok) {
        console.error('Loan creation failed:', await loanRes.text());
        return;
    }

    const loanData = await loanRes.json();
    console.log('Loan created successfully. ID:', loanData.loan.id);
    console.log('Installments created:', loanData.installments.length);

    // 3. Update Profile (Enable Notifications is required for Cron check)
    console.log('\n3. Updating Profile (Enable Notifications)...');
    const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: user.id,
            phoneNumber: '555-0100',
            notificationsEnabled: true
        })
    });

    if (!profileRes.ok) {
        console.error('Profile update failed:', await profileRes.text());
        return;
    }
    console.log('Profile updated.');

    // 4. Run Cron Job
    console.log('\n4. Running Cron Job (simulated)...');
    const cronRes = await fetch(`${BASE_URL}/api/cron/check-due-debts`);
    if (!cronRes.ok) {
        console.error('Cron job failed:', await cronRes.text());
    } else {
        const cronData = await cronRes.json();
        console.log('Cron Result:', cronData);
    }

    // 5. Pay Installment
    if (loanData.installments.length > 0) {
        const installmentId = loanData.installments[0].id;
        console.log(`\n5. Paying Installment ID: ${installmentId}`);

        const payRes = await fetch(`${BASE_URL}/api/installments/${installmentId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentMethod: 'Transferencia',
                notes: 'Test payment via script'
            })
        });

        if (!payRes.ok) {
            console.error('Payment failed:', await payRes.text());
        } else {
            const payData = await payRes.json();
            console.log('Payment successful:', payData);
        }
    }

    console.log('\n--- Verification Complete ---');
}

runTests().catch(console.error);
