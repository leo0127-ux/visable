const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase URL and key from environment variables or .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  console.log('Make sure your .env file has:');
  console.log('VITE_SUPABASE_URL=your-supabase-url');
  console.log('VITE_SUPABASE_KEY=your-supabase-key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
  console.log('Testing fetch-uscis-h1b-data function...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    console.log('Invoking function...');
    const { data, error } = await supabase.functions.invoke('fetch-uscis-h1b-data', {
      body: { fiscal_year: '2023' }
    });
    
    if (error) {
      console.error('Function invocation failed:', error);
      process.exit(1);
    }
    
    console.log('Function invocation successful!');
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEdgeFunction();
