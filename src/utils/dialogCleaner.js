/**
 * 用于清理页面上可能卡住的对话框和黑色蒙层
 */

// 需要检查和移除的选择器列表
const OVERLAY_SELECTORS = [
  '.el-overlay',
  '.el-overlay-dialog',
  'div[role="dialog"][aria-modal="true"]',
  '.ant-modal-mask',
  '.ant-modal-wrap:not(.ant-modal-wrap-visible)',
  'body > div[class*="overlay"]',
  'body > div[class*="mask"]'
];

// 需要修复的body类
const BODY_CLASSES_TO_FIX = [
  'el-popup-parent--hidden',
  'ant-modal-open',
  'no-scroll',
  'overflow-hidden'
];

/**
 * 清理所有可能卡住的对话框和蒙层
 */
export function cleanupStuckDialogs() {
  console.log('Running dialog cleanup...');
  
  // 移除所有蒙层元素
  OVERLAY_SELECTORS.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements matching ${selector}`);
      elements.forEach(el => {
        // 对于一些需要保留但隐藏的元素，设置样式而不是移除
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.zIndex = '-1';
        el.style.pointerEvents = 'none';
        
        // 如果元素有aria-modal属性，设置为false
        if (el.hasAttribute('aria-modal')) {
          el.setAttribute('aria-modal', 'false');
        }
        
        console.log('Fixed dialog element:', el);
      });
    }
  });
  
  // 修复body上的类
  const body = document.body;
  let classFixed = false;
  
  BODY_CLASSES_TO_FIX.forEach(className => {
    if (body.classList.contains(className)) {
      body.classList.remove(className);
      classFixed = true;
      console.log(`Removed class ${className} from body`);
    }
  });
  
  // 确保body可以滚动
  if (classFixed || body.style.overflow === 'hidden') {
    body.style.overflow = 'auto';
    body.style.paddingRight = '0';
    console.log('Fixed body scroll');
  }
  
  // 重新启用滚动
  window.scrollTo = window.scrollTo || function() {};
  
  return true;
}

// 页面加载时自动执行清理
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(cleanupStuckDialogs, 1000);
});

// 也添加到window.onload，以确保在所有资源加载完成后执行
window.addEventListener('load', () => {
  setTimeout(cleanupStuckDialogs, 1000);
});

// 导出清理函数，以便可以在需要时手动调用
export default cleanupStuckDialogs;
