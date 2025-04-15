const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 查看環境變數中的令牌
console.log("檢查環境變數中的 Supabase 令牌...");
if (process.env.SUPABASE_ACCESS_TOKEN) {
  console.log(`找到環境變數中的令牌: ${process.env.SUPABASE_ACCESS_TOKEN}`);
} else {
  console.log("環境變數中沒有找到 SUPABASE_ACCESS_TOKEN");
}

// 檢查 Supabase CLI 配置文件
console.log("\n檢查 Supabase CLI 配置文件...");
try {
  const homedir = os.homedir();
  const configPath = path.join(homedir, '.supabase', 'config.json');
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.access_token) {
      console.log(`找到 CLI 配置文件中的令牌: ${config.access_token}`);
    } else {
      console.log("CLI 配置文件中沒有找到令牌");
    }
  } else {
    console.log("未找到 Supabase CLI 配置文件");
  }
} catch (error) {
  console.error("讀取配置文件時出錯:", error);
}

// 嘗試通過 CLI 獲取狀態
console.log("\n嘗試通過 CLI 獲取當前授權狀態...");
try {
  const result = execSync('npx supabase status', { encoding: 'utf8' });
  console.log("CLI 狀態:");
  console.log(result);
} catch (error) {
  console.log("執行 CLI 命令時出錯。您可能需要先登入。");
}

console.log("\n如果您需要創建新的令牌，請訪問 Supabase 網站的訪問令牌頁面。");
