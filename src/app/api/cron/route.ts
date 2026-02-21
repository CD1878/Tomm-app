import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// This route acts as our daily cron job
// Vercel Cron will hit this URL automatically
export async function GET(req: Request) {
    try {
        // 1. Verify this request if it's actually from Vercel Cron
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
        //   return new NextResponse('Unauthorized', { status: 401 });
        // }

        console.log('Cron Job Triggered: Checking for campaigns to send today...');

        // 2. Mock Logic: Fetch today's date and check DB for scheduled campaigns matching today (e.g., the 5th of the month)
        const today = new Date();
        const isFifthOfMonth = today.getDate() === 5;

        if (!isFifthOfMonth) {
            return NextResponse.json({ success: true, message: 'Not the 5th of the month. No campaigns to send.' });
        }

        // 3. Mock data representing what we'd pull from Supabase for all users
        const mockReadyCampaign = {
            subject: "Spring is in the Air! 🌸",
            body: "Hey there,\n\nAnnouncing the first sunny days on the terrace. Come join us!\n\nCheers,\n[Your Restaurant]",
            audiences: ["user1@example.com", "user2@example.com"] // Example audience list
        };

        console.log('Found campaigns scheduled for today. Dispatching via Resend...');

        // 4. Send emails via Resend
        // In production we use Batch emails: https://resend.com/docs/api-reference/emails/send-batch-emails
        // For this demo, we simulate a single send
        const { data, error } = await resend.emails.send({
            from: 'TOMM Marketing <onboarding@resend.dev>', // Should be a verified domain in prod
            to: ['delivered@resend.dev'], // Send to a safe testing address
            subject: mockReadyCampaign.subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
               <h1 style="color: #333;">${mockReadyCampaign.subject}</h1>
               <p style="color: #666; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${mockReadyCampaign.body}</p>
             </div>`,
        });

        if (error) {
            console.error('Failed to send email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Monthly campaigns sent successfully', data });

    } catch (error: any) {
        console.error('Error in cron job:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
