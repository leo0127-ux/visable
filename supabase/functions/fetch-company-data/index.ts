import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 初始化Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const clearbitApiKey = Deno.env.get('CLEARBIT_API_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 记录API调用
async function logApiCall(apiName: string, endpoint: string, requestParams: any, statusCode: number, response: any, errorMessage: string | null = null) {
  try {
    await supabase
      .from('company_api_logs')
      .insert({
        api_name: apiName,
        endpoint: endpoint,
        request_params: requestParams,
        status_code: statusCode,
        response: response,
        error_message: errorMessage
      })
  } catch (err) {
    console.error(`Error logging API call: ${err.message}`)
  }
}

// 从Clearbit获取公司数据
async function fetchCompanyFromClearbit(domain: string) {
  if (!clearbitApiKey) {
    throw new Error('Clearbit API key not configured')
  }
  
  try {
    const url = `https://company.clearbit.com/v2/companies/find?domain=${domain}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${clearbitApiKey}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      await logApiCall('Clearbit', 'companies/find', { domain }, response.status, errorData, response.statusText)
      throw new Error(`Clearbit API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    await logApiCall('Clearbit', 'companies/find', { domain }, response.status, data)
    
    return {
      company_name: data.name,
      legal_name: data.legalName,
      company_domain: data.domain,
      logo_url: data.logo,
      website: data.domain ? `https://${data.domain}` : null,
      description: data.description,
      founded_year: data.foundedYear,
      hq_address: data.location,
      hq_city: data.city,
      hq_state: data.state,
      industry: data.category?.industry,
      sector: data.category?.sector,
      employee_count: data.metrics?.employees,
      linkedin_url: data.linkedin?.handle 
        ? `https://linkedin.com/company/${data.linkedin.handle}` : null,
      twitter_url: data.twitter?.handle 
        ? `https://twitter.com/${data.twitter.handle}` : null,
      facebook_url: data.facebook?.handle 
        ? `https://facebook.com/${data.facebook.handle}` : null,
      tags: data.tags || []
    }
  } catch (error) {
    console.error(`Error fetching from Clearbit: ${error.message}`)
    throw error
  }
}

// 保存公司数据到Supabase
async function saveCompanyToSupabase(companyData: any) {
  if (!companyData || !companyData.company_name) {
    throw new Error('Invalid company data')
  }
  
  try {
    // 检查公司是否已存在
    const { data: existingCompany } = await supabase
      .from('us_companies')
      .select('id')
      .eq('company_domain', companyData.company_domain)
      .maybeSingle()
      
    let companyId
    
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
        .select()
        
      if (error) throw error
      companyId = existingCompany.id
      console.log(`Updated company: ${companyData.company_name}`)
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
        .select()
        
      if (error) throw error
      companyId = data[0].id
      console.log(`Added new company: ${companyData.company_name}`)
    }
    
    // 处理标签
    if (companyId && companyData.tags && companyData.tags.length > 0) {
      // 清除现有标签
      await supabase
        .from('us_company_tags')
        .delete()
        .eq('company_id', companyId)
        
      // 添加新标签
      const tagInserts = companyData.tags.map((tag: string) => ({
        company_id: companyId,
        tag: tag
      }))
      
      const { error: tagError } = await supabase
        .from('us_company_tags')
        .insert(tagInserts)
        
      if (tagError) {
        console.error(`Error adding tags: ${tagError.message}`)
      }
    }
    
    // 获取完整的公司数据
    const { data: fullCompanyData, error: getError } = await supabase
      .from('us_companies')
      .select(`
        *,
        us_company_tags (tag)
      `)
      .eq('id', companyId)
      .single()
      
    if (getError) throw getError
    
    return fullCompanyData
  } catch (error) {
    console.error(`Error saving company to Supabase: ${error.message}`)
    throw error
  }
}

// 处理查找或创建公司的请求
async function findOrCreateCompany(domain: string) {
  try {
    // 首先检查Supabase中是否已存在
    const { data: existingCompany, error: findError } = await supabase
      .from('us_companies')
      .select(`
        *,
        us_company_tags (tag)
      `)
      .eq('company_domain', domain)
      .single()
      
    if (!findError && existingCompany) {
      console.log(`Company found in database: ${existingCompany.company_name}`)
      return existingCompany
    }
    
    // 如果不存在，从Clearbit获取
    console.log(`Fetching company data from Clearbit for domain: ${domain}`)
    const companyData = await fetchCompanyFromClearbit(domain)
    
    // 保存到Supabase
    return await saveCompanyToSupabase(companyData)
  } catch (error) {
    console.error(`Error in findOrCreateCompany: ${error.message}`)
    throw error
  }
}

// 处理请求
serve(async (req) => {
  // 启用CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  })
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 })
  }
  
  try {
    const url = new URL(req.url)
    const domain = url.searchParams.get('domain')
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Missing domain parameter' }),
        { headers, status: 400 }
      )
    }
    
    const result = await findOrCreateCompany(domain)
    
    return new Response(
      JSON.stringify(result),
      { headers, status: 200 }
    )
  } catch (error) {
    console.error(`Error handling request: ${error.message}`)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers, status: 500 }
    )
  }
})
