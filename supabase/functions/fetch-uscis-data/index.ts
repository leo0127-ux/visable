import { serve } from 'https://deno.land/std@0.188.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS Headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Function to log messages to Supabase table
 */
async function logMessage(message: string, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  try {
    await supabase
      .from('visa_data_logs')
      .insert([{
        message,
        is_error: isError,
        created_at: timestamp
      }]);
  } catch (error) {
    console.error('Failed to log message:', error);
  }
}

/**
 * Function to fetch data from USCIS H-1B Data Hub with filters
 */
async function fetchUSCISData(
  fiscalYear: string = '2024', 
  employer: string = '',
  industry: string = '',
  state: string = '',
  city: string = '',
  zip: string = ''
): Promise<any[]> {
  try {
    logMessage(`Fetching USCIS data for FY${fiscalYear} ${employer ? `employer: ${employer}` : ''}`);
    
    // First, visit the main page to get any necessary cookies/tokens
    const baseUrl = 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub';
    const mainPageResponse = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!mainPageResponse.ok) {
      throw new Error(`Failed to load the main page: ${mainPageResponse.status}`);
    }
    
    // Construct query parameters for the actual data request
    const params = new URLSearchParams();
    params.append('fiscal_year', fiscalYear);
    if (employer) params.append('employer', employer);
    if (industry) params.append('naics', industry);
    if (state) params.append('state', state);
    if (city) params.append('city', city);
    if (zip) params.append('zip', zip);
    
    // The actual data endpoint (may need to be updated based on site inspection)
    const dataUrl = `https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub/h-1b-employer-data-hub-files`;
    
    // Download the CSV file directly using the form parameters
    const csvUrl = `${dataUrl}?${params.toString()}`;
    const dataResponse = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv,application/csv',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': baseUrl
      }
    });
    
    if (!dataResponse.ok) {
      throw new Error(`Failed to download data: ${dataResponse.status}`);
    }
    
    const csvText = await dataResponse.text();
    
    // Parse CSV
    const rows = csvText.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      
      const values = rows[i].split(',');
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || null;
      });
      
      data.push(record);
    }
    
    logMessage(`Successfully fetched ${data.length} records from USCIS`);
    return data;
  } catch (error) {
    logMessage(`Error fetching USCIS data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Transform and store the data in Supabase
 */
async function processAndStoreData(data: any[]): Promise<number> {
  try {
    if (data.length === 0) {
      logMessage('No data to process');
      return 0;
    }
    
    // Transform data to match our database schema
    const transformedData = data.map(record => ({
      employer_name: record['Employer Name'] || 'Unknown',
      job_title: record['Job Title'] || 'Not Specified',
      worksite_location: record['Worksite'] || 'Unknown',
      fiscal_year: record['Fiscal Year'] || null,
      case_status: record['Case Status'] || 'Unknown',
      visa_class: record['Visa Class'] || 'H-1B',
      wage: record['Wage'] ? parseFloat(record['Wage'].replace(/[$,]/g, '')) : null,
      wage_unit: record['Wage Unit'] || 'Year',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Clear existing data for the same fiscal year if any exists
    if (transformedData.length > 0 && transformedData[0].fiscal_year) {
      const fiscalYear = transformedData[0].fiscal_year;
      const { error: deleteError } = await supabase
        .from('visa_h1b_approvals')
        .delete()
        .eq('fiscal_year', fiscalYear);
        
      if (deleteError) {
        logMessage(`Error clearing existing data: ${deleteError.message}`, true);
        throw deleteError;
      }
    }
    
    // Insert data in batches to avoid payload limitations
    const BATCH_SIZE = 500;
    for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
      const batch = transformedData.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('visa_h1b_approvals')
        .insert(batch);
        
      if (insertError) {
        logMessage(`Error inserting batch ${i/BATCH_SIZE + 1}: ${insertError.message}`, true);
        throw insertError;
      }
      
      logMessage(`Inserted batch ${i/BATCH_SIZE + 1} of ${Math.ceil(transformedData.length/BATCH_SIZE)}`);
    }
    
    // Update metadata
    await supabase
      .from('visa_data_metadata')
      .upsert({
        table_name: 'visa_h1b_approvals',
        last_updated: new Date().toISOString(),
        record_count: transformedData.length,
        status: 'success'
      }, { onConflict: 'table_name' });
      
    return transformedData.length;
  } catch (error) {
    logMessage(`Error processing USCIS data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Main function to handle requests
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Parse request parameters
    let fiscalYear = '2024';
    let employer = '';
    let industry = '';
    let state = '';
    let city = '';
    let zip = '';
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      fiscalYear = url.searchParams.get('fiscal_year') || fiscalYear;
      employer = url.searchParams.get('employer') || '';
      industry = url.searchParams.get('industry') || '';
      state = url.searchParams.get('state') || '';
      city = url.searchParams.get('city') || '';
      zip = url.searchParams.get('zip') || '';
    } else if (req.method === 'POST') {
      const params = await req.json();
      fiscalYear = params.fiscal_year || fiscalYear;
      employer = params.employer || '';
      industry = params.industry || '';
      state = params.state || '';
      city = params.city || '';
      zip = params.zip || '';
    }
    
    // Fetch and process the data
    const data = await fetchUSCISData(fiscalYear, employer, industry, state, city, zip);
    const processedCount = await processAndStoreData(data);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully fetched and processed ${processedCount} records`,
        count: processedCount
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
