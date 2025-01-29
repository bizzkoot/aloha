const APP_CONFIG = {
    VERSION: '1.2.2',
    IS_DEV: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    FORCE_REFRESH: true,
    checkVersion: async () => {
        try {
            const timestamp = Date.now();
            // Simplify path for local development
            const response = await fetch(`./version.json?t=${timestamp}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (APP_CONFIG.IS_DEV) {
                // Check if this is the first load in dev mode
                const hasInitialRefresh = sessionStorage.getItem('initialDevRefresh');
                if (!hasInitialRefresh && APP_CONFIG.FORCE_REFRESH) {
                    console.log('Development mode: First load detected, refreshing once');
                    // Clear caches before setting the flag
                    await caches.delete('aloha-cache');
                    localStorage.clear();
                    
                    // Set the flag in sessionStorage (will persist through reload but clear when tab closes)
                    sessionStorage.setItem('initialDevRefresh', 'true');
                    
                    // Reload page
                    location.reload(true);
                    return;
                }
            } else if (data.version !== APP_CONFIG.VERSION || 
                      new Date(data.timestamp).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]) {
                console.log('Version or date mismatch detected, clearing cache');
                await caches.delete('aloha-cache');
                localStorage.clear();
                location.reload(true);
            }
        } catch (error) {
            console.error('Error checking version:', error);
            return; // Prevent further execution on error
        }
    },
    clearCache: async () => {
        try {
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys.map(key => caches.delete(key))
            );
            localStorage.clear();
            sessionStorage.clear();
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
};

// Check version immediately
APP_CONFIG.checkVersion();

// For development, also check periodically
if (APP_CONFIG.IS_DEV) {
    setInterval(() => APP_CONFIG.checkVersion(), 5000);
}

Object.freeze(APP_CONFIG);
