import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { to, subject, html, senderName } = body;

        if (!to) {
            return NextResponse.json({ error: 'Missing recipient email address' }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const senderStr = senderName || "Chef's Mail";
        const { data, error } = await resend.emails.send({
            from: `${senderStr} <hallo@mail.tomm.chefdigital.nl>`,
            to: [to],
            // Since we use a verified domain, 'to' can be any email address now.
            subject: subject || "Test E-mail van Chef's Mail",
            html: html || "<p>Dit is een test e-mail vanuit Chef's Mail.</p>",
        });

        if (error) {
            console.error('--- RESEND API ERROR RAW ---');
            console.error(JSON.stringify(error, null, 2));
            console.error('----------------------------');
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Test email sending error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
    }
}
