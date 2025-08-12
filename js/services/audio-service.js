// audio-service.js - FIXED VERSION
// Audio service with better cleanup and management

class AudioService {
    constructor() {
        this.currentAudio = null;
        this.audioElements = new Set(); // Track all created audio elements
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

    async createAudioElement(audioUrl) {
        // Clean up any existing audio first
        this.cleanup();
        
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = audioUrl;
        
        // Add to tracking set
        this.audioElements.add(audio);
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
            }, 5000);
            
            const canplayHandler = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            const errorHandler = (e) => {
                clearTimeout(timeout);
                reject(e);
            };
            
            audio.addEventListener('canplay', canplayHandler, { once: true });
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
}

window.audioService = new AudioService();