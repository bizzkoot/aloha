const fs = require('fs');
const path = require('path');

// Read version from config.js
const configContent = fs.readFileSync('config.js', 'utf8');
const versionMatch = configContent.match(/VERSION:\s*['"](.+?)['"]/);
const version = versionMatch[1];

// Generate version.json content
const versionJson = {
    version: version
};

// Write to version.json
fs.writeFileSync('version.json', JSON.stringify(versionJson, null, 4));

console.log(`Version ${version} synced to version.json`);
