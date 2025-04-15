import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'https://deno.land/std@0.177.0/crypto/mod.ts';

// CORS headers - Critical for browser fetch requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // CRITICAL: Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,  // No Content is the appropriate response for OPTIONS
      headers: corsHeaders
    });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // For now, just return mocked data
    const mockData = {
      summary: {
        totalApprovals: '142,589',
        totalDenials: '23,641',
        approvalRate: '85.8%',
        averageSalary: '$123,456'
      },
      topEmployers: [
        { name: 'Amazon', approvals: 12500, applications: 14000 },
        { name: 'Google', approvals: 9800, applications: 11000 },
        { name: 'Microsoft', approvals: 8700, applications: 9500 },
        { name: 'Facebook', approvals: 5600, applications: 6100 },
        { name: 'Apple', approvals: 4300, applications: 5000 },
      ],
      industries: [
        { name: 'Information Technology', count: 85600, percentage: 60 },
        { name: 'Healthcare', count: 21400, percentage: 15 },
        { name: 'Finance', count: 14200, percentage: 10 },
        { name: 'Education', count: 7100, percentage: 5 },
        { name: 'Manufacturing', count: 5700, percentage: 4 },
      ],
      geography: [
        { state: 'California', count: 42700 },
        { state: 'Texas', count: 21400 },
        { state: 'New York', count: 17100 },
        { state: 'Washington', count: 11400 },
        { state: 'Illinois', count: 8500 },
      ],
      salaries: [
        { category: 'Software Engineers', averageSalary: 145000, medianSalary: 139000 },
        { category: 'Data Scientists', averageSalary: 152000, medianSalary: 148000 },
        { category: 'Product Managers', averageSalary: 163000, medianSalary: 158000 },
        { category: 'Financial Analysts', averageSalary: 128000, medianSalary: 122000 },
        { category: 'Healthcare Professionals', averageSalary: 138000, medianSalary: 132000 },
      ]
    };

    // IMPORTANT: Include CORS headers in successful response too
    return new Response(
      JSON.stringify({
        source: 'tableau-data-crawler',
        data: mockData
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error in tableau-data-crawler:', error);
    
    // Include CORS headers in error responses as well
    return new Response(
      JSON.stringify({
        error: `Error processing request: ${error.message}`
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
