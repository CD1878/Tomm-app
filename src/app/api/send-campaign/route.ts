import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, html, senderName } = body;

        if (!subject || !html) {
            return NextResponse.json({ error: 'Missing subject or html content' }, { status: 400 });
        }

        // For this SaaS MVP demo, we will execute the dispatch for our primary specific demo user (Het Paardje / Chef Digital):
        const demoUserId = '474a5578-98f9-467b-ae73-f61715d567a5';

        // Fetch active subscriber emails dynamically from the SaaS Contacts Table without exposing other tenants
        const { data: contacts, error: dbError } = await supabase.rpc('get_contacts_for_user', { p_user_id: demoUserId });

        if (dbError || !contacts || contacts.length === 0) {
            return NextResponse.json({ error: 'No active contacts found for this tenant. Skipping send.' }, { status: 400 });
        }

        const emailAddresses = contacts.map((c: any) => c.email);
        console.log(`Found ${emailAddresses.length} contacts for live campaign. Dispatching via Resend...`);

        // Production dispatch: We can now send to ALL subscribers because we are out of the sandbox.
        // We set 'To' as the sender itself (or a generic address) and put everyone else in 'BCC' so they don't see each other's emails.
        const senderStr = senderName || 'TOMM App';
        const { data, error } = await resend.emails.send({
            from: `${senderStr} <hallo@mail.tomm.chefdigital.nl>`,
            to: ['hallo@mail.tomm.chefdigital.nl'],
            bcc: emailAddresses,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('--- RESEND API ERROR RAW ---');
            console.error(JSON.stringify(error, null, 2));
            console.error('----------------------------');
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Live campaign sending error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send campaign' }, { status: 500 });
    }
}
