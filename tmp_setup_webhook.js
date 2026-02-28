const fs = require('fs');

async function setupWebhook() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const resendKeyMatch = envFile.match(/RESEND_API_KEY=(.*)/);
        if (!resendKeyMatch) {
            console.error('No RESEND_API_KEY found in .env.local');
            return;
        }

        const resendKey = resendKeyMatch[1].trim();

        console.log('Creating webhook via Resend API...');

        const response = await fetch('https://api.resend.com/webhooks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: 'https://tomm.chefdigital.nl/api/webhooks/resend',
                events: [
                    'email.delivered',
                    'email.opened',
                    'email.clicked',
                    'email.bounced',
                    'email.complained'
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to create webhook:', data);
            return;
        }

        console.log('Webhook created successfully!', data);

        if (data && data.secret) {
            fs.appendFileSync('.env.local', `\nRESEND_WEBHOOK_SECRET=${data.secret}\n`);
            console.log('Secret saved to .env.local');
        } else {
            console.log('No secret returned in payload', data);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

setupWebhook();
