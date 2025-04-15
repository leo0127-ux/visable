import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取 __dirname 等價
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境變數
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'shuovldqemjrgvjuecyc'; // 你的項目 ID

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('錯誤: 環境變數 SUPABASE_ACCESS_TOKEN 未設置');
  console.log('請運行: $env:SUPABASE_ACCESS_TOKEN="你的訪問令牌"');
  process.exit(1);
}

async function deployFunctionWithoutDocker(functionName) {
  console.log(`開始部署函數 ${functionName}...`);
  
  try {
    // 讀取函數代碼
    const functionPath = path.join(__dirname, 'supabase', 'functions', functionName, 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    // 函數配置
    const config = {
      verify_jwt: false,
      import_map: './import_map.json'
    };
    
    // 部署到 Supabase
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${functionName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: functionName,
          body: functionCode,
          config: config
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`部署失敗: ${response.status} ${error}`);
    }
    
    const result = await response.json();
    console.log(`函數 ${functionName} 部署成功!`);
    return result;
  } catch (error) {
    console.error(`部署 ${functionName} 失敗:`, error.message);
    throw error;
  }
}

// 部署函數
async function main() {
  try {
    console.log('開始部署 Supabase Edge Functions (不使用 Docker)...');
    
    // 部署 fetch-uscis-h1b-data 函數
    await deployFunctionWithoutDocker('fetch-uscis-h1b-data');
    
    console.log('全部函數部署完成!');
  } catch (error) {
    console.error('部署過程中發生錯誤:', error);
    process.exit(1);
  }
}

main();
