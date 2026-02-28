const { createClient } = require('@supabase/supabase-js');
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, KEY);

async function test() {
    // 1. Fetch campaigns for March
    const { data: campaignsToSend, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'scheduled')
        .eq('month', 3);

    if (fetchError || !campaignsToSend || campaignsToSend.length === 0) {
        console.error("No campaigns found:", fetchError);
        return;
    }

    console.log(`Found ${campaignsToSend.length} campaigns.`);

    const campaign = campaignsToSend[0];
    const { user_id, subject, summary } = campaign;

    // 2. Fetch business profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();
    
    console.log("=== MULTI-TENANT PROFILE DATA ===");
    console.log("Sender Name:", profile?.business_name || 'Your Hospitality Business');
    console.log("Website URL:", profile?.website_url ? `${profile.website_url}/#tebi-reservations` : '#');
    console.log("Logo URL:", profile?.logo_url || null);
    console.log("=================================");

    // 3. Update status back to 'sent'
    await supabase.from('campaigns').update({ status: 'sent' }).eq('id', campaign.id);
    console.log("Status updated to 'sent'. Test completed.");
}

test();
