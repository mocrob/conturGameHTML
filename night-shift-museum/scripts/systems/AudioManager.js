/**
 * AudioManager.js
 * Handles all audio playback and ambient soundscapes
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambienceNodes = [];
        this.soundEffects = {};
        this.isMuted = false;
        this.volume = 0.5;
        
        // Audio buffers cache
        this.buffers = {};
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }
    
    createAmbientDrone() {
        if (!this.audioContext) return;
        
        // Create low ambient drone for horror atmosphere
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 50; // Low frequency drone
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        gainNode.gain.value = 0.15;
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        this.ambienceNodes.push({ oscillator, gainNode });
        
        // Create second layer - higher pitch tension
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode2 = this.audioContext.createGain();
        
        oscillator2.type = 'triangle';
        oscillator2.frequency.value = 120;
        gainNode2.gain.value = 0.05;
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(this.masterGain);
        
        oscillator2.start();
        this.ambienceNodes.push({ oscillator: oscillator2, gainNode: gainNode2 });
        
        // HVAC hum simulation
        this.createHVACHum();
    }
    
    createHVACHum() {
        if (!this.audioContext) return;
        
        // Create noise buffer for HVAC
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 0.5;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.08;
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        noiseSource.start();
        this.ambienceNodes.push({ oscillator: noiseSource, gainNode });
    }
    
    playProceduralSound(type) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        switch(type) {
            case 'footstep':
                this.playFootstepSound(now);
                break;
            case 'distant_footstep':
                this.playDistantFootstep(now);
                break;
            case 'creak':
                this.playCreak(now);
                break;
            case 'whisper':
                this.playWhisper(now);
                break;
            case 'breathing':
                this.playBreathing(now);
                break;
            case 'flashlight_click':
                this.playFlashlightClick(now);
                break;
            case 'jar_close':
                this.playJarClose(now);
                break;
            case 'food_throw':
                this.playFoodThrow(now);
                break;
            case 'monster_nearby':
                this.playMonsterNearby(now);
                break;
        }
    }
    
    playFootstepSound(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(100, time);
        oscillator.frequency.exponentialRampToValueAtTime(50, time + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.1);
    }
    
    playDistantFootstep(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 80;
        
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.3);
    }
    
    playCreak(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(60, time);
        oscillator.frequency.linearRampToValueAtTime(40, time + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.5);
    }
    
    playWhisper(time) {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 2;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.05, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        noiseSource.start(time);
        noiseSource.stop(time + 0.5);
    }
    
    playBreathing(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 200;
        
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.15, time + 0.3);
        gainNode.gain.linearRampToValueAtTime(0, time + 0.6);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.6);
    }
    
    playFlashlightClick(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.05);
    }
    
    playJarClose(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, time);
        oscillator.frequency.exponentialRampToValueAtTime(600, time + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.2);
    }
    
    playFoodThrow(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(200, time);
        oscillator.frequency.exponentialRampToValueAtTime(100, time + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.2);
    }
    
    playMonsterNearby(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 30;
        
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, time + 1.5);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 1.5);
    }
    
    startAmbience() {
        if (!this.audioContext && !this.init()) return;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.createAmbientDrone();
        console.log('Ambient soundscape started');
        
        // Start random procedural sounds
        this.startRandomSounds();
    }
    
    startRandomSounds() {
        // Play random atmospheric sounds at intervals
        const playRandomSound = () => {
            if (!window.game.isPlaying || window.game.isPaused) {
                setTimeout(playRandomSound, 2000);
                return;
            }
            
            const sounds = ['footstep', 'distant_footstep', 'creak', 'whisper', 'breathing'];
            const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
            
            this.playProceduralSound(randomSound);
            
            // Random interval between 3-15 seconds
            const nextInterval = 3000 + Math.random() * 12000;
            setTimeout(playRandomSound, nextInterval);
        };
        
        playRandomSound();
    }
    
    stopAll() {
        this.ambienceNodes.forEach(node => {
            try {
                node.oscillator.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.ambienceNodes = [];
    }
    
    setVolume(value) {
        this.volume = value;
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        }
        return this.isMuted;
    }
}

export { AudioManager };
