// audio-service.js - FIXED VERSION
// Audio service with better cleanup and management

class AudioService {
    constructor() {
        this.currentAudio = null;
        this.audioElements = new Set();
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.audioContext = null;
        this.unlocked = false;
    }

    async loadAudio(surahNumber, verseNumber) {
        const paddedSurah = surahNumber.toString().padStart(3, '0');
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        const audioPath = `./quran-data/audio/${paddedSurah}/${paddedSurah}${paddedVerse}.mp3`;
        
        console.log(`🎵 Loading local audio: ${audioPath}`);
        
        // Check if file exists and is playable
        try {
            const response = await fetch(audioPath, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error('Audio file not found');
            }
            console.log('✅ Local audio file found');
            return audioPath;
        } catch (error) {
            console.log('❌ Local audio file not found');
            throw new Error('Audio file not found');
        }
    }

    // Add iOS audio unlock method
async unlockAudioContext() {
    if (!this.isIOS || this.unlocked) return;
    
    try {
        // Create AudioContext for iOS
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Create and play a silent buffer to unlock
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        
        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.unlocked = true;
        console.log('iOS audio context unlocked');
    } catch (e) {
        console.error('Failed to unlock audio context:', e);
    }
}

    // Update createAudioElement method
async createAudioElement(audioUrl) {
    // Unlock iOS audio on first interaction
    await this.unlockAudioContext();
    
    // Clean up any existing audio first
    this.cleanup();
    
    const audio = new Audio();
    
    // iOS-specific settings
    if (this.isIOS) {
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        audio.preload = 'metadata'; // iOS prefers metadata over auto
    } else {
        audio.preload = 'auto';
    }
    
    audio.src = audioUrl;
    audio.crossOrigin = 'anonymous';
    
    // Add to tracking set
    this.audioElements.add(audio);
    
    // Wait for audio to be ready with iOS-specific handling
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Audio load timeout'));
        }, this.isIOS ? 10000 : 5000); // Longer timeout for iOS
        
        const canplayHandler = () => {
            clearTimeout(timeout);
            resolve();
        };
        
        const loadedmetadataHandler = () => {
            // iOS often needs loadedmetadata instead of canplay
            if (this.isIOS) {
                clearTimeout(timeout);
                resolve();
            }
        };
        
        const errorHandler = (e) => {
            clearTimeout(timeout);
            reject(e);
        };
        
        audio.addEventListener('canplay', canplayHandler, { once: true });
        audio.addEventListener('loadedmetadata', loadedmetadataHandler, { once: true });
        audio.addEventListener('error', errorHandler, { once: true });
        
        audio.load();
    });
    
    return audio;
}

    cleanup() {
        // Clean up current audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            
            // Remove all event listeners
            if (this.currentAudio._endedHandler) {
                this.currentAudio.removeEventListener('ended', this.currentAudio._endedHandler);
                delete this.currentAudio._endedHandler;
            }
            if (this.currentAudio._errorHandler) {
                this.currentAudio.removeEventListener('error', this.currentAudio._errorHandler);
                delete this.currentAudio._errorHandler;
            }
            
            // Remove source to free memory
            this.currentAudio.src = '';
            this.currentAudio.load();
            
            // Remove from tracking
            this.audioElements.delete(this.currentAudio);
            
            this.currentAudio = null;
        }
        
        // Clean up any orphaned audio elements
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
            audio.load();
            audio.remove();
        });
        
        this.audioElements.clear();
        
        // Also clean up any audio elements in the DOM
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
            audio.load();
            audio.remove();
        });
    }

    getCurrentAudio() {
        return this.currentAudio;
    }

    setCurrentAudio(audio) {
        // Clean up previous audio before setting new one
        if (this.currentAudio && this.currentAudio !== audio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio.src = '';
            this.currentAudio.load();
            this.audioElements.delete(this.currentAudio);
        }
        
        this.currentAudio = audio;
        if (audio) {
            this.audioElements.add(audio);
        }
    }

    // Add debug mode for iOS
enableDebugMode() {
    if (this.isIOS) {
        // Override console for iOS debugging
        const debugDiv = document.createElement('div');
        debugDiv.id = 'ios-debug';
        debugDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:white;padding:10px;font-size:12px;max-height:200px;overflow-y:auto;z-index:9999;';
        document.body.appendChild(debugDiv);
        
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
            debugDiv.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${msg}</div>` + debugDiv.innerHTML;
        };
    }
}
}

window.audioService = new AudioService();