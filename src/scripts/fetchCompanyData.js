import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

// 初始化Supabase客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API密钥
const CLEARBIT_API_KEY = process.env.CLEARBIT_API_KEY || ''; // 注册获取: https://clearbit.com/
const COMPANY_API_KEY = process.env.COMPANY_API_KEY || '';   // 注册获取: https://company.info/

// 日志设置
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(LOG_DIR, `company_data_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  console.log(`[${timestamp}] ${message}`);
};

// 记录API调用
const logApiCall = async (apiName, endpoint, requestParams, statusCode, response, errorMessage = null) => {
  try {
    const { data, error } = await supabase
      .from('company_api_logs')
      .insert({
        api_name: apiName,
        endpoint: endpoint,
        request_params: requestParams,
        status_code: statusCode,
        response: response,
        error_message: errorMessage
      });
      
    if (error) {
      logToFile(`Error logging API call: ${error.message}`);
    }
  } catch (err) {
    logToFile(`Exception logging API call: ${err.message}`);
  }
};

// 从Clearbit获取公司数据
const fetchCompanyDataFromClearbit = async (domain) => {
  if (!CLEARBIT_API_KEY) {
    logToFile('Clearbit API key not configured');
    return null;
  }
  
  try {
    const url = `https://company.clearbit.com/v2/companies/find?domain=${domain}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${CLEARBIT_API_KEY}`
      }
    });
    
    await logApiCall('Clearbit', 'companies/find', { domain }, response.status, response.data);
    
    return {
      company_name: response.data.name,
      legal_name: response.data.legalName,
      company_domain: response.data.domain,
      logo_url: response.data.logo,
      website: response.data.domain ? `https://${response.data.domain}` : null,
      description: response.data.description,
      founded_year: response.data.foundedYear,
      hq_address: response.data.location,
      hq_city: response.data.city,
      hq_state: response.data.state,
      industry: response.data.category?.industry,
      sector: response.data.category?.sector,
      employee_count: response.data.metrics?.employees,
      linkedin_url: response.data.linkedin?.handle 
        ? `https://linkedin.com/company/${response.data.linkedin.handle}` : null,
      twitter_url: response.data.twitter?.handle 
        ? `https://twitter.com/${response.data.twitter.handle}` : null,
      facebook_url: response.data.facebook?.handle 
        ? `https://facebook.com/${response.data.facebook.handle}` : null,
      tags: response.data.tags || []
    };
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const responseData = error.response?.data || {};
    
    await logApiCall(
      'Clearbit', 
      'companies/find', 
      { domain }, 
      statusCode, 
      responseData, 
      error.message
    );
    
    logToFile(`Error fetching data from Clearbit for ${domain}: ${error.message}`);
    return null;
  }
};

// 保存公司数据到Supabase
const saveCompanyToSupabase = async (companyData) => {
  if (!companyData || !companyData.company_name) {
    logToFile('Invalid company data');
    return null;
  }
  
  try {
    // 检查公司是否已存在
    const { data: existingCompany } = await supabase
      .from('us_companies')
      .select('id')
      .eq('company_domain', companyData.company_domain)
      .maybeSingle();
      
    let companyId;
    
    if (existingCompany) {
      // 更新现有公司
      const { data, error } = await supabase
        .from('us_companies')
        .update({
          company_name: companyData.company_name,
          legal_name: companyData.legal_name,
          website: companyData.website,
          logo_url: companyData.logo_url,
          founded_year: companyData.founded_year,
          hq_address: companyData.hq_address,
          hq_city: companyData.hq_city,
          hq_state: companyData.hq_state,
          industry: companyData.industry,
          sector: companyData.sector,
          description: companyData.description,
          employee_count: companyData.employee_count,
          linkedin_url: companyData.linkedin_url,
          twitter_url: companyData.twitter_url,
          facebook_url: companyData.facebook_url,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingCompany.id)
        .select('id')
        .single();
        
      if (error) throw error;
      companyId = existingCompany.id;
      logToFile(`Updated company: ${companyData.company_name}`);
    } else {
      // 创建新公司
      const { data, error } = await supabase
        .from('us_companies')
        .insert({
          company_name: companyData.company_name,
          legal_name: companyData.legal_name,
          website: companyData.website,
          company_domain: companyData.company_domain,
          logo_url: companyData.logo_url,
          founded_year: companyData.founded_year,
          hq_address: companyData.hq_address,
          hq_city: companyData.hq_city,
          hq_state: companyData.hq_state,
          industry: companyData.industry,
          sector: companyData.sector,
          description: companyData.description,
          employee_count: companyData.employee_count,
          linkedin_url: companyData.linkedin_url,
          twitter_url: companyData.twitter_url,
          facebook_url: companyData.facebook_url
        })
        .select('id')
        .single();
        
      if (error) throw error;
      companyId = data.id;
      logToFile(`Added new company: ${companyData.company_name}`);
    }
    
    // 处理标签
    if (companyId && companyData.tags && companyData.tags.length > 0) {
      // 清除现有标签
      await supabase
        .from('us_company_tags')
        .delete()
        .eq('company_id', companyId);
        
      // 添加新标签
      const tagInserts = companyData.tags.map(tag => ({
        company_id: companyId,
        tag: tag
      }));
      
      const { error: tagError } = await supabase
        .from('us_company_tags')
        .insert(tagInserts);
        
      if (tagError) {
        logToFile(`Error adding tags: ${tagError.message}`);
      } else {
        logToFile(`Added ${tagInserts.length} tags for company ${companyData.company_name}`);
      }
    }
    
    return companyId;
  } catch (error) {
    logToFile(`Error saving company to Supabase: ${error.message}`);
    return null;
  }
};

// 主函数：处理公司域名列表
const processCompanyDomains = async (domains) => {
  logToFile(`Starting to process ${domains.length} company domains`);
  
  for (const domain of domains) {
    logToFile(`Processing company with domain: ${domain}`);
    
    try {
      // 从Clearbit获取数据
      const companyData = await fetchCompanyDataFromClearbit(domain);
      
      if (companyData) {
        // 保存到Supabase
        const companyId = await saveCompanyToSupabase(companyData);
        
        if (companyId) {
          logToFile(`Successfully processed company: ${companyData.company_name}`);
        } else {
          logToFile(`Failed to save company with domain: ${domain}`);
        }
      } else {
        logToFile(`No data found for domain: ${domain}`);
      }
      
      // 添加延迟以避免API速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logToFile(`Error processing domain ${domain}: ${error.message}`);
    }
  }
  
  logToFile('Finished processing all company domains');
};

// 从文件加载公司域名
const loadCompanyDomainsFromFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    logToFile(`Error loading company domains from file: ${error.message}`);
    return [];
  }
};

// 从标准输入加载公司域名
const loadCompanyDomainsFromStdin = async () => {
  return new Promise((resolve) => {
    let data = '';
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')));
    });
  });
};

// 主程序入口
const main = async () => {
  let domains = [];
  
  // 检查命令行参数
  if (process.argv.length > 2) {
    const filePath = process.argv[2];
    domains = loadCompanyDomainsFromFile(filePath);
  } else if (!process.stdin.isTTY) {
    // 从标准输入读取域名
    domains = await loadCompanyDomainsFromStdin();
  } else {
    // 示例域名
    domains = [
      'apple.com',
      'google.com',
      'microsoft.com',
      'amazon.com',
      'facebook.com'
    ];
    logToFile('Using sample domains. To process your own domains, provide a file path or pipe a list of domains.');
  }
  
  if (domains.length > 0) {
    await processCompanyDomains(domains);
  } else {
    logToFile('No domains to process');
  }
};

// 执行主程序
main().catch(error => {
  logToFile(`Main process error: ${error.message}`);
  process.exit(1);
});
