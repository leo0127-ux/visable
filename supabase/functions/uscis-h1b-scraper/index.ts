import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// USCIS H1B Data Hub configuration
const USCIS_CROSSTAB_URL = 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub/h-1b-employer-data-hub-files'
const USCIS_CROSSTAB_API = 'https://www.uscis.gov/api/dataset/h-1b-employers-ajax'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 解析CSV数据并提取雇主信息
 */
function parseEmployerData(csvData: string, fiscalYear: string) {
  try {
    // 按行分割CSV
    const rows = csvData.split('\n')
    if (rows.length < 2) {
      throw new Error('CSV数据为空或格式不正确')
    }
    
    // 解析表头
    const headers = parseCSVLine(rows[0])
    console.log(`CSV 表头: ${headers.join(', ')}`)
    
    // 查找关键列索引
    const employerNameIdx = headers.findIndex(h => h.toLowerCase().includes('employer'))
    const initialApprovalsIdx = headers.findIndex(h => h.toLowerCase().includes('initial approval'))
    const initialDenialsIdx = headers.findIndex(h => h.toLowerCase().includes('initial denial'))
    const continueApprovalsIdx = headers.findIndex(h => h.toLowerCase().includes('continuing approval'))
    const continueDenialsIdx = headers.findIndex(h => h.toLowerCase().includes('continuing denial'))
    
    if (employerNameIdx === -1) {
      throw new Error(`找不到雇主名称列`)
    }
    
    // 处理数据
    const employers: Record<string, any> = {}
    
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue
      
      const values = parseCSVLine(rows[i])
      if (values.length <= employerNameIdx) continue
      
      const employerName = values[employerNameIdx].trim()
      if (!employerName) continue
      
      // 解析数值
      let initialApprovals = 0
      let initialDenials = 0
      let continueApprovals = 0
      let continueDenials = 0
      
      if (initialApprovalsIdx > -1 && values[initialApprovalsIdx]) {
        initialApprovals = parseInt(values[initialApprovalsIdx].replace(/[",]/g, '')) || 0
      }
      
      if (initialDenialsIdx > -1 && values[initialDenialsIdx]) {
        initialDenials = parseInt(values[initialDenialsIdx].replace(/[",]/g, '')) || 0
      }
      
      if (continueApprovalsIdx > -1 && values[continueApprovalsIdx]) {
        continueApprovals = parseInt(values[continueApprovalsIdx].replace(/[",]/g, '')) || 0
      }
      
      if (continueDenialsIdx > -1 && values[continueDenialsIdx]) {
        continueDenials = parseInt(values[continueDenialsIdx].replace(/[",]/g, '')) || 0
      }
      
      // 计算总数
      const totalApprovals = initialApprovals + continueApprovals
      const totalDenials = initialDenials + continueDenials
      const totalApplications = totalApprovals + totalDenials
      
      // 处理雇主数据
      if (!employers[employerName]) {
        employers[employerName] = {
          name: employerName,
          total: 0,
          approved: 0,
          denied: 0
        }
      }
      
      employers[employerName].total += totalApplications
      employers[employerName].approved += totalApprovals
      employers[employerName].denied += totalDenials
    }
    
    // 计算批准率和转换为数组格式
    return Object.values(employers).map(emp => {
      const approvalRate = emp.total > 0 ? (emp.approved / emp.total * 100).toFixed(1) : '0.0'
      return {
        ...emp,
        approvalRate: parseFloat(approvalRate),
        fiscalYear
      }
    }).sort((a, b) => b.total - a.total)
  } catch (err) {
    console.error('解析CSV数据失败:', err)
    throw err
  }
}

/**
 * 解析CSV行，处理引号内的逗号
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ''
  let inQuote = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuote = !inQuote
    } else if (char === ',' && !inQuote) {
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  
  values.push(currentValue)
  return values
}

/**
 * 获取USCIS H1B雇主数据
 */
async function fetchH1BEmployerData(fiscalYear: string) {
  console.log(`获取${fiscalYear}财年H1B雇主数据...`)
  
  try {
    // 构建请求参数
    const params = new URLSearchParams({
      fiscalYear,
      employerName: '',
      workState: '',
      workCity: '',
      naics: '',
      format: 'csv'
    })
    
    // 发送请求
    const response = await fetch(USCIS_CROSSTAB_API, {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/csv,application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }
    
    const csvData = await response.text()
    if (!csvData || csvData.length < 100) {
      throw new Error('返回的CSV数据无效或为空')
    }
    
    console.log(`成功获取CSV数据，大小: ${csvData.length} 字节`)
    
    // 解析CSV数据
    const employerData = parseEmployerData(csvData, fiscalYear)
    
    // 缓存数据到Supabase
    await saveToCache(employerData)
    
    // 保存数据到雇主表
    await saveToEmployerTable(employerData, fiscalYear)
    
    return {
      success: true,
      data: employerData.slice(0, 100), // 只返回前100条数据
      count: employerData.length,
      fiscalYear
    }
  } catch (err) {
    console.error('获取H1B雇主数据失败:', err)
    throw err
  }
}

/**
 * 保存数据到缓存表
 */
async function saveToCache(data: any[]) {
  try {
    const { error } = await supabase
      .from('h1b_top_employers_cache')
      .insert({
        data: JSON.stringify(data),
        created_at: new Date().toISOString(),
        source: 'USCIS Crosstab API'
      })
    
    if (error) throw error
    console.log('成功保存数据到缓存')
  } catch (err) {
    console.error('保存数据到缓存失败:', err)
  }
}

/**
 * 保存数据到雇主表
 */
async function saveToEmployerTable(data: any[], fiscalYear: string) {
  try {
    // 转换数据格式
    const records = data.map(emp => ({
      employer_name: emp.name,
      fiscal_year: fiscalYear,
      total_petitions: emp.total,
      approved_petitions: emp.approved,
      denied_petitions: emp.denied,
      approval_rate: emp.approvalRate,
      data_date: new Date().toISOString()
    }))
    
    // 批量插入，每批500条
    const BATCH_SIZE = 500
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      
      const { error } = await supabase
        .from('h1b_employer_data')
        .upsert(batch, {
          onConflict: 'employer_name,fiscal_year',
          ignoreDuplicates: false
        })
      
      if (error) throw error
    }
    
    console.log(`成功保存${records.length}条记录到雇主表`)
  } catch (err) {
    console.error('保存数据到雇主表失败:', err)
  }
}

// HTTP服务
serve(async (req) => {
  try {
    // 跨域支持
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    })
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }
    
    // 从请求中获取fiscal_year参数
    const url = new URL(req.url)
    const fiscalYear = url.searchParams.get('fiscal_year') || '2024'
    
    // 获取H1B雇主数据
    const result = await fetchH1BEmployerData(fiscalYear)
    
    return new Response(
      JSON.stringify(result),
      { headers, status: 200 }
    )
  } catch (err) {
    console.error('处理请求失败:', err)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message || '获取数据失败'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    )
  }
})
