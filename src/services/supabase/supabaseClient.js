import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or key is not defined. Check your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  headers: {
    apikey: supabaseKey, // Ensure the API key is sent with every request
    Authorization: `Bearer ${supabaseKey}`, // Include the Authorization header
  },
});

export default supabase;
