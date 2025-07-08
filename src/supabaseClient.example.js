import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://SEU-PROJETO.supabase.co';
const supabaseKey = 'SUA-ANON-KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);
