const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Verifying Edge Function deployment...');

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFunction() {
  try {
    // List all functions
    console.log('Listing deployed functions:');
    execSync('npx supabase functions list', { stdio: 'inherit' });
    
    // Attempt to invoke the function
    console.log('\nTesting function invocation:');
    const { data, error } = await supabase.functions.invoke('fetch-uscis-h1b-data', {
      body: { fiscal_year: '2023' }
    });
    
    if (error) {
      console.error('Function invocation failed:', error.message);
      process.exit(1);
    }
    
    console.log('Function invocation successful!');
    console.log('Response:', data);
    console.log('\nVerification completed successfully');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyFunction();
