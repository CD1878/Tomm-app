import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const payload = await req.json();

        // Inside payload.data.tags we injected campaign_id in our cron router
        const tags = payload?.data?.tags;
        let campaignId = null;

        if (Array.isArray(tags)) {
            const campaignTag = tags.find((t: any) => t.name === 'campaign_id');
            campaignId = campaignTag?.value;
        } else if (tags && typeof tags === 'object') {
            campaignId = tags['campaign_id'];
        }

        if (!campaignId) {
            console.log('Webhook received without campaign_id tag. Ignoring.');
            return NextResponse.json({ success: true, message: 'Ignored: No campaign tag' });
        }

        const eventType = payload.type;

        console.log(`Received Resend Webhook: ${eventType} for Campaign ID: ${campaignId}`);

        // Define which database column to increment based on the Resend event type
        let columnToIncrement = '';

        switch (eventType) {
            case 'email.delivered':
                columnToIncrement = 'stats_delivered';
                break;
            case 'email.opened':
                columnToIncrement = 'stats_opens';
                break;
            case 'email.clicked':
                columnToIncrement = 'stats_clicks';
                break;
            case 'email.bounced':
                columnToIncrement = 'stats_bounced';
                break;
            case 'email.complained':
                columnToIncrement = 'stats_complained';
                break;
            default:
                return NextResponse.json({ success: true, message: `Ignored unhandled event: ${eventType}` });
        }

        // Call RPC to safely increment the stat column to avoid race conditions
        const { error } = await supabase.rpc('increment_campaign_stat', {
            p_campaign_id: campaignId,
            p_column_name: columnToIncrement
        });

        if (error) {
            // Fallback strategy if RPC function doesn't exist yet
            console.log('RPC failed, falling back to read-then-write (not atomic):', error.message);
            const { data: currentCamp } = await supabase.from('campaigns').select(columnToIncrement).eq('id', campaignId).single();
            if (currentCamp) {
                const campRecord = currentCamp as Record<string, any>;
                const newValue = (campRecord[columnToIncrement] || 0) + 1;
                await supabase.from('campaigns').update({ [columnToIncrement]: newValue }).eq('id', campaignId);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
