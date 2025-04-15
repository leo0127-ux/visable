import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// 使用最簡單的配置來避免額外的問題
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
