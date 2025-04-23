/**
 * 兼容性工具函数，用于处理数据和组件问题
 */

/**
 * 安全地转换board_id字段，确保无论是UUID还是字符串形式都能正确处理
 * @param {string|Object} boardId - 需要转换的board_id值或包含board_id的对象
 * @returns {string} 标准化的UUID字符串
 */
export const normalizeBoardId = (boardId) => {
  if (!boardId) return null;
  
  // 如果是对象，提取board_id
  if (typeof boardId === 'object') {
    boardId = boardId.board_id || boardId.id;
  }
  
  // 确保是字符串
  const idStr = String(boardId);
  
  // 检查是否已经是标准UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) {
    return idStr;
  }
  
  // 尝试将非UUID格式转换为UUID格式
  try {
    // 移除任何非字母数字字符
    const cleanId = idStr.replace(/[^a-f0-9]/gi, '');
    
    // 如果长度够，尝试格式化为UUID
    if (cleanId.length >= 32) {
      return [
        cleanId.substr(0, 8),
        cleanId.substr(8, 4),
        cleanId.substr(12, 4),
        cleanId.substr(16, 4),
        cleanId.substr(20, 12)
      ].join('-');
    }
  } catch (e) {
    console.error('UUID格式化错误:', e);
  }
  
  // 返回原始值作为后备
  return idStr;
};

/**
 * 为组件或页面提供回退数据
 * @param {string} type - 数据类型，如 'board', 'chat', 'user' 等
 * @returns {Object} 回退数据
 */
export const getFallbackData = (type) => {
  const fallbacks = {
    board: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '示例板块',
      description: '这是一个示例板块，用于在数据加载失败时显示',
      created_at: new Date().toISOString(),
      icon_url: '📋'
    },
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'example@user.com',
      full_name: '示例用户'
    },
    chat: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '示例聊天',
      type: 'group',
      created_at: new Date().toISOString()
    }
  };
  
  return fallbacks[type] || {};
};

/**
 * 安全地解析JSON字符串
 * @param {string} jsonStr - JSON字符串
 * @param {Object} fallback - 解析失败时的回退值
 * @returns {Object} 解析结果或回退值
 */
export const safeParseJson = (jsonStr, fallback = {}) => {
  try {
    return typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
  } catch (e) {
    console.error('JSON解析错误:', e);
    return fallback;
  }
};

// 导出一个健康检查函数，用于监测应用状态
export const checkAppHealth = async () => {
  try {
    // 检查DOM结构
    const rootEl = document.getElementById('root');
    const appEl = document.querySelector('.app');
    const mainContentEl = document.querySelector('.main-content');
    
    // 基本DOM健康状态
    const domHealth = {
      rootExists: !!rootEl,
      appExists: !!appEl,
      mainContentExists: !!mainContentEl,
      rootVisible: rootEl ? window.getComputedStyle(rootEl).display !== 'none' : false,
      appVisible: appEl ? window.getComputedStyle(appEl).display !== 'none' : false
    };
    
    // 记录健康状态
    console.log('应用健康状态:', {
      dom: domHealth,
      timestamp: new Date().toISOString()
    });
    
    return domHealth;
  } catch (e) {
    console.error('健康检查出错:', e);
    return { error: e.message };
  }
};

// 自动执行健康检查
setTimeout(checkAppHealth, 2000);
