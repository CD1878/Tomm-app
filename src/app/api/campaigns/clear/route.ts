import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete all existing campaigns for this user to wipe out duplicates unconditionally
        const { error } = await supabaseAdmin
            .from('campaigns')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error("Clean duplicates error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
