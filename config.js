const APP_CONFIG = {
    VERSION: '1.1.5',
    checkVersion: async () => {
        const response = await fetch('version.json?' + Date.now());
        const data = await response.json();
        if (data.version !== APP_CONFIG.VERSION) {
            location.reload(true);
        }
    }
};

APP_CONFIG.checkVersion();
Object.freeze(APP_CONFIG);