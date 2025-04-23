import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 初始化Supabase客戶端
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// USCIS H1B雇主數據中心URL
const USCIS_EMPLOYER_URL = 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub'

// 記錄函數
const log = (message: string, isError = false) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
  
  // 將日誌寫入數據庫
  supabase.from('visa_data_logs').insert({
    message,
    is_error: isError,
    created_at: timestamp
  }).then(() => {}).catch(err => {
    console.error('記錄日誌時出錯:', err)
  })
}

// 從USCIS網站抓取H1B雇主數據
async function scrapeUSCISEmployerData() {
  try {
    log('開始從USCIS網站抓取H1B雇主數據')
    
    const response = await fetch(USCIS_EMPLOYER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP錯誤: ${response.status} ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // 使用正則表達式查找雇主數據表格
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i)
    if (!tableMatch) {
      throw new Error('網頁中找不到雇主數據表格')
    }
    
    const tableHtml = tableMatch[0]
    
    // 解析表格行
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const rows = []
    let match
    
    while ((match = rowRegex.exec(tableHtml)) !== null) {
      rows.push(match[1])
    }
    
    // 跳過標題行
    const employerData = []
    for (let i = 1; i < rows.length; i++) {
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
      const cells = []
      let cellMatch
      
      while ((cellMatch = cellRegex.exec(rows[i])) !== null) {
        // 移除HTML標籤
        const cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim()
        cells.push(cellText)
      }
      
      if (cells.length >= 3) {
        const total = parseInt(cells[1].replace(/,/g, ''), 10) || 0
        const approved = parseInt(cells[2].replace(/,/g, ''), 10) || 0
        const denied = total - approved
        const approvalRate = total > 0 ? (approved / total) * 100 : 0
        
        employerData.push({
          employer_name: cells[0],
          total,
          approved,
          denied,
          approval_rate: parseFloat(approvalRate.toFixed(1)),
          fiscal_year: new Date().getFullYear().toString(),
          created_at: new Date().toISOString()
        })
      }
    }
    
    if (employerData.length === 0) {
      throw new Error('未能從網頁中提取雇主數據')
    }
    
    log(`成功抓取了${employerData.length}條雇主數據`)
    return employerData
  } catch (error) {
    log(`抓取雇主數據失敗: ${error.message}`, true)
    throw error
  }
}

// 將數據保存到數據庫
async function saveEmployerData(employerData: any[]) {
  try {
    log('開始保存雇主數據到數據庫')
    
    // 清空現有的雇主數據
    const { error: deleteError } = await supabase
      .from('h1b_employers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      throw deleteError
    }
    
    // 插入新的雇主數據
    const { error: insertError } = await supabase
      .from('h1b_employers')
      .insert(employerData)
    
    if (insertError) {
      throw insertError
    }
    
    // 保存緩存
    const { error: cacheError } = await supabase
      .from('h1b_top_employers_cache')
      .insert({
        data: employerData,
        source: 'edge-function',
        created_at: new Date().toISOString()
      })
    
    if (cacheError) {
      log(`保存緩存數據失敗: ${cacheError.message}`, true)
      // 繼續執行，不因緩存失敗而中斷
    }
    
    log('雇主數據保存成功')
    return true
  } catch (error) {
    log(`保存雇主數據失敗: ${error.message}`, true)
    throw error
  }
}

// 主處理函數
async function processH1BData(manual = false) {
  try {
    const startTime = new Date()
    log(`開始${manual ? '手動' : '自動'}H1B數據抓取過程`)
    
    // 抓取USCIS雇主數據
    const employerData = await scrapeUSCISEmployerData()
    
    // 保存到數據庫
    await saveEmployerData(employerData)
    
    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000
    log(`H1B數據抓取過程成功完成，耗時${duration}秒`)
    
    return {
      success: true,
      message: `成功更新了${employerData.length}條雇主數據`,
      count: employerData.length,
      duration
    }
  } catch (error) {
    log(`H1B數據抓取過程失敗: ${error.message}`, true)
    return {
      success: false,
      message: `數據抓取失敗: ${error.message}`,
      error: error.message
    }
  }
}

// HTTP服務
serve(async (req) => {
  // 檢查是否為定時觸發或手動觸發
  const { method, headers } = req
  const isScheduled = headers.get('x-scheduled-function') === 'true'
  const url = new URL(req.url)
  const isManualTrigger = url.searchParams.get('manual') === 'true'
  
  // 只接受GET請求或定時觸發
  if (method !== 'GET' && !isScheduled) {
    return new Response('Method not allowed', { status: 405 })
  }
  
  // 如果不是定時觸發，則檢查API密鑰
  if (!isScheduled) {
    const authHeader = headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    
    // 檢查API密鑰
    if (apiKey !== Deno.env.get('API_SECRET_KEY')) {
      return new Response('Unauthorized', { status: 401 })
    }
  }
  
  try {
    // 執行數據獲取
    const result = await processH1BData(isManualTrigger)
    
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
