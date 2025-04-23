import { sampleVisaData, sampleSummary, sampleMetadata } from '../data/sampleVisaData';
import supabase from '../services/supabase/supabaseClient';

/**
 * 多源數據獲取工具
 * 嘗試從不同來源獲取簽證數據，確保始終有數據可用
 */

// 從 Supabase 獲取數據
export async function fetchVisaDataFromSupabase(dataType) {
  try {
    console.log(`嘗試從 Supabase 獲取 ${dataType} 數據...`);
    
    // 添加正確的 Accept 標頭
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey
      }
    };
    
    const { data, error } = await supabase
      .from(`visa_${dataType}`)
      .select('*', options)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`成功從 Supabase 獲取了 ${data.length} 條 ${dataType} 數據`);
      return data;
    } else {
      console.log(`Supabase 中沒有 ${dataType} 數據`);
      throw new Error('No data available');
    }
  } catch (err) {
    console.error(`從 Supabase 獲取 ${dataType} 數據失敗:`, err);
    throw err;
  }
}

// 從官方 API 獲取數據（可根據具體情況實現）
export async function fetchVisaDataFromOfficialAPI(dataType) {
  try {
    console.log(`嘗試從官方 API 獲取 ${dataType} 數據...`);
    // 這裡應該實現對官方 API 的調用
    // 如果實現較複雜，可以先返回 null 表示未實現或調用失敗
    return null;
  } catch (err) {
    console.error(`從官方 API 獲取 ${dataType} 數據失敗:`, err);
    return null;
  }
}

// 獲取示例數據
export function getVisaDataFromSamples(dataType) {
  console.log(`使用示例 ${dataType} 數據`);
  return sampleVisaData[dataType] || [];
}

// 主數據獲取函數 - 按優先順序嘗試不同來源
export async function fetchVisaData(dataType) {
  try {
    // 優先嘗試從 Supabase 獲取
    return await fetchVisaDataFromSupabase(dataType);
  } catch (err1) {
    console.log('從 Supabase 獲取數據失敗，使用示例數據:', err1.message);
    // 使用示例數據
    return getVisaDataFromSamples(dataType);
  }
}

// 獲取元數據
export async function fetchVisaMetadata(dataType) {
  try {
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey
      }
    };
    
    const { data, error } = await supabase
      .from('visa_data_metadata')
      .select('last_updated', options)
      .eq('table_name', `visa_${dataType}`)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data && data.last_updated) {
      return data.last_updated;
    }
    
    return sampleMetadata[dataType];
  } catch (err) {
    console.error(`獲取 ${dataType} 元數據失敗:`, err);
    return sampleMetadata[dataType];
  }
}

// 獲取摘要數據
export async function fetchVisaSummary() {
  try {
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey
      }
    };
    
    // 嘗試直接使用 fetch API 與適當的標頭
    const response = await fetch(
      `${supabase.supabaseUrl}/rest/v1/visa_data_summary?select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`獲取摘要數據失敗：HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        totalH1BApprovals: data[0].total_h1b_approvals || 0,
        totalH1BDenials: data[0].total_h1b_denials || 0,
        approvalRate: data[0].approval_rate || 0,
        avgPrevailingWage: data[0].avg_prevailing_wage || 0,
        totalGreenCardApprovals: data[0].total_green_card_approvals || 0
      };
    }
    
    return sampleSummary;
  } catch (err) {
    console.error('獲取摘要數據失敗:', err);
    return sampleSummary;
  }
}
