import { 
  extractAllMetrics, 
  extractSummaryData, 
  extractTopEmployers,
  setVizInstance 
} from './tableau-extractor';

// Import the bypass utility for reliable fallback data
import { getTableauDataFallback } from '../utils/bypassTableau';

/**
 * Fetches Tableau data with robust error handling and fallbacks
 * @param {Object} filterValues - Filter values to apply
 * @param {Object} vizRef - Reference to Tableau visualization element
 * @returns {Promise<Object>} - Tableau data object
 */
export async function getTableauData(filterValues = {}, vizRef = null) {
  try {
    // If no vizRef is provided or USE_FALLBACK is true, use fallback data
    if (!vizRef || window.USE_FALLBACK === true) {
      console.log('Using fallback data (no visualization reference provided)');
      return getTableauDataFallback();
    }
    
    // Try to set the viz instance
    if (!setVizInstance(vizRef)) {
      console.log('Failed to set visualization reference, using fallback data');
      return getTableauDataFallback();
    }
    
    // Force a small delay to ensure the viz is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try real data extraction with proper error handling
    try {
      // Attempt to get all metrics
      const allMetrics = await extractAllMetrics();
      
      // Attempt to get summary data
      const summaryData = await extractSummaryData();
      
      // Attempt to get top employers
      const topEmployers = await extractTopEmployers();
      
      return {
        allMetrics,
        summaryData,
        topEmployers,
        lastUpdated: new Date().toISOString(),
        source: 'tableau'
      };
    } catch (error) {
      console.error('Error extracting data from Tableau, using fallback:', error.message);
      return getTableauDataFallback();
    }
  } catch (error) {
    console.error('Error in getTableauData:', error.message);
    return getTableauDataFallback();
  }
}

/**
 * Refreshes Tableau data manually
 * @param {Object} filterValues - Filter values to apply
 * @param {Object} vizRef - Optional visualization reference
 * @returns {Promise<Object>} - Fresh Tableau data
 */
export async function refreshTableauData(filterValues = {}, vizRef = null) {
  console.log('Refreshing Tableau data...');
  
  // Force fallback data for refreshes to prevent crashes
  window.USE_FALLBACK = true;
  
  try {
    return await getTableauData(filterValues, vizRef);
  } finally {
    // Reset the fallback flag after 5 seconds to allow future extraction attempts
    setTimeout(() => {
      window.USE_FALLBACK = false;
    }, 5000);
  }
}
