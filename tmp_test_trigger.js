const { createClient } = require('@supabase/supabase-js');
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, KEY);

async function testTrigger() {
    const testEmail = `test.luxembourg.${Date.now()}@example.com`;
    console.log("Creating user:", testEmail);

    // 1. Create User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'securepassword123',
        email_confirm: true
    });

    if (authError) {
        console.error("Auth creation failed:", authError);
        return;
    }

    const userId = authData.user.id;
    console.log("User created successfully. ID:", userId);

    // 2. Wait 1 second for the trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Check profiles table
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (profileError) {
        console.error("Error fetching profile (Trigger might have failed):", profileError);
    } else if (profile) {
        console.log("SUCCESS! Trigger created a profile row automatically.");
        console.log("Profile Data:", profile);
    } else {
        console.error("FAIL: No profile found for the new user.");
    }
}

testTrigger();
