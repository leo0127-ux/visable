/**
 * Comprehensive solution for handling Tableau-related errors including:
 * - Runtime errors about message ports closing
 * - Deprecation warnings for DOM events
 * - Extension conflicts
 * - React component errors
 */
export function fixTableauErrors() {
  // Tableau debugging flag - set this to true for troubleshooting
  const enableTableauLogs = false;
  
  // 1. Handle the "message port closed" errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Skip specific error patterns related to Tableau and Chrome extensions
    if (args[0] && typeof args[0] === 'string') {
      // Ignore Chrome extension errors
      if (args[0].includes('chrome-extension://') || 
          args[0].includes('extension://') ||
          args[0].includes('Receiving end does not exist')) {
        return;
      }
      
      // Ignore Tableau errors
      if (args[0].includes('message port closed') || 
          args[0].includes('runtime.lastError') ||
          args[0].includes('Tableau') || 
          args[0].includes('tableau-viz')) {
        if (enableTableauLogs) {
          console.log('[Tableau Error Suppressed]:', args[0]);
        }
        return;
      }
    }
    
    // Pass other errors through to the original console.error
    originalConsoleError.apply(console, args);
  };
  
  // 2. Prevent deprecated DOM events used by Tableau
  if (typeof Element !== 'undefined' && Element.prototype) {
    const originalAddEventListener = Element.prototype.addEventListener;
    
    Element.prototype.addEventListener = function(type, listener, options) {
      // Replace deprecated DOM mutation events with MutationObserver
      if (type === 'DOMSubtreeModified' || 
          type === 'DOMNodeInserted' || 
          type === 'DOMNodeRemoved') {
        
        // Create MutationObserver instead
        try {
          const observer = new MutationObserver(() => {
            const event = new CustomEvent(type, {
              bubbles: true,
              cancelable: false
            });
            listener.call(this, event);
          });
          
          // Configure the observer
          observer.observe(this, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
          });
          
          // Store observer to prevent garbage collection
          if (!this._mutationObservers) {
            this._mutationObservers = [];
          }
          this._mutationObservers.push(observer);
          
          if (enableTableauLogs) {
            console.log(`[Tableau Fix] Replaced ${type} with MutationObserver`);
          }
          
          return;
        } catch (err) {
          // Fall back to original method if MutationObserver fails
          console.log(`Error creating MutationObserver for ${type}:`, err);
        }
      }
      
      // For all other event types, use the original method
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
  
  // 3. Add global unhandled error handler
  window.addEventListener('error', function(event) {
    // Check if error is Tableau-related
    if (event.filename && 
       (event.filename.includes('tableau') || 
        event.filename.includes('vizql'))) {
      
      // Prevent the error from showing in console
      event.preventDefault();
      
      if (enableTableauLogs) {
        console.log('[Tableau Error Intercepted]:', event.message);
      }
      return false;
    }
  }, true);
  
  // Log successful initialization
  if (enableTableauLogs) {
    console.log('Tableau error handling initialized successfully');
  }
}
