import { serve } from 'https://deno.land/std@0.188.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'
import { parse as parseCSV } from 'https://deno.land/std@0.188.0/encoding/csv.ts'

// 数据源URLs
const DATA_SOURCES = {
  h1b_approvals: 'https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport.csv',
  h1b_denials: 'https://www.uscis.gov/sites/default/files/document/data/h1b_denied_datahubexport.csv',
  h1b_lca: 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Disclosure_Data_FY2023_Q4.csv',
  perm: 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/PERM_Disclosure_Data_FY2023_Q4.csv',
  prevailing_wage: 'https://www.flcdatacenter.com/download/H1BWageData.csv'
};

// 初始化Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 日志函数
function logMessage(message: string, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // 也记录到Supabase日志表
  supabase.from('visa_data_logs').insert([{
    message,
    is_error: isError,
    created_at: new Date().toISOString()
  }]).then(null);
}

// 下载CSV数据
async function downloadCSV(url: string): Promise<string> {
  logMessage(`Downloading from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Visa Data Fetcher/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    return csvText;
  } catch (error) {
    logMessage(`Download error: ${error.message}`, true);
    throw error;
  }
}

// 解析CSV文本
async function parseCSVData(csvText: string): Promise<Array<Record<string, unknown>>> {
  try {
    // 使用Deno CSV解析器
    const parsed = await parseCSV(csvText, {
      skipFirstRow: true,
      columns: true
    });
    return parsed;
  } catch (error) {
    logMessage(`CSV parsing error: ${error.message}`, true);
    throw error;
  }
}

// 转换和清理H1B批准数据
function transformH1BApprovals(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return data.map(record => ({
    employer_name: record['Employer'] || 'Unknown',
    job_title: record['Job Title'] || 'Not Specified',
    worksite_location: record['Work Site City'] ? 
      `${record['Work Site City']}, ${record['Work Site State']}` : 'Unknown',
    fiscal_year: record['Fiscal Year'] || null,
    wage: record['Initial Approval Amount'] ? 
      parseFloat(String(record['Initial Approval Amount']).replace(/[$,]/g, '')) : null,
    case_status: 'Approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// 转换和清理H1B拒绝数据
function transformH1BDenials(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return data.map(record => ({
    employer_name: record['Employer'] || 'Unknown',
    job_title: record['Job Title'] || 'Not Specified',
    worksite_location: record['Work Site City'] ? 
      `${record['Work Site City']}, ${record['Work Site State']}` : 'Unknown',
    fiscal_year: record['Fiscal Year'] || null,
    denial_reason: record['Denial Reason'] || 'Not Specified',
    case_status: 'Denied',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// 转换和清理H1B LCA数据
function transformH1BLCA(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return data.map(record => ({
    case_number: record['CASE_NUMBER'] || null,
    employer_name: record['EMPLOYER_NAME'] || 'Unknown',
    job_title: record['JOB_TITLE'] || 'Not Specified',
    worksite_location: record['WORKSITE_CITY'] ? 
      `${record['WORKSITE_CITY']}, ${record['WORKSITE_STATE']}` : 'Unknown',
    wage: record['WAGE_RATE'] ? 
      parseFloat(String(record['WAGE_RATE']).replace(/[$,]/g, '')) : null,
    wage_unit: record['WAGE_UNIT_OF_PAY'] || null,
    submission_date: record['CASE_SUBMITTED'] || null,
    start_date: record['EMPLOYMENT_START_DATE'] || null,
    end_date: record['EMPLOYMENT_END_DATE'] || null,
    status: record['CASE_STATUS'] || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// 转换和清理PERM数据
function transformPERM(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return data.map(record => ({
    case_number: record['CASE_NUMBER'] || null,
    employer_name: record['EMPLOYER_NAME'] || 'Unknown',
    job_title: record['JOB_TITLE'] || 'Not Specified',
    worksite_location: record['EMPLOYER_CITY'] ? 
      `${record['EMPLOYER_CITY']}, ${record['EMPLOYER_STATE']}` : 'Unknown',
    wage: record['WAGE_OFFER'] ? 
      parseFloat(String(record['WAGE_OFFER']).replace(/[$,]/g, '')) : null,
    wage_unit: record['WAGE_UNIT_OF_PAY'] || null,
    filing_date: record['CASE_RECEIVED_DATE'] || null,
    case_status: record['CASE_STATUS'] || null,
    decision_date: record['DECISION_DATE'] || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// 转换和清理Prevailing Wage数据
function transformPrevailingWage(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return data.map(record => ({
    job_title: record['OCCUPATION_TITLE'] || 'Not Specified',
    area_of_employment: record['AREA_OF_EMPLOYMENT'] || 'Unknown',
    wage_level: record['WAGE_LEVEL'] || null,
    prevailing_wage: record['PREVAILING_WAGE'] ? 
      parseFloat(String(record['PREVAILING_WAGE']).replace(/[$,]/g, '')) : null,
    wage_unit: record['WAGE_PER'] || null,
    effective_date: record['BEGIN_DATE'] || null,
    expiration_date: record['END_DATE'] || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// 通用数据处理函数
async function processDataSource(type: string): Promise<number> {
  try {
    const url = DATA_SOURCES[type];
    logMessage(`Processing ${type} data from ${url}`);
    
    // 下载CSV
    const csvText = await downloadCSV(url);
    
    // 解析CSV
    const parsedData = await parseCSVData(csvText);
    logMessage(`Successfully parsed ${parsedData.length} records`);
    
    // 依据数据类型进行转换
    let transformedData;
    switch (type) {
      case 'h1b_approvals':
        transformedData = transformH1BApprovals(parsedData);
        break;
      case 'h1b_denials':
        transformedData = transformH1BDenials(parsedData);
        break;
      case 'h1b_lca':
        transformedData = transformH1BLCA(parsedData);
        break;
      case 'perm':
        transformedData = transformPERM(parsedData);
        break;
      case 'prevailing_wage':
        transformedData = transformPrevailingWage(parsedData);
        break;
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
    
    // 限制数据量，防止服务器过载
    const MAX_RECORDS = 5000;
    if (transformedData.length > MAX_RECORDS) {
      logMessage(`Limiting records from ${transformedData.length} to ${MAX_RECORDS}`);
      transformedData = transformedData.slice(0, MAX_RECORDS);
    }
    
    // 清除现有数据
    const { error: deleteError } = await supabase
      .from(`visa_${type}`)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      logMessage(`Error clearing existing data: ${deleteError.message}`, true);
      throw deleteError;
    }
    
    // 批量插入新数据
    const BATCH_SIZE = 500;
    for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
      const batch = transformedData.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from(`visa_${type}`)
        .insert(batch);
      
      if (insertError) {
        logMessage(`Error inserting batch ${i/BATCH_SIZE + 1}: ${insertError.message}`, true);
        throw insertError;
      }
      
      logMessage(`Inserted batch ${i/BATCH_SIZE + 1}/${Math.ceil(transformedData.length/BATCH_SIZE)}`);
    }
    
    // 更新元数据
    const { error: metaError } = await supabase
      .from('visa_data_metadata')
      .upsert({
        table_name: `visa_${type}`,
        last_updated: new Date().toISOString(),
        record_count: transformedData.length,
        status: 'success'
      }, { onConflict: 'table_name' });
    
    if (metaError) {
      logMessage(`Error updating metadata: ${metaError.message}`, true);
    }
    
    return transformedData.length;
  } catch (error) {
    logMessage(`Error processing ${type}: ${error.message}`, true);
    
    // 更新元数据以反映错误
    await supabase
      .from('visa_data_metadata')
      .upsert({
        table_name: `visa_${type}`,
        last_updated: new Date().toISOString(),
        status: `error: ${error.message}`
      }, { onConflict: 'table_name' });
    
    throw error;
  }
}

// 更新统计摘要信息
async function updateSummaryStatistics(): Promise<void> {
  try {
    logMessage('Updating summary statistics');
    
    // 获取H1B批准总数
    const { data: approvals, error: appError } = await supabase
      .from('visa_h1b_approvals')
      .select('*', { count: 'exact', head: true });
    
    if (appError) throw appError;
    
    // 获取H1B拒绝总数
    const { data: denials, error: denError } = await supabase
      .from('visa_h1b_denials')
      .select('*', { count: 'exact', head: true });
    
    if (denError) throw denError;
    
    // 计算H1B批准率
    const totalH1B = approvals.count + denials.count;
    const approvalRate = totalH1B > 0 ? (approvals.count / totalH1B) * 100 : 0;
    
    // 获取平均薪资
    const { data: avgWageData, error: wageError } = await supabase
      .from('visa_prevailing_wage')
      .select('prevailing_wage')
      .gt('prevailing_wage', 0);
    
    if (wageError) throw wageError;
    
    const avgWage = avgWageData.length > 0 ? 
      avgWageData.reduce((sum, record) => sum + record.prevailing_wage, 0) / avgWageData.length : 0;
    
    // 获取绿卡批准总数
    const { data: permApprovals, error: permError } = await supabase
      .from('visa_perm')
      .select('*')
      .eq('case_status', 'Certified')
      .select('*', { count: 'exact', head: true });
    
    if (permError) throw permError;
    
    // 更新摘要表
    const { error: summaryError } = await supabase
      .from('visa_data_summary')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        total_h1b_approvals: approvals.count,
        total_h1b_denials: denials.count,
        approval_rate: approvalRate,
        avg_prevailing_wage: avgWage,
        total_green_card_approvals: permApprovals.count,
        updated_at: new Date().toISOString()
      });
    
    if (summaryError) throw summaryError;
    
    logMessage('Summary statistics updated successfully');
  } catch (error) {
    logMessage(`Error updating summary statistics: ${error.message}`, true);
    throw error;
  }
}

// 清理旧数据
async function cleanupOldData(years: number = 10): Promise<void> {
  try {
    logMessage(`Cleaning up data older than ${years} years`);
    
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
    
    for (const type of Object.keys(DATA_SOURCES)) {
      const { error } = await supabase
        .from(`visa_${type}`)
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) {
        logMessage(`Error cleaning up old ${type} data: ${error.message}`, true);
      } else {
        logMessage(`Successfully cleaned up old ${type} data`);
      }
    }
  } catch (error) {
    logMessage(`Error in cleanup: ${error.message}`, true);
    throw error;
  }
}

// 主要处理函数
async function processAllDataSources(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const errors: string[] = [];
  
  logMessage('Starting data processing for all sources');
  
  for (const type of Object.keys(DATA_SOURCES)) {
    try {
      const count = await processDataSource(type);
      results[type] = count;
      logMessage(`Successfully processed ${count} records for ${type}`);
    } catch (error) {
      errors.push(`${type}: ${error.message}`);
      results[type] = 0;
    }
  }
  
  if (errors.length === 0) {
    try {
      await updateSummaryStatistics();
      await cleanupOldData();
    } catch (error) {
      errors.push(`Post-processing: ${error.message}`);
    }
  }
  
  if (errors.length > 0) {
    logMessage(`Completed with errors: ${errors.join('; ')}`, true);
  } else {
    logMessage('All data sources processed successfully');
  }
  
  return results;
}

// 监听HTTP请求的Deno服务器
serve(async (req) => {
  // 设置正确的CORS头部
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // 处理预检请求，确保返回正确状态码
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // 解析请求，支持GET参数或POST请求体
    let isManualTrigger = false;
    let action = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      isManualTrigger = url.searchParams.get('manual') === 'true';
      action = url.searchParams.get('action');
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        isManualTrigger = body.manual === true;
        action = body.action;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }

    let responseBody = {};
    
    // 如果是清理操作
    if (action === 'cleanup') {
      const years = parseInt(url.searchParams.get('years') || '10');
      await cleanupOldData(years);
      responseBody = { success: true, message: `Cleaned up data older than ${years} years` };
    }
    // 否则执行完整数据处理
    else {
      const results = await processAllDataSources();
      responseBody = { 
        success: true, 
        message: 'Data processing completed',
        results
      };
    }
    
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200 
      }
    );
  } catch (error) {
    // 如果有错误，返回错误响应
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error processing data', 
        error: error.message 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500 
      }
    );
  }
})
