import { createClient } from '@supabase/supabase-js';

// We only need this on the server side for now, or if exposed to client we use NEXT_PUBLIC.
// The master plan says "Server-side Supabase singleton". So we shouldn't use NEXT_PUBLIC if it's strictly server-side, 
// but we need a URL and Key. For now, let's assume they are set in env.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
