/**
 * 紧急白屏修复脚本
 * 这个脚本会在主应用加载之前运行，检测白屏问题并在必要时提供备用UI
 */

(function() {
  console.log('[白屏修复] 脚本已加载');
  
  // 在页面加载完成后执行检查
  window.addEventListener('DOMContentLoaded', function() {
    console.log('[白屏修复] DOM加载完成，开始检测');
    
    // 1. 立即移除任何加载指示器，确保它们不会阻塞UI
    var initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.style.display = 'none';
      console.log('[白屏修复] 已移除加载指示器');
    }
    
    // 2. 确保root元素可见
    var rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.display = 'block';
      rootEl.style.minHeight = '100vh';
      rootEl.style.visibility = 'visible';
      rootEl.style.opacity = '1';
      console.log('[白屏修复] 已强制显示root元素');
    }
    
    // 3. 在短暂延迟后检查React是否成功渲染
    setTimeout(function() {
      checkAndRepair();
    }, 1000);
    
    // 4. 再次检查（防止延迟渲染的情况）
    setTimeout(function() {
      checkAndRepair();
    }, 3000);
  });
  
  // 页面完全加载后的最终检查
  window.addEventListener('load', function() {
    console.log('[白屏修复] 页面完全加载');
    setTimeout(checkAndRepair, 500);
  });
  
  // 检查并修复白屏问题
  function checkAndRepair() {
    var rootEl = document.getElementById('root');
    
    // 如果root元素为空或只有很少的内容，可能是渲染失败
    if (rootEl && (rootEl.children.length === 0 || rootEl.innerHTML.trim().length < 50)) {
      console.log('[白屏修复] 检测到可能的白屏问题，启动应急UI');
      
      // 添加应急UI
      renderEmergencyUI();
    } else {
      console.log('[白屏修复] 页面内容看起来正常');
    }
  }
  
  // 渲染应急UI
  function renderEmergencyUI() {
    var rootEl = document.getElementById('root');
    if (!rootEl) {
      document.body.innerHTML += '<div id="root"></div>';
      rootEl = document.getElementById('root');
    }
    
    rootEl.innerHTML = `
      <div class="emergency-container">
        <div class="emergency-header">
          <img src="/logo.png" alt="Visable" class="emergency-logo" />
        </div>
        <div class="emergency-content">
          <h1>应用加载遇到问题</h1>
          <p>我们无法正确加载应用界面。您可以尝试以下操作：</p>
          <div class="emergency-actions">
            <button onclick="window.location.reload(true)" class="emergency-button primary">
              刷新页面
            </button>
            <button onclick="localStorage.clear(); window.location.reload(true)" class="emergency-button secondary">
              清除缓存并刷新
            </button>
            <a href="/" class="emergency-button tertiary">
              返回首页
            </a>
          </div>
          <div class="emergency-help">
            <p>如果问题持续存在，请<a href="mailto:support@visable.com">联系我们的支持团队</a></p>
          </div>
        </div>
      </div>
    `;
    
    // 添加应急样式
    addEmergencyStyles();
    
    // 监听按钮操作
    document.querySelector('.emergency-button.secondary').addEventListener('click', function() {
      localStorage.clear();
      sessionStorage.clear();
      
      // 尝试清除缓存
      if ('caches' in window) {
        caches.keys().then(function(names) {
          names.forEach(function(name) {
            caches.delete(name);
          });
        });
      }
      
      window.location.reload(true);
    });
  }
  
  // 添加应急样式
  function addEmergencyStyles() {
    var style = document.createElement('style');
    style.textContent = `
      .emergency-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        padding: 0;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      .emergency-header {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        background-color: white;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .emergency-logo {
        height: 32px;
      }
      
      .emergency-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .emergency-content h1 {
        font-size: 24px;
        color: #333;
        margin-bottom: 16px;
      }
      
      .emergency-content p {
        font-size: 16px;
        color: #666;
        margin-bottom: 24px;
      }
      
      .emergency-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 32px;
      }
      
      .emergency-button {
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        text-align: center;
      }
      
      .emergency-button.primary {
        background-color: #0056E5;
        color: white;
        border: none;
      }
      
      .emergency-button.primary:hover {
        background-color: #004CCC;
      }
      
      .emergency-button.secondary {
        background-color: white;
        color: #0056E5;
        border: 1px solid #0056E5;
      }
      
      .emergency-button.secondary:hover {
        background-color: #f0f7ff;
      }
      
      .emergency-button.tertiary {
        background-color: transparent;
        color: #666;
        border: none;
      }
      
      .emergency-button.tertiary:hover {
        color: #333;
      }
      
      .emergency-help {
        font-size: 14px;
        color: #999;
      }
      
      .emergency-help a {
        color: #0056E5;
        text-decoration: none;
      }
      
      .emergency-help a:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }
})();
