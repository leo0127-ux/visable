import supabase from './supabaseClient';

// LinkedIn 登入
export const loginWithLinkedIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin',
  });
  if (error) throw error;
  return data;
};

// 登出
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};