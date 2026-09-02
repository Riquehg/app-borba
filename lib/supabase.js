import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfjfwmaqjfmjbkscyafm.supabase.co';
const supabaseAnonKey = 'sb_publishable_xm4cSUopv-ji7H6P8f6gdw_lYYmY0hB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
