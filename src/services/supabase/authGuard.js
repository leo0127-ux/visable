import supabase from "./supabaseClient";

const authGuard = async (onLoginRequired) => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.user) {
    if (onLoginRequired) {
      onLoginRequired(); // 呼叫傳入的登入彈窗觸發函數
    }
    return false; // 用戶未登入
  }
  return session.user; // 返回用戶資訊
};

export default authGuard;
