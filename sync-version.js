const fs = require('fs');
const path = require('path');

// Read config.js to get version
const configContent = fs.readFileSync('config.js', 'utf8');
const versionMatch = configContent.match(/VERSION:\s*['"](.+?)['"]/);
const newVersion = versionMatch[1];

// Read existing version.json
let versionData = {};
try {
    versionData = JSON.parse(fs.readFileSync('version.json', 'utf8'));
} catch (error) {
    // If file doesn't exist or is invalid, create new object
    versionData = {};
}

// Update version and timestamp
versionData.version = newVersion;
versionData.timestamp = versionData.timestamp || new Date().toISOString().split('T')[0];

// Write back to version.json
fs.writeFileSync('version.json', JSON.stringify(versionData, null, 4));