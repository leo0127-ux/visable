import React, { createContext, useState, useContext, useEffect } from 'react';
import supabase from '../services/supabase/supabaseClient';

// 創建語言上下文
const LanguageContext = createContext();

// 支持的語言列表
const SUPPORTED_LANGUAGES = ['en', 'zh_TW', 'zh_CN', 'hi', 'ko', 'vi'];

// 語言與地理區域映射
const GEO_LANGUAGE_MAP = {
  'zh-CN': 'zh_CN',  // 中國大陸
  'zh-SG': 'zh_CN',  // 新加坡
  'zh-HK': 'zh_TW',  // 香港
  'zh-TW': 'zh_TW',  // 台灣
  'hi': 'hi',        // 印度
  'ko': 'ko',        // 韓國
  'vi': 'vi',        // 越南
};

// 創建語言提供者組件
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(null);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // 偵測用戶首選語言
  useEffect(() => {
    const detectUserLanguage = async () => {
      try {
        // 首先檢查是否已經在本地存儲中設置了語言偏好
        const storedLanguage = localStorage.getItem('preferredLanguage');
        
        if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage)) {
          setLanguage(storedLanguage);
          return;
        }
        
        // 如果沒有存儲的語言偏好，則檢查用戶的瀏覽器語言設置
        const browserLang = navigator.language || navigator.userLanguage;
        console.log('Browser language:', browserLang);
        
        // 嘗試根據瀏覽器語言匹配支持的語言
        let detectedLanguage = 'en'; // 默認為英語
        
        // 檢查是否直接匹配支持的語言
        if (SUPPORTED_LANGUAGES.includes(browserLang)) {
          detectedLanguage = browserLang;
        }
        // 檢查是否匹配地理區域映射
        else if (GEO_LANGUAGE_MAP[browserLang]) {
          detectedLanguage = GEO_LANGUAGE_MAP[browserLang];
        }
        // 檢查語言的主要部分 (如 zh-TW -> zh)
        else {
          const primaryLang = browserLang.split('-')[0];
          
          // 對於中文，默認使用簡體中文
          if (primaryLang === 'zh') {
            detectedLanguage = 'zh_CN';
          }
          // 檢查其他支持的語言
          else if (SUPPORTED_LANGUAGES.includes(primaryLang)) {
            detectedLanguage = primaryLang;
          }
        }
        
        // 設置並存儲檢測到的語言
        setLanguage(detectedLanguage);
        localStorage.setItem('preferredLanguage', detectedLanguage);
        
      } catch (error) {
        console.error("Error detecting language:", error);
        setLanguage('en'); // 出錯時默認為英語
      }
    };
    
    detectUserLanguage();
  }, []);

  // 載入翻譯資料
  useEffect(() => {
    const loadTranslations = async () => {
      if (!language) return;
      
      try {
        setLoading(true);
        
        // 嘗試從翻譯文件加載翻譯
        const translationsData = await import(`../translations/${language}.json`).catch(() => {
          console.warn(`No translations found for ${language}, falling back to English`);
          return import(`../translations/en.json`);
        });
        
        setTranslations(translationsData.default);
      } catch (error) {
        console.error("Error loading translations:", error);
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // 切換語言並保存到 localStorage
  const changeLanguage = async (newLanguage, userId) => {
    // 保存到本地存儲
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // 如果有用戶ID，也更新到數據庫
    if (userId) {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (data) {
          await supabase
            .from("user_preferences")
            .update({ language: newLanguage })
            .eq("user_id", userId);
        } else {
          await supabase
            .from("user_preferences")
            .insert({ user_id: userId, language: newLanguage });
        }
      } catch (err) {
        console.error("Error updating language preference:", err);
      }
    }
    
    // 更新語言設置
    setLanguage(newLanguage);
    
    // 重新載入頁面以應用新語言
    window.location.reload();
  };

  // 翻譯輔助函數
  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      t, 
      loading,
      supportedLanguages: SUPPORTED_LANGUAGES 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 創建便捷的 hook 以供組件使用
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
