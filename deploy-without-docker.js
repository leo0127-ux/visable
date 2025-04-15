import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取 __dirname 等價物（ESM 環境中）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置參數
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'shuovldqemjrgvjuecyc';
const FUNCTION_NAME = 'tableau-data-crawler';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('環境變數 SUPABASE_ACCESS_TOKEN 未設置');
  console.log('請運行: $env:SUPABASE_ACCESS_TOKEN="your-access-token"');
  process.exit(1);
}

// 直接使用 Supabase API 部署函數
async function deployFunction() {
  try {
    console.log(`開始部署 ${FUNCTION_NAME} 函數...`);
    
    // 讀取函數代碼
    const functionPath = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME, 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    // 讀取 import_map.json (如果存在)
    const importMapPath = path.join(__dirname, 'supabase', 'functions', 'import_map.json');
    let importMap = null;
    if (fs.existsSync(importMapPath)) {
      importMap = fs.readFileSync(importMapPath, 'utf8');
    }
    
    // 創建請求體
    const body = {
      name: FUNCTION_NAME,
      body: functionCode,
      verify_jwt: false
    };
    
    if (importMap) {
      body.import_map = importMap;
    }
    
    // 發送 API 請求
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`部署失敗: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`函數 ${FUNCTION_NAME} 部署成功!`);
    console.log(result);
    
  } catch (error) {
    console.error('部署錯誤:', error.message);
    process.exit(1);
  }
}

deployFunction();
