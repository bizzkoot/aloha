const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Utility to check if we're in a clean git state
function isGitClean() {
    try {
        const status = execSync('git status --porcelain').toString();
        return status.length === 0;
    } catch (error) {
        console.warn('Git status check failed:', error.message);
        return true; // Assume clean if git check fails
    }
}

function getCurrentVersion() {
    try {
        const configPath = path.join(__dirname, 'config.js');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const versionMatch = configContent.match(/VERSION:\s*['"]([^'"]+)['"]/);
        return versionMatch ? versionMatch[1] : null;
    } catch (error) {
        console.error('Error reading config.js:', error);
        return null;
    }
}

function getStoredVersion() {
    try {
        const versionPath = path.join(__dirname, 'version.json');
        if (!fs.existsSync(versionPath)) {
            return null;
        }
        const versionContent = fs.readFileSync(versionPath, 'utf8');
        return JSON.parse(versionContent);
    } catch (error) {
        console.error('Error reading version.json:', error);
        return null;
    }
}

function generateVersionData(version) {
    const timestamp = new Date().toISOString().split('T')[0];
    const hashInput = `${version}-${timestamp}`;
    const hash = crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex')
        .substring(0, 8);

    return {
        version,
        timestamp,
        hash,
        lastUpdate: new Date().toISOString()
    };
}

function updateVersionFile(newVersion) {
    const storedData = getStoredVersion();
    const newData = generateVersionData(newVersion);

    // Check if update is needed
    if (storedData && 
        storedData.version === newVersion && 
        storedData.timestamp === newData.timestamp) {
        console.log('No update needed - version and timestamp match');
        return false;
    }

    // Only proceed if git working directory is clean
    if (!isGitClean()) {
        console.log('Git working directory is not clean. Skipping version update.');
        return false;
    }

    try {
        const versionPath = path.join(__dirname, 'version.json');
        fs.writeFileSync(versionPath, JSON.stringify(newData, null, 4));
        console.log('Version file updated successfully:', newData);
        return true;
    } catch (error) {
        console.error('Error updating version file:', error);
        return false;
    }
}

function checkAndUpdateVersion() {
    const configVersion = getCurrentVersion();
    const storedData = getStoredVersion();

    if (!configVersion) {
        console.error('Could not determine current version from config.js');
        return;
    }

    const storedVersion = storedData?.version;
    if (configVersion !== storedVersion) {
        console.log(`Version mismatch detected: ${storedVersion || 'none'} -> ${configVersion}`);
        updateVersionFile(configVersion);
    } else {
        console.log('Versions match, checking timestamp...');
        updateVersionFile(configVersion); // Will only update if timestamp changed
    }
}

// Export for use in ecosystem config
module.exports = { checkAndUpdateVersion };

// Only run check if called directly
if (require.main === module) {
    checkAndUpdateVersion();
}