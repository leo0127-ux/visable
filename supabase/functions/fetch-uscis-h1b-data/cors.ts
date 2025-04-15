// CORS 配置幫助函數

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// 對 OPTIONS 請求的標準響應
export function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
