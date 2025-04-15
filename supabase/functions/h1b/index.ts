import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to add to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const shouldRefresh = url.searchParams.get('refresh') === 'true';
    
    // Get summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('visa_data_summary')
      .select('*')
      .limit(1)
      .single();
      
    if (summaryError) throw summaryError;
    
    // Get top employers
    const { data: employersData, error: employersError } = await supabase
      .from('visa_h1b_approvals')
      .select('employer_name, job_title, wage')
      .order('wage', { ascending: false })
      .limit(10);
      
    if (employersError) throw employersError;
    
    // Format the data as needed for the frontend
    const result = {
      summary: {
        totalApprovals: summaryData.total_h1b_approvals.toLocaleString(),
        totalDenials: summaryData.total_h1b_denials.toLocaleString(),
        approvalRate: `${summaryData.approval_rate.toFixed(1)}%`,
        averageSalary: `$${summaryData.avg_prevailing_wage.toLocaleString()}`
      },
      topEmployers: employersData.map(emp => ({
        name: emp.employer_name,
        job_title: emp.job_title,
        approvals: Math.floor(Math.random() * 1000) + 500, // Sample data until we have real counts
        applications: Math.floor(Math.random() * 1500) + 700
      })),
      // Add other sections as needed based on your database schema
      industries: [],
      geography: [],
      salaries: []
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error in h1b function:', error);
    
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
})
