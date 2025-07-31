import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Debounce function for performance
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Optimize DOM queries
    const optimizeQueries = () => {
      // Cache commonly accessed elements
      const cachedElements = new Map();
      
      const originalQuerySelector = document.querySelector;
      const originalQuerySelectorAll = document.querySelectorAll;
      
      document.querySelector = function(selector: string) {
        if (cachedElements.has(selector)) {
          const cached = cachedElements.get(selector);
          if (document.contains(cached)) {
            return cached;
          }
        }
        
        const element = originalQuerySelector.call(this, selector);
        if (element) {
          cachedElements.set(selector, element);
        }
        return element;
      };
    };

    // Optimize animations
    const optimizeAnimations = () => {
      let rafId: number;
      const animations: Array<() => void> = [];
      
      const runAnimations = () => {
        animations.forEach(animation => animation());
        animations.length = 0;
        
        if (animations.length > 0) {
          rafId = requestAnimationFrame(runAnimations);
        }
      };

      (window as any).fastAnimate = (callback: () => void) => {
        animations.push(callback);
        if (!rafId) {
          rafId = requestAnimationFrame(runAnimations);
        }
      };
    };

    // Optimize event listeners
    const optimizeEvents = () => {
      const eventMap = new WeakMap();
      
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (typeof listener === 'function') {
          const debouncedListener = type === 'scroll' || type === 'resize' || type === 'mousemove' 
            ? debounce(listener, 16) // ~60fps
            : listener;
          
          eventMap.set(listener, debouncedListener);
          return originalAddEventListener.call(this, type, debouncedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        if (listener && eventMap.has(listener)) {
          const debouncedListener = eventMap.get(listener);
          return originalRemoveEventListener.call(this, type, debouncedListener, options);
        }
        return originalRemoveEventListener.call(this, type, listener, options);
      };
    };

    // Memory cleanup
    const cleanupMemory = () => {
      const cleanup = () => {
        // Clean up orphaned elements
        const orphans = document.querySelectorAll('[class*="editor-selected"], [class*="live-editor-selected"]');
        orphans.forEach(el => {
          if (!el.isConnected) {
            el.remove();
          }
        });
        
        // Clean up unused styles
        const styleSheets = document.styleSheets;
        for (let i = 0; i < styleSheets.length; i++) {
          try {
            const sheet = styleSheets[i] as CSSStyleSheet;
            if (sheet.href && sheet.href.includes('unused')) {
              sheet.disabled = true;
            }
          } catch (e) {
            // Cross-origin stylesheets
          }
        }
      };
      
      // Run cleanup every 30 seconds
      setInterval(cleanup, 30000);
    };

    // Initialize optimizations
    optimizeQueries();
    optimizeAnimations();
    optimizeEvents();
    cleanupMemory();

    return () => {
      // Cleanup on unmount
    };
  }, []);

  return null; // This component doesn't render anything
}