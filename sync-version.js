const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read config.js to get version
const configContent = fs.readFileSync('config.js', 'utf8');
const versionMatch = configContent.match(/VERSION:\s*['"](.+?)['"]/);
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

// Read existing version.json
let versionData = {};
try {
    versionData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
} catch (error) {
    console.log('No existing version.json found, creating new one');
    versionData = {};
}

// Update version data
versionData.version = newVersion;
versionData.timestamp = new Date().toISOString().split('T')[0];
versionData.hash = calculateHash(filesToHash);
versionData.lastUpdate = new Date().toISOString();

// Write updated version.json
fs.writeFileSync('version.json', JSON.stringify(versionData, null, 4));

console.log('Version file updated:');
console.log(JSON.stringify(versionData, null, 2));
