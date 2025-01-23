const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function updateVersion() {
    try {
        // Read config.js to get version
        const configContent = fs.readFileSync('config.js', 'utf8');
        const versionMatch = configContent.match(/VERSION:\s*['"](.+?)['"]/);
        
        if (!versionMatch) {
            throw new Error('Could not find version in config.js');
        }
        
        const newVersion = versionMatch[1];

        // Calculate content hash for cache busting
        const calculateHash = (files) => {
            const hash = crypto.createHash('sha256');
            files.forEach(file => {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    hash.update(content);
                } catch (error) {
                    console.warn(`Warning: Could not read file ${file}:`, error.message);
                }
            });
            return hash.digest('hex').substring(0, 8);
        };

        // Files to include in hash calculation
        const filesToHash = [
            'index.html',
            'styles.css',
            'script.js',
            'arithmetic.js',
            'tutorial.js',
            'game.js',
            'config.js',
            ...fs.readdirSync('js/modules', { recursive: true })
                .filter(file => file.endsWith('.js') || file.endsWith('.css'))
                .map(file => path.join('js/modules', file))
        ];

        // Create version data
        const versionData = {
            version: newVersion,
            timestamp: new Date().toISOString().split('T')[0],
            hash: calculateHash(filesToHash),
            lastUpdate: new Date().toISOString()
        };

        // Write updated version.json
        fs.writeFileSync('version.json', JSON.stringify(versionData, null, 4));
        console.log('Version file updated successfully:', newVersion);
    } catch (error) {
        console.error('Error updating version:', error);
    }
}

// Run update immediately
updateVersion();

// Watch for changes in config.js
fs.watch('config.js', (eventType, filename) => {
    if (filename) {
        console.log(`Detected ${eventType} in ${filename}`);
        updateVersion();
    }
});
