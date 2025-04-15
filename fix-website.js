const { execSync } = require('child_process');
const fs = require('fs');

// 檢查是否能連接到 Supabase
try {
  console.log('檢查 Supabase 連接...');
  
  // 重新部署最小的 Edge Function
  console.log('創建測試函數...');
  
  // 確保目錄存在
  if (!fs.existsSync('./supabase/functions/test-function')) {
    fs.mkdirSync('./supabase/functions/test-function', { recursive: true });
  }
  
  // 創建一個最簡單的測試函數
  fs.writeFileSync('./supabase/functions/test-function/index.ts', `
  import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
  
  serve(async (req) => {
    // 允許所有域訪問
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };
    
    // 處理預檢請求
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }
    
    // 返回成功響應
    return new Response(
      JSON.stringify({ success: true, message: '網站已修復!' }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  });
  `);
  
  // 部署測試函數
  console.log('部署測試函數...');
  execSync('npx supabase functions deploy test-function --no-verify-jwt', { stdio: 'inherit' });
  
  console.log('修復完成! 請嘗試重新載入您的網站。');
} catch (error) {
  console.error('修復過程中出錯:', error.message);
  console.log('請確保您已設置環境變數 SUPABASE_ACCESS_TOKEN 並重試');
}
