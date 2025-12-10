const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('test_result.txt', msg + '\n');
}

async function test() {
    try {
        fs.writeFileSync('test_result.txt', 'Starting test...\n');
        log("Sending request...");
        const response = await fetch('http://localhost:4000/api/mercadopago/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    {
                        title: "Test Item",
                        quantity: 1,
                        unit_price: 100
                    }
                ],
                back_urls: {
                    success: "http://localhost:3000",
                    failure: "http://localhost:3000",
                    pending: "http://localhost:3000"
                }
                // auto_return removed to test if back_urls alone works
            })
        });

        log("Response received: " + response.status);
        const data = await response.json();
        log('Response Body: ' + JSON.stringify(data, null, 2));
    } catch (e) {
        log('Error executing test: ' + e.message);
        if (e.cause) log('Cause: ' + e.cause);
    }
}

test();
