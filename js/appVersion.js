/**
 * Local app version for the in-app release update checker.
 *
 * MUST be bumped together with every release (package.json "version",
 * android/app/build.gradle versionName/versionCode, and config.js VERSION).
 * The APK WebView has no synchronous way to read the native versionName
 * from JS, so this constant is the single source of truth for the packaged
 * build (mirrors Hand-Math js/appVersion.js).
 */
window.ALOHA_VERSION = '1.1.6';
