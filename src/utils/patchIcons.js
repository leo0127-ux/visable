/**
 * This utility patches any icon-related issues by providing
 * replacement mappings for renamed or missing icons
 */

// Map of problematic icons to their replacements
const ICON_REPLACEMENTS = {
  'BriefcaseOutlined': 'ShoppingOutlined',
  'OfficeOutlined': 'BankOutlined',
  'EyeFilled': 'EyeOutlined',
  'CreditCardFilled': 'CreditCardOutlined'
};

/**
 * Patch a list of icon imports to use compatible versions
 * @param {Array} iconList - List of icon names to be checked and patched
 * @returns {Array} - Patched list of icon names
 */
export const patchIconNames = (iconList) => {
  if (!Array.isArray(iconList)) return iconList;
  
  return iconList.map(iconName => {
    // If icon needs replacement, return the replacement
    return ICON_REPLACEMENTS[iconName] || iconName;
  });
};

// Auto-execute the patching on page load
(function patchGlobalIcons() {
  // Check if @ant-design/icons is loaded
  if (window && typeof window.__ANT_ICONS__ !== 'undefined') {
    console.log('Patching Ant Design icons for compatibility');
    
    // Add missing icon exports if needed
    for (const [original, replacement] of Object.entries(ICON_REPLACEMENTS)) {
      if (window.__ANT_ICONS__[replacement] && !window.__ANT_ICONS__[original]) {
        window.__ANT_ICONS__[original] = window.__ANT_ICONS__[replacement];
      }
    }
  }
})();
