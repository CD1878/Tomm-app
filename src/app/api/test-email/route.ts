import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { to, subject, html } = body;

        if (!to) {
            return NextResponse.json({ error: 'Missing recipient email address' }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const data = await resend.emails.send({
            from: 'Chef Digital <info@chefdigital.nl>',
            to: [to],
            subject: subject || 'Test E-mail van TOMM',
            html: html || '<p>Dit is een test e-mail vanuit TOMM.</p>',
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Test email sending error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
    }
}
