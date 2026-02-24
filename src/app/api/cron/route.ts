import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
            summary: "De eerste zonnige dagen op het Gerard Douplein terras. Maak je klaar!",
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80",
            body: "Hey there,\n\nAnnouncing the first sunny days on the terrace. Come join us!\n\nCheers,\nTeam Het Paardje",
        };

        // For this SaaS MVP demo, we will execute the dispatch for our primary specific demo user (Het Paardje / Chef Digital):
        const demoUserId = '474a5578-98f9-467b-ae73-f61715d567a5';

        // Fetch active subscriber emails dynamically from the SaaS Contacts Table without exposing other tenants
        const { data: contacts, error: dbError } = await supabase.rpc('get_contacts_for_user', { p_user_id: demoUserId });

        if (dbError || !contacts || contacts.length === 0) {
            return NextResponse.json({ success: true, message: 'No active contacts found for this tenant. Skipping send.' });
        }

        const emailAddresses = contacts.map((c: any) => c.email);
        console.log(`Found ${emailAddresses.length} contacts for today's campaign. Dispatching via Resend...`);

        // 4. Send emails via Resend
        // In production we use Batch emails: https://resend.com/docs/api-reference/emails/send-batch-emails
        // For this demo, we simulate a single send to 'delivered@resend.dev' or bcc the user list (max 50 per api call)
        const { data, error } = await resend.emails.send({
            from: 'TOMM App <onboarding@resend.dev>', // Use verified domain in production
            to: ['delivered@resend.dev'], // Send to a safe testing address to avoid demo bouncing
            bcc: emailAddresses.slice(0, 49), // Resend allows max 50 recipients per call on the payload
            subject: mockReadyCampaign.subject,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        ${mockReadyCampaign.imageUrl ? `<img src="${mockReadyCampaign.imageUrl}" alt="Hero" style="width: 100%; height: 250px; object-fit: cover; display: block;" />` : ''}
                        
                        <div style="padding: 40px 32px;">
                            <h2 style="margin-top: 0; font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">${mockReadyCampaign.subject || 'Test E-mail'}</h2>
                            <p style="color: #6B7280; font-style: italic; font-size: 15px; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">${mockReadyCampaign.summary || 'Preheader text...'}</p>
                            
                            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 0 0 24px 0;" />
                            
                            <div style="white-space: pre-wrap; line-height: 1.7; font-size: 16px; color: #374151;">${mockReadyCampaign.body || 'Inhoud van de e-mail...'}</div>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://demo.tomm.app/reserveren" style="background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Reserveren</a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">Verzonden via TOMM voor jouw restaurant</p>
                            <div style="margin-top: 12px;">
                                <a href="#" style="color: #6B7280; font-size: 12px; text-decoration: underline;">Uitschrijven</a>
                            </div>
                        </div>
                    </div>
                </div>
            `,
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
