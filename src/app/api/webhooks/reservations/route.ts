import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Anon key is perfectly safe here as we use a SECURITY DEFINER RPC)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

        // In a real multi-tenant app, we'd look up the user_id based on a token or payload.restaurantId
        // For this demo, we'll gracefully fallback to the primary admin account if missing.
        const userId = payload.restaurantId || '474a5578-98f9-467b-ae73-f61715d567a5';

        // Add the contact directly to our self-hosted Supabase CRM
        const { error } = await supabase.rpc('insert_webhook_contact', {
            p_user_id: userId,
            p_email: payload.guestEmail,
            p_first_name: payload.guestName?.split(' ')[0] || '',
            p_last_name: payload.guestName?.split(' ').slice(1).join(' ') || '',
            p_source: payload.source
        });

        if (error) {
            console.error('[Webhook] Failed to add contact to Supabase:', error);
            return NextResponse.json({ error: 'Failed to sync contact to Supabase' }, { status: 500 });
        }

        console.log(`[Webhook] Successfully added ${payload.guestEmail} to Supabase for user ${userId}`);

        return NextResponse.json({ success: true, message: 'Contact synced successfully' });

    } catch (error: any) {
        console.error('[Webhook Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
