import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://esm.sh/csv-parse@5.3.6'

// 初始化Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 数据源URL
const DATA_SOURCES = {
  h1b_approvals: 'https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport.csv',
  h1b_denials: 'https://www.uscis.gov/sites/default/files/document/data/h1b_denied_datahubexport.csv',
  h1b_lca: 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Disclosure_Data_FY2023_Q2.csv',
  perm: 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/PERM_Disclosure_Data_FY2023_Q2.csv',
  prevailing_wage: 'https://www.flcdatacenter.com/download/H1BWageData.csv'
}

// 日志函数
const logMessage = (message: string): void => {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

// 处理单个数据源
async function processDataSource(source: string, url: string): Promise<number> {
  logMessage(`Processing ${source} from ${url}`)
  
  try {
    // 下载CSV文件
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    
    const csvText = await response.text()
    
    // 解析CSV
    const records: any[] = []
    const parser = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    })
    
    for await (const record of parser) {
      records.push(record)
    }
    
    // 转换记录为适合数据库的格式
    const transformedRecords = transformRecords(source, records)
    
    // 清除现有数据
    await supabase.from(`visa_${source}`).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 按批次插入数据
    const BATCH_SIZE = 1000
    for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from(`visa_${source}`).insert(batch)
      
      if (error) {
        throw error
      }
      
      logMessage(`Inserted batch ${i/BATCH_SIZE + 1}/${Math.ceil(transformedRecords.length/BATCH_SIZE)} for ${source}`)
    }
    
    // 更新元数据
    await supabase
      .from('visa_data_metadata')
      .upsert({
        table_name: `visa_${source}`,
        last_updated: new Date().toISOString(),
        record_count: transformedRecords.length,
        status: 'success'
      }, {
        onConflict: 'table_name'
      })
    
    return transformedRecords.length
  } catch (error) {
    logMessage(`Error processing ${source}: ${error.message}`)
    
    // 更新出错状态
    await supabase
      .from('visa_data_metadata')
      .upsert({
        table_name: `visa_${source}`,
        last_updated: new Date().toISOString(),
        status: `error: ${error.message}`
      }, {
        onConflict: 'table_name'
      })
    
    throw error
  }
}

// 转换记录为适合数据库的格式
function transformRecords(source: string, records: any[]): any[] {
  switch (source) {
    case 'h1b_approvals':
      return records.map(record => ({
        employer_name: record.Employer || 'Unknown',
        job_title: record['Job Title'] || 'Not Specified',
        worksite_location: record['Work Site City'] ? `${record['Work Site City']}, ${record['Work Site State']}` : 'Unknown',
        fiscal_year: record['Fiscal Year'] || null,
        wage: record['Initial Approval Amount'] ? parseFloat(record['Initial Approval Amount'].replace(/[$,]/g, '')) : null,
        case_status: 'Approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
    case 'h1b_denials':
      return records.map(record => ({
        employer_name: record.Employer || 'Unknown',
        job_title: record['Job Title'] || 'Not Specified',
        worksite_location: record['Work Site City'] ? `${record['Work Site City']}, ${record['Work Site State']}` : 'Unknown',
        fiscal_year: record['Fiscal Year'] || null,
        denial_reason: record['Denial Reason'] || 'Not Specified',
        case_status: 'Denied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    // 其他数据源的转换逻辑类似，根据数据结构调整
    default:
      return records.slice(0, 1000).map(record => ({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
  }
}

// 更新汇总统计信息
async function updateSummaryStats(): Promise<void> {
  try {
    // 获取H1B批准数量
    const { count: approvalCount } = await supabase
      .from('visa_h1b_approvals')
      .select('*', { count: 'exact', head: true })
    
    // 获取H1B拒绝数量
    const { count: denialCount } = await supabase
      .from('visa_h1b_denials')
      .select('*', { count: 'exact', head: true })
    
    // 获取平均工资
    const { data: avgWage } = await supabase
      .rpc('get_avg_prevailing_wage')
    
    // 获取绿卡批准数量
    const { count: permCount } = await supabase
      .from('visa_perm')
      .select('*', { count: 'exact', head: true })
      .eq('case_status', 'Certified')
    
    // 计算批准率
    const totalH1B = approvalCount + denialCount
    const approvalRate = totalH1B > 0 ? (approvalCount / totalH1B) * 100 : 0
    
    // 更新统计表
    await supabase
      .from('visa_data_summary')
      .upsert({
        id: '1',
        total_h1b_approvals: approvalCount,
        total_h1b_denials: denialCount,
        approval_rate: approvalRate,
        avg_prevailing_wage: avgWage?.[0]?.avg_wage || 0,
        total_green_card_approvals: permCount,
        updated_at: new Date().toISOString()
      })
    
    logMessage('Updated summary statistics')
  } catch (error) {
    logMessage(`Error updating summary statistics: ${error.message}`)
  }
}

// 清理老数据
async function cleanupOldData(): Promise<void> {
  // 设置保留期限为10年
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 10)
  const cutoffStr = cutoffDate.toISOString()
  
  try {
    for (const source of Object.keys(DATA_SOURCES)) {
      const { error } = await supabase
        .from(`visa_${source}`)
        .delete()
        .lt('created_at', cutoffStr)
      
      if (error) {
        throw error
      }
      
      logMessage(`Deleted data older than ${cutoffStr} from visa_${source}`)
    }
  } catch (error) {
    logMessage(`Error cleaning up old data: ${error.message}`)
  }
}

// 主函数
async function fetchAllData(): Promise<{ success: boolean, message: string }> {
  try {
    // 处理所有数据源
    for (const [source, url] of Object.entries(DATA_SOURCES)) {
      await processDataSource(source, url)
    }
    
    // 更新统计信息
    await updateSummaryStats()
    
    // 清理老数据
    await cleanupOldData()
    
    return { success: true, message: 'Data fetch completed successfully' }
  } catch (error) {
    return { success: false, message: `Error fetching data: ${error.message}` }
  }
}

// HTTP服务
serve(async (req) => {
  // 检查是否为定时触发或手动触发
  const { method, headers } = req
  const isScheduled = headers.get('x-scheduled-function') === 'true'
  
  // 只接受GET请求或定时触发
  if (method !== 'GET' && !isScheduled) {
    return new Response('Method not allowed', { status: 405 })
  }
  
  // 获取授权令牌
  const authHeader = headers.get('Authorization')
  const apiKey = authHeader?.replace('Bearer ', '')
  
  // 检查API密钥 (如果不是定时触发)
  if (!isScheduled && apiKey !== Deno.env.get('API_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    // 执行数据获取
    const result = await fetchAllData()
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
