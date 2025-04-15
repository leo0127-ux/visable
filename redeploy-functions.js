const { execSync } = require('child_process');

console.log('重新部署 Supabase Edge Functions...');

// 确保已登录 Supabase CLI
try {
  console.log('链接到 Supabase 项目...');
  execSync('npx supabase link', { stdio: 'inherit' });
  
  console.log('重新部署 visa-data-fetcher 函数...');
  execSync('npx supabase functions deploy visa-data-fetcher --no-verify-jwt', { stdio: 'inherit' });
  
  console.log('函数部署完成！');
} catch (error) {
  console.error('部署过程中发生错误:', error);
}
