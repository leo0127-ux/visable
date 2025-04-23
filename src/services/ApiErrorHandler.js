/**
 * API错误处理服务
 */

/**
 * 处理Supabase错误
 * @param {Error} error - Supabase错误对象
 * @param {string} defaultMessage - 默认错误信息
 * @returns {string} 格式化的错误信息
 */
export const handleSupabaseError = (error, defaultMessage = 'An error occurred') => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    // 可以根据特定错误代码或消息进行更精确的错误处理
    if (error.message.includes('JWT')) {
      return 'Authentication error. Please sign in again.';
    }
    
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * 处理通用API错误
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误信息
 * @returns {string} 格式化的错误信息
 */
export const handleApiError = (error, defaultMessage = 'Failed to fetch data') => {
  console.error('API error:', error);
  
  if (error?.response) {
    // 处理HTTP错误状态码
    const status = error.response.status;
    
    if (status === 401) {
      return 'You are not authorized to perform this action. Please sign in.';
    }
    
    if (status === 403) {
      return 'You do not have permission to access this resource.';
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.response.data?.message) {
      return error.response.data.message;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * 通用的错误处理函数
 * @param {Error} error - 错误对象
 * @param {Function} callback - 错误处理回调
 * @param {string} defaultMessage - 默认错误信息
 */
export const handleError = (error, callback, defaultMessage = 'An error occurred') => {
  const errorMessage = error?.message || defaultMessage;
  console.error(errorMessage, error);
  
  if (callback && typeof callback === 'function') {
    callback(errorMessage);
  }
};
