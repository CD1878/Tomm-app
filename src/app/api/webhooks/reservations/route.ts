import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Define a common structure we expect to parse from reservation webhooks
interface ReservationWebhookPayload {
    guestEmail: string;
    guestName?: string;
    source: 'tebi' | 'zenchef' | 'guestplan' | 'manual';
    restaurantId?: string; // Optional: used if multi-tenant to associate with the right audienc
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        // Basic security check: ensure the webhook sender includes a specific secret token
        if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'tomm-dev-secret'}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        let payload: ReservationWebhookPayload;

        // Normalizing the payload based on different reservation systems
        // E.g., Tebi might send { customer: { email: '...' } } while Guestplan might send { email: '...' }
        // For MVP, we assume a standardized payload or simple email extraction
        if (body.customer?.email) {
            payload = {
                guestEmail: body.customer.email,
                guestName: body.customer.name || '',
                source: 'tebi'
            };
        } else if (body.email) {
            payload = {
                guestEmail: body.email,
                guestName: body.firstName || '',
                source: 'generic' as any
            };
        } else {
            return NextResponse.json({ error: 'No email found in webhook payload' }, { status: 400 });
        }

        if (!payload.guestEmail) {
            return NextResponse.json({ error: 'No email found in webhook payload' }, { status: 400 });
        }

        console.log(`[Webhook] Received new reservation email from ${payload.source}: ${payload.guestEmail}`);

        // TODO: In a real multi-tenant app, you'd look up the Resend Audience ID 
        // belonging to this specific restaurant from Supabase using `payload.restaurantId`.
        // For this MVP, we will use a generic default audience ID.
        const audienceId = process.env.RESEND_AUDIENCE_ID || 'dummy-audience-id';

        // Add the contact directly to Resend Audience
        const { data, error } = await resend.contacts.create({
            email: payload.guestEmail,
            firstName: payload.guestName?.split(' ')[0] || '',
            lastName: payload.guestName?.split(' ').slice(1).join(' ') || '',
            unsubscribed: false,
            audienceId: audienceId,
        });

        if (error) {
            console.error('[Webhook] Failed to add contact to Resend:', error);
            return NextResponse.json({ error: 'Failed to sync contact to Resend' }, { status: 500 });
        }

        console.log(`[Webhook] Successfully added ${payload.guestEmail} to audience ${audienceId}`);

        return NextResponse.json({ success: true, message: 'Contact synced successfully' });

    } catch (error: any) {
        console.error('[Webhook Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
