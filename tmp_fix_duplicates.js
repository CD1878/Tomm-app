const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDuplicates() {
    console.log("Fetching all campaigns...");
    const { data: campaigns, error: fetchErr } = await supabase.from('campaigns').select('*');
    if (fetchErr) return console.error("Error fetching campaigns:", fetchErr.message);

    console.log(`Found ${campaigns.length} total campaigns.`);

    // Group by user_id and month
    const userMonthMap = {};
    const toDelete = [];

    for (const camp of campaigns) {
        const key = `${camp.user_id}_${camp.month}`;
        if (!userMonthMap[key]) {
            // Keep the first one we see (or we could sort by created_at)
            userMonthMap[key] = camp;
        } else {
            // It's a duplicate! Mark for deletion
            toDelete.push(camp.id);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        const { error: delErr } = await supabase.from('campaigns').delete().in('id', toDelete);
        if (delErr) {
            console.error("Error deleting duplicates:", delErr.message);
        } else {
            console.log("Successfully deleted duplicates.");
        }
    }

    // Now let's try to execute SQL to add a unique constraint if it doesn't exist, and add a DELETE policy
    // Supabase JS doesn't have a direct "execute SQL" method on the data API, 
    // it usually uses the postgres meta API or RPC. 
    // If we can't run raw SQL, we can at least ensure duplicates are cleared.
    // However, we can create an RPC to execute SQL if we really needed to, but let's just clean it up first.

    // As a workaround for the RLS block on frontend, let's just give authenticated users DELETE access.
    // But wait, the frontend delete uses Anon Key. The easiest logic change is in dashboard/page.tsx:
    // Change the insert to an UPSERT instead of INSERT + DELETE!
    // But upsert needs a unique constraint...
}

fixDuplicates();
