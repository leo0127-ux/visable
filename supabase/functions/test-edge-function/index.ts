import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Properly configured CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // CORS preflight request handler - this is critical
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Simple health check request
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Edge function is working!',
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders  // Include CORS headers
      }
    }
  );
})
