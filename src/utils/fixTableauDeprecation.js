/**
 * Prevents Tableau's deprecation warnings for DOMSubtreeModified mutation events
 * by implementing a workaround using MutationObserver.
 * 
 * This fixes the console error:
 * "[Deprecation] Listener added for a 'DOMSubtreeModified' mutation event. Support for 
 * this event type has been removed, and this event will no longer be fired."
 */
export function preventTableauDeprecationWarnings() {
  // Store the original addEventListener method
  const originalAddEventListener = Element.prototype.addEventListener;
  
  // Override addEventListener to intercept DOMSubtreeModified
  Element.prototype.addEventListener = function(type, listener, options) {
    if (type === 'DOMSubtreeModified') {
      // Replace with MutationObserver which is the modern alternative
      const observer = new MutationObserver(mutations => {
        // Simulate the event with an object similar to the original event
        const event = {
          target: this,
          type: 'DOMSubtreeModified',
          bubbles: true,
          cancelable: false
        };
        listener.call(this, event);
      });
      
      // Start observing the element for all changes
      observer.observe(this, {
        childList: true,    // observe direct children
        subtree: true,      // and lower descendants too
        attributes: true,   // observe attributes
        characterData: true // observe text content
      });
      
      // Store observer in element's data to prevent garbage collection
      if (!this._mutationObservers) {
        this._mutationObservers = [];
      }
      this._mutationObservers.push(observer);
      
      // Don't call the original method with DOMSubtreeModified
      return;
    }
    
    // For all other event types, call the original method
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Version that patches after jQuery loads (use this if jQuery loads dynamically)
export function watchForjQueryAndFix() {
  // Check if jQuery is already loaded
  if (window.jQuery) {
    preventTableauDeprecationWarnings();
    return;
  }
  
  // Set up a watcher that will check for jQuery being added to window
  let jQueryChecks = 0;
  const MAX_CHECKS = 20;
  
  const checkForjQuery = () => {
    if (window.jQuery) {
      preventTableauDeprecationWarnings();
      return true;
    }
    
    if (jQueryChecks++ < MAX_CHECKS) {
      setTimeout(checkForjQuery, 100);
    }
    return false;
  };
  
  // Start checking
  checkForjQuery();
}

// Auto-execute when this module is imported
watchForjQueryAndFix();
