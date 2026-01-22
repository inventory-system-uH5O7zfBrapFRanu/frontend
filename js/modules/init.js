/**
 * Initialization Module
 * 
 * This file is loaded LAST to ensure all modules are available.
 * It initializes the application after all dependencies are loaded.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] All modules loaded, initializing app...');

    // Initialize main app
    if (typeof initApp === 'function') {
        initApp();
    } else {
        console.error('[Init] initApp function not found!');
    }

    console.log('[Init] Initialization complete');
});
