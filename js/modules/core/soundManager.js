/**
 * Sound Manager for Training Modules
 * Uses Web Audio API to generate sounds programmatically
 * This avoids the need for external audio files and ensures consistent playback across browsers
 */
class SoundManager {
    constructor() {
        // Initialize audio context
        this.audioCtx = null;
        this.sounds = {};
        this.isMuted = false;
        
        // Volume levels for different sound types
        this.volumes = {
            bead: 0.3,
            success: 0.4,
            next: 0.2,
            achievement: 0.5
        };
    }

    initialize() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        }
    }

    createSounds() {
        // Bead click sound (short, soft click)
        this.sounds.bead = () => {
            const duration = 0.1;
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + duration);
            
            gainNode.gain.setValueAtTime(this.volumes.bead, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration);
        };

        // Success sound (happy chime)
        this.sounds.success = () => {
            const duration = 0.6;
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(this.volumes.success, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration);
        };

        // Next slide sound (soft swish)
        this.sounds.next = () => {
            const duration = 0.2;
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, this.audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(400, this.audioCtx.currentTime + duration);
            
            gainNode.gain.setValueAtTime(this.volumes.next, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration);
        };

        // Achievement sound (triumphant jingle)
        this.sounds.achievement = () => {
            const duration = 1.0;
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime + 0.4);
            oscillator.frequency.setValueAtTime(1000, this.audioCtx.currentTime + 0.6);
            
            gainNode.gain.setValueAtTime(this.volumes.achievement, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration);
        };
    }

    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;

        // Initialize context if needed (browsers require user interaction)
        if (!this.audioCtx) {
            this.initialize();
        }

        // Resume context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Play the requested sound
        this.sounds[soundName]();
    }

    mute() {
        this.isMuted = true;
    }

    unmute() {
        this.isMuted = false;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // Clean up resources
    cleanup() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }
}

// Export a singleton instance
export const soundManager = new SoundManager();
