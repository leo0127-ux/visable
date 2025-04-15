/**
 * 幫助與 Tableau 視覺化交互的工具函數
 */

/**
 * 初始化 Tableau API
 * @returns {Promise} 解析為 tableau 物件
 */
export const initTableau = () => {
  return new Promise((resolve, reject) => {
    if (window.tableau) {
      resolve(window.tableau);
      return;
    }

    // 如果 tableau 還未加載，等待一段時間再檢查
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (window.tableau) {
        clearInterval(interval);
        resolve(window.tableau);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Tableau API not available after multiple attempts'));
      }
    }, 500);
  });
};

/**
 * 獲取當前頁面上的 Tableau 視覺化實例
 * @returns {Promise} 解析為 viz 物件
 */
export const getViz = async () => {
  try {
    const tableau = await initTableau();
    const vizs = tableau.VizManager.getVizs();
    if (vizs && vizs.length > 0) {
      return vizs[0];
    }
    throw new Error('No Tableau visualization found on page');
  } catch (error) {
    console.error('Error getting Tableau viz:', error);
    throw error;
  }
};

/**
 * 應用過濾器到 Tableau 視覺化
 * @param {Object} filters - 要應用的過濾器物件
 */
export const applyFilters = async (filters) => {
  try {
    const viz = await getViz();
    const workbook = viz.workbook;
    
    // 應用每個過濾器
    for (const [filterName, filterValue] of Object.entries(filters)) {
      if (filterValue) {
        await workbook.changeParameterValueAsync(filterName, filterValue);
      }
    }
  } catch (error) {
    console.error('Error applying filters:', error);
    throw error;
  }
};

/**
 * 刷新 Tableau 視覺化數據
 */
export const refreshData = async () => {
  try {
    const viz = await getViz();
    await viz.refreshDataAsync();
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
};

/**
 * 獲取 Tableau 視覺化中可用的過濾器
 */
export const getAvailableFilters = async () => {
  try {
    const viz = await getViz();
    const workbook = viz.workbook;
    const activeSheet = workbook.activeSheet;
    return await activeSheet.getFiltersAsync();
  } catch (error) {
    console.error('Error getting filters:', error);
    throw error;
  }
};
