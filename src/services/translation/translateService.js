/**
 * Google Translate API服务
 */
const translateText = async (text, targetLanguage) => {
  try {
    const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('缺少Google Translate API密钥');
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        format: 'text'
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('翻译API错误:', data.error);
      throw new Error(data.error.message || '翻译失败');
    }

    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('翻译服务错误:', error);
    throw error;
  }
};

export { translateText };
