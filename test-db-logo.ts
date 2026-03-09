import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!; // using anon since they use RLS but for testing service role is better if we have it, let's try anon first if we can bypass or we'll just check the DB schema
console.log("Supabase URL:", !!supabaseUrl);
