const { execSync } = require('child_process');
require('dotenv').config();

// Supabase URL and keys from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || '';

console.log('Testing Supabase Edge Function Connectivity');
console.log('-----------------------------------------');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Access Token Available: ${accessToken ? 'Yes' : 'No'}`);

// Test 1: Verify connection to Supabase
try {
  console.log('\n1. Testing basic Supabase connectivity...');
  const curlCommand = `curl "${supabaseUrl}/rest/v1/" -H "apikey: ${supabaseKey}"`;
  const result = execSync(curlCommand, { stdio: 'pipe' }).toString();
  console.log('✓ Connection to Supabase successful');
} catch (error) {
  console.error('✗ Failed to connect to Supabase:');
  console.error(error.message);
}

// Test 2: Verify function listing
try {
  console.log('\n2. Listing deployed functions...');
  console.log('Note: This requires SUPABASE_ACCESS_TOKEN to be set');
  execSync('npx supabase functions list', { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Failed to list functions:');
  console.error(error.message);
}

// Test 3: Try directly invoking the function
try {
  console.log('\n3. Testing direct invocation of fetch-uscis-h1b-data...');
  const functionUrl = `${supabaseUrl}/functions/v1/fetch-uscis-h1b-data`;
  const curlCommand = `curl -X POST "${functionUrl}" -H "Authorization: Bearer ${supabaseKey}" -H "Content-Type: application/json" -d '{"fiscal_year":"2023"}'`;
  console.log('Executing:', curlCommand.replace(supabaseKey, '***REDACTED***'));
  execSync(curlCommand, { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Failed to invoke function:');
  console.error(error.message);
}

console.log('\nTest completed. Check the logs above for any errors.');
