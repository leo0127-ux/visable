import supabase from '../supabase/supabaseClient';

// 獲取所有職缺
export const fetchJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*');
  if (error) throw error;
  return data;
};