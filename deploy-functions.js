import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 確保目錄存在
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 檢查 Supabase CLI 登入狀態
const checkSupabaseLogin = () => {
  try {
    console.log('檢查 Supabase CLI 登入狀態...');
    // Try to use token from environment first
    if (process.env.SUPABASE_ACCESS_TOKEN) {
      console.log('使用環境變數中的 SUPABASE_ACCESS_TOKEN...');
      return true;
    }
    
    execSync('npx supabase projects list', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('請先登入 Supabase CLI');
    return false;
  }
};

// 部署Supabase Edge Functions
const deployFunctions = () => {
  try {
    console.log('開始部署 Supabase Edge Functions...');
    
    // 先檢查登入狀態
    if (!checkSupabaseLogin()) {
      console.log('請執行以下命令登入 Supabase CLI:');
      console.log('\nnpx supabase login\n');
      console.log('或者設置 SUPABASE_ACCESS_TOKEN 環境變數:');
      console.log('\nset SUPABASE_ACCESS_TOKEN=你的訪問令牌\n');
      process.exit(1);
    }
    
    // 確保.supabase目錄存在
    const dotSupabaseDir = path.join(__dirname, '.supabase');
    ensureDirectoryExists(dotSupabaseDir);
    ensureDirectoryExists(path.join(dotSupabaseDir, 'functions'));
    
    // 複製crontab文件到.supabase/functions目錄
    fs.copyFileSync(
      path.join(__dirname, 'supabase', 'functions', 'crontab'),
      path.join(dotSupabaseDir, 'functions', 'crontab')
    );
    
    // 部署簡單測試函數
    console.log('部署 test-function 函數...');
    execSync('npx supabase functions deploy test-function --no-verify-jwt', 
      { stdio: 'inherit' });
    
    // 部署新的測試邊緣函數
    console.log('部署 test-edge-function 函數...');
    execSync('npx supabase functions deploy test-edge-function --no-verify-jwt', 
      { stdio: 'inherit' });
    
    // 部署visa-data-fetcher函數
    console.log('部署 visa-data-fetcher 函數...');
    execSync('npx supabase functions deploy visa-data-fetcher --no-verify-jwt', 
      { stdio: 'inherit' });
    
    // 部署新的 USCIS H-1B 數據爬蟲函數
    console.log('部署 fetch-uscis-h1b-data 函數...');
    
    // Make sure CORS is properly enabled when deploying
    execSync('npx supabase functions deploy fetch-uscis-h1b-data --project-ref shuovldqemjrgvjuecyc --no-verify-jwt --legacy-bundle', 
      { stdio: 'inherit' });
    
    // 部署 Tableau 數據抓取器函數
    console.log('部署 tableau-data-crawler 函數...');
    execSync('npx supabase functions deploy tableau-data-crawler --no-verify-jwt', 
      { stdio: 'inherit' });
    
    // 部署 H1B 數據函數
    console.log('部署 h1b 函數...');
    execSync('npx supabase functions deploy h1b --no-verify-jwt', 
      { stdio: 'inherit' });
    
    console.log('函數部署成功完成');
    
    // 設置CRON任務
    console.log('設置 CRON 任務...');
    execSync('npx supabase functions deploy-cron -f .supabase/functions/crontab', 
      { stdio: 'inherit' });
    
    console.log('部署成功完成!');
  } catch (error) {
    console.error('部署失敗:', error);
    process.exit(1);
  }
};

deployFunctions();
