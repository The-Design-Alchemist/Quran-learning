// audio-service.js - FIXED VERSION
// Audio service with better cleanup and management

class AudioService {
    constructor() {
        this.currentAudio = null;
        this.audioElements = new Set();
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.audioContext = null;
        this.unlocked = false;
        this.reusableAudio = null; // Single reusable audio element for iOS
    }

    // Add iOS audio unlock method
async unlockAudioContext() {
        if (!this.isIOS || this.unlocked) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.unlocked = true;
            console.log('iOS audio context unlocked');
        } catch (e) {
            console.error('Failed to unlock audio context:', e);
        }
}
    
    async loadAudio(surahNumber, verseNumber) {
        const paddedSurah = surahNumber.toString().padStart(3, '0');
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        const audioPath = `./quran-data/audio/${paddedSurah}/${paddedSurah}${paddedVerse}.mp3`;
        
        console.log(`🎵 Loading audio: ${audioPath}`);
        
        try {
            const response = await fetch(audioPath, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error('Audio file not found');
            }
            return audioPath;
        } catch (error) {
            console.log('❌ Audio file not found');
            throw new Error('Audio file not found');
        }
    }


    // Update createAudioElement method
async createAudioElement(audioUrl) {
        await this.unlockAudioContext();
        
        // For iOS, reuse the same audio element to maintain playback permission
        if (this.isIOS && this.reusableAudio) {
            console.log('Reusing existing audio element for iOS');
            const audio = this.reusableAudio;
            
            // Remove old event listeners
            audio.onended = null;
            audio.onerror = null;
            
            // Update source
            audio.src = audioUrl;
            
            // Wait for new audio to load
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Audio load timeout'));
                }, 10000);
                
                const loadedHandler = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                
                const errorHandler = (e) => {
                    clearTimeout(timeout);
                    reject(e);
                };
                
                audio.addEventListener('loadedmetadata', loadedHandler, { once: true });
                audio.addEventListener('error', errorHandler, { once: true });
                
                audio.load();
            });
            
            return audio;
        }
        
        // Create new audio element (first time or non-iOS)
        const audio = new Audio();
        
        if (this.isIOS) {
            audio.setAttribute('playsinline', 'true');
            audio.setAttribute('webkit-playsinline', 'true');
            audio.preload = 'metadata';
            this.reusableAudio = audio; // Store for reuse
        } else {
            audio.preload = 'auto';
        }
        
        audio.src = audioUrl;
        audio.crossOrigin = 'anonymous';
        
        this.audioElements.add(audio);
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
            }, this.isIOS ? 10000 : 5000);
            
            const canplayHandler = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            const loadedmetadataHandler = () => {
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
        // For iOS, don't destroy the reusable audio element, just pause it
        if (this.isIOS && this.reusableAudio) {
            this.reusableAudio.pause();
            // Don't clear the source or remove the element
            return;
        }
        
        // Normal cleanup for non-iOS
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            
            if (this.currentAudio._endedHandler) {
                this.currentAudio.removeEventListener('ended', this.currentAudio._endedHandler);
                delete this.currentAudio._endedHandler;
            }
            if (this.currentAudio._errorHandler) {
                this.currentAudio.removeEventListener('error', this.currentAudio._errorHandler);
                delete this.currentAudio._errorHandler;
            }
            
            this.currentAudio.src = '';
            this.currentAudio.load();
            
            this.audioElements.delete(this.currentAudio);
            this.currentAudio = null;
        }
        
        this.audioElements.forEach(audio => {
            if (audio !== this.reusableAudio) {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                audio.load();
                audio.remove();
            }
        });
        
        this.audioElements.clear();
        if (this.reusableAudio) {
            this.audioElements.add(this.reusableAudio);
        }
    }

    getCurrentAudio() {
        return this.currentAudio;
    }

    setCurrentAudio(audio) {
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