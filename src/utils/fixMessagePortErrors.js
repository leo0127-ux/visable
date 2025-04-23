/**
 * This utility helps prevent and silence Chrome extension "message port closed" errors.
 * These errors occur when Chrome extensions attempt to communicate with the app
 * but the messaging port closes before receiving a response.
 */

export const suppressMessagePortErrors = () => {
  // Store the original console.error function
  const originalConsoleError = console.error;
  
  // Override console.error to filter out message port errors
  console.error = function(...args) {
    // Check if this is a message port error
    const isMessagePortError = args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('message port closed') || 
       arg.includes('runtime.lastError'))
    );
    
    // Only pass non-message port errors to the original console.error
    if (!isMessagePortError) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Return a function to restore the original console.error if needed
  return () => {
    console.error = originalConsoleError;
  };
};

/**
 * Initializes the fix for Chrome extension message port errors
 * Call this once in your main.jsx or index.jsx file
 */
export const initMessagePortErrorFix = () => {
  suppressMessagePortErrors();
  
  // Also handle unhandled promise rejections that might be related to message ports
  window.addEventListener('unhandledrejection', event => {
    if (event.reason && 
        typeof event.reason.message === 'string' &&
        (event.reason.message.includes('message port closed') ||
         event.reason.message.includes('runtime.lastError'))) {
      event.preventDefault();
    }
  });
};
