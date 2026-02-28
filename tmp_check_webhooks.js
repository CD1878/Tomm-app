const fs = require('fs');

async function listWebhooks() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const resendKeyMatch = envFile.match(/RESEND_API_KEY=(.*)/);
        if (!resendKeyMatch) {
            console.error('No RESEND_API_KEY found');
            return;
        }
        const resendKey = resendKeyMatch[1].trim();

        const response = await fetch('https://api.resend.com/webhooks', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${resendKey}` }
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

listWebhooks();
