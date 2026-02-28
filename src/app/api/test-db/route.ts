import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. Fetch campaigns for March
        const { data: campaignsToSend, error: fetchError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('status', 'scheduled')
            .eq('month', 3);

        if (fetchError || !campaignsToSend || campaignsToSend.length === 0) {
            return NextResponse.json({ error: "No scheduled campaigns found for month 3", details: fetchError });
        }

        const campaign = campaignsToSend[0];
        const { user_id } = campaign;

        // 2. Fetch business profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();

        const result = {
            senderName: profile?.business_name || 'Your Hospitality Business',
            websiteUrl: profile?.website_url ? `${profile.website_url}/#tebi-reservations` : '#',
            logoUrl: profile?.logo_url || null
        };

        // 3. Mark as sent
        await supabase.from('campaigns').update({ status: 'sent' }).eq('id', campaign.id);

        return NextResponse.json({ success: true, profile: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
