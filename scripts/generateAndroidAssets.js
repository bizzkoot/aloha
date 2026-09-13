/**
 * Generate Android launcher icons (adaptive foregrounds, legacy & round icons)
 * and splash screens from assets/soroban-icon.png.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_ICON = path.join(ROOT, 'assets', 'soroban-icon.png');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(SOURCE_ICON)) {
  console.error(`Source icon not found: ${SOURCE_ICON}`);
  process.exit(1);
}

// Temporary trimmed badge path inside repo
const TRIMMED_BADGE = path.join(ROOT, '.badge-trimmed.png');

console.log('1. Trimming source icon badge...');
execSync(`magick "${SOURCE_ICON}" -fuzz 1% -trim +repage "${TRIMMED_BADGE}"`);

// 1. Adaptive foregrounds: 108dp canvas, ~64dp badge (transparent background)
const FOREGROUND_SIZES = [
  { density: 'mdpi', size: 108, badge: 64 },
  { density: 'hdpi', size: 162, badge: 96 },
  { density: 'xhdpi', size: 216, badge: 128 },
  { density: 'xxhdpi', size: 324, badge: 192 },
  { density: 'xxxhdpi', size: 432, badge: 256 },
];

console.log('2. Generating adaptive icon foregrounds...');
for (const { density, size, badge } of FOREGROUND_SIZES) {
  const destDir = path.join(RES_DIR, `mipmap-${density}`);
  fs.mkdirSync(destDir, { recursive: true });
  const destFile = path.join(destDir, 'ic_launcher_foreground.png');
  execSync(`magick -size ${size}x${size} xc:none \\( "${TRIMMED_BADGE}" -resize ${badge}x${badge} \\) -gravity center -composite "${destFile}"`);
  console.log(`   -> ${path.relative(ROOT, destFile)} (${size}x${size})`);
}

// 2. Legacy icons (ic_launcher.png) and round icons (ic_launcher_round.png)
const LEGACY_SIZES = [
  { density: 'mdpi', size: 48, badge: 44 },
  { density: 'hdpi', size: 72, badge: 66 },
  { density: 'xhdpi', size: 96, badge: 88 },
  { density: 'xxhdpi', size: 144, badge: 132 },
  { density: 'xxxhdpi', size: 192, badge: 176 },
];

console.log('3. Generating legacy & round launcher icons...');
for (const { density, size, badge } of LEGACY_SIZES) {
  const destDir = path.join(RES_DIR, `mipmap-${density}`);
  const squareFile = path.join(destDir, 'ic_launcher.png');
  const roundFile = path.join(destDir, 'ic_launcher_round.png');
  execSync(`magick -size ${size}x${size} xc:none \\( "${TRIMMED_BADGE}" -resize ${badge}x${badge} \\) -gravity center -composite "${squareFile}"`);
  execSync(`magick -size ${size}x${size} xc:none \\( "${TRIMMED_BADGE}" -resize ${badge}x${badge} \\) -gravity center -composite "${roundFile}"`);
  console.log(`   -> ${path.relative(ROOT, squareFile)} / round (${size}x${size})`);
}

// 3. Splash screens: white background with centered badge
const SPLASH_SIZES = [
  { folder: 'drawable', w: 480, h: 320, badge: 80 },
  { folder: 'drawable-land-mdpi', w: 480, h: 320, badge: 80 },
  { folder: 'drawable-land-hdpi', w: 800, h: 480, badge: 120 },
  { folder: 'drawable-land-xhdpi', w: 1280, h: 720, badge: 160 },
  { folder: 'drawable-land-xxhdpi', w: 1600, h: 960, badge: 240 },
  { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280, badge: 320 },
  { folder: 'drawable-port-mdpi', w: 320, h: 480, badge: 80 },
  { folder: 'drawable-port-hdpi', w: 480, h: 800, badge: 120 },
  { folder: 'drawable-port-xhdpi', w: 720, h: 1280, badge: 160 },
  { folder: 'drawable-port-xxhdpi', w: 960, h: 1600, badge: 240 },
  { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920, badge: 320 },
];

console.log('4. Generating splash screens...');
for (const { folder, w, h, badge } of SPLASH_SIZES) {
  const destDir = path.join(RES_DIR, folder);
  fs.mkdirSync(destDir, { recursive: true });
  const destFile = path.join(destDir, 'splash.png');
  execSync(`magick -size ${w}x${h} xc:white \\( "${TRIMMED_BADGE}" -resize ${badge}x${badge} \\) -gravity center -composite "${destFile}"`);
  console.log(`   -> ${path.relative(ROOT, destFile)} (${w}x${h})`);
}

// 4. Remove obsolete vector drawables from default template
const obsoleteVectors = [
  path.join(RES_DIR, 'drawable-v24', 'ic_launcher_foreground.xml'),
  path.join(RES_DIR, 'drawable', 'ic_launcher_background.xml'),
];
for (const file of obsoleteVectors) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`5. Removed obsolete template vector: ${path.relative(ROOT, file)}`);
  }
}

// Clean up temporary trimmed file
if (fs.existsSync(TRIMMED_BADGE)) {
  fs.unlinkSync(TRIMMED_BADGE);
}

console.log('\nAll Android icons and splash assets successfully generated from soroban-icon.png!');
