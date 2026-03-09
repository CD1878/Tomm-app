import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// This route acts as our daily cron job
// Vercel Cron will hit this URL automatically
export async function GET(req: Request) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY!);
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('Cron Job Triggered: Checking for scheduled campaigns to send today...');

        // In production, Vercel Cron hits this based on vercel.json (e.g., 5th of every month)
        // Ensure we are checking for the current month.
        const currentMonth = new Date().getMonth() + 1;

        // 1. Fetch all campaigns that are approved ('scheduled') for the current month
        const { data: campaignsToSend, error: fetchError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('status', 'scheduled')
            .eq('month', currentMonth);

        if (fetchError) throw fetchError;

        if (!campaignsToSend || campaignsToSend.length === 0) {
            console.log(`No approved (scheduled) campaigns found for month ${currentMonth}.`);
            return NextResponse.json({ success: true, message: `No scheduled campaigns for month ${currentMonth}.` });
        }

        console.log(`Found ${campaignsToSend.length} approved campaigns to dispatch for month ${currentMonth}.`);

        let totalEmailsSent = 0;

        // 2. Process each campaign
        for (const campaign of campaignsToSend) {
            const { user_id, subject, summary, bodyText, image_url, id, call_to_action } = campaign;

            // Fetch business data for the user (to populate sender and logo)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();
            const senderName = profile?.business_name || 'Your Hospitality Business';

            const websiteStr = profile?.website_url || '';
            const absoluteWebsite = websiteStr ? (websiteStr.startsWith('http') ? websiteStr : `https://${websiteStr}`) : '#';
            const website = absoluteWebsite;

            const logoUrl = profile?.logo_url || null;

            // Fetch active contacts for this specific tenant via RPC
            const { data: contacts, error: contactsError } = await supabase.rpc('get_contacts_for_user', { p_user_id: user_id });

            if (contactsError || !contacts || contacts.length === 0) {
                console.log(`Skipping campaign ${id} for user ${user_id}: No active contacts.`);
                continue;
            }

            const emailAddresses = contacts.map((c: any) => c.email);
            console.log(`Sending campaign ${id} to ${emailAddresses.length} contacts for user ${user_id}...`);

            // Build the HTML template exactly as in the editor
            const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        
                        <!-- Header Logo -->
                        <div style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                            ${logoUrl
                    ? `<img src="${logoUrl}" alt="${senderName}" style="height: 60px; width: auto; max-width: 200px; object-fit: contain; display: block; margin: 0 auto; filter: drop-shadow(0px 2px 10px rgba(0,0,0,0.15));" />`
                    : `<h2 style="margin: 0; font-family: Georgia, serif; font-size: 20px; letter-spacing: 0.2em; font-weight: 300; color: #111827; text-transform: uppercase;">${senderName}</h2>`
                }
                        </div>

                        <!-- Hero Image -->
                        ${image_url
                    ? `<img src="${image_url}" alt="Hero" style="width: 100%; height: 300px; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop'" />`
                    : `<img src="https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop" alt="Hero Fallback" style="width: 100%; height: 300px; object-fit: cover; display: block;" />`
                }
                        
                        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
                            ${summary}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
                        </div>
                        <div style="padding: 40px 32px;">
                            <h2 style="margin-top: 0; font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 24px;">${subject}</h2>
                            
                            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 0 0 24px 0;" />
                            
                            <div style="white-space: pre-wrap; line-height: 1.7; font-size: 16px; color: #374151;">${bodyText}</div>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="${website}" style="background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">${call_to_action || 'Reserveren'}</a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">Verzonden via Chef's Mail voor ${senderName}</p>
                            <div style="margin-top: 12px;">
                                <a href="#" style="color: #6B7280; font-size: 12px; text-decoration: underline;">Uitschrijven</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 3. Send via Resend Batch API
            const BATCH_SIZE = 100;
            for (let i = 0; i < emailAddresses.length; i += BATCH_SIZE) {
                const chunk = emailAddresses.slice(i, i + BATCH_SIZE);
                const batchPayload = chunk.map((email: string) => ({
                    from: `${senderName} <hallo@mail.tomm.chefdigital.nl>`,
                    to: [email],
                    subject: subject,
                    html: htmlContent,
                    tags: [{ name: 'campaign_id', value: id.toString() }]
                }));

                const { error: batchError } = await resend.batch.send(batchPayload);
                if (batchError) {
                    console.error(`Batch send error for campaign ${id} (Chunk ${i}):`, batchError);
                } else {
                    totalEmailsSent += chunk.length;
                }
            }

            // 4. Update the campaign status to 'sent'
            const sendDate = new Date().toISOString();
            await supabase.rpc('mark_campaign_sent', {
                p_campaign_id: id,
                p_send_date: sendDate
            });
            console.log(`Campaign ${id} successfully processed and marked as sent.`);
        }

        return NextResponse.json({ success: true, message: `Dispatched ${totalEmailsSent} emails across ${campaignsToSend.length} campaigns.` });

    } catch (error: any) {
        console.error('Error in cron job processing:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
