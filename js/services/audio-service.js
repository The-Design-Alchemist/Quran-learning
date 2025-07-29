// Audio service for loading and managing Quran recitation

class AudioService {
    constructor() {
        this.currentAudio = null;
        this.audioSources = [
            'https://everyayah.com/data/Alafasy_128kbps',
            'https://server8.mp3quran.net/afs',
            'https://download.quranicaudio.com/quran/alafasy'
        ];
    }

    // Load audio for a specific verse
    async loadAudio(surahNumber, verseNumber) {
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        const paddedSurah = surahNumber.toString().padStart(3, '0');
        
        console.log(`🎵 Loading audio for Surah ${surahNumber}, Verse ${verseNumber}...`);
        
        for (let i = 0; i < this.audioSources.length; i++) {
            const audioUrl = `${this.audioSources[i]}/${paddedSurah}${paddedVerse}.mp3`;
            console.log(`Trying source ${i + 1}: ${audioUrl}`);
            
            try {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.crossOrigin = 'anonymous';
                
                // iOS Safari specific settings
                if (audio.setAttribute) {
                    audio.setAttribute('playsinline', 'true');
                    audio.setAttribute('webkit-playsinline', 'true');
                }
                
                const isLoaded = await this.testAudioLoad(audio, audioUrl);

                if (isLoaded) {
                    console.log(`✅ Successfully loaded audio from source ${i + 1}`);
                    return audioUrl;
                }
            } catch (error) {
                console.error(`❌ Error with audio source ${i + 1}:`, error);
            }
        }
        
        throw new Error(`All audio sources failed for Surah ${surahNumber}, Verse ${verseNumber}`);
    }

    // Test if audio loads successfully
    testAudioLoad(audio, audioUrl) {
        return new Promise((resolve) => {
            let loaded = false;
            let timeout;
            
            const onSuccess = () => {
                if (!loaded) {
                    loaded = true;
                    clearTimeout(timeout);
                    resolve(true);
                }
            };
            
            const onError = (e) => {
                if (!loaded) {
                    loaded = true;
                    clearTimeout(timeout);
                    resolve(false);
                }
            };

            // Multiple event listeners for better compatibility
            audio.addEventListener('canplay', onSuccess, { once: true });
            audio.addEventListener('canplaythrough', onSuccess, { once: true });
            audio.addEventListener('loadeddata', onSuccess, { once: true });
            audio.addEventListener('loadedmetadata', onSuccess, { once: true });
            
            audio.addEventListener('error', onError, { once: true });
            audio.addEventListener('abort', onError, { once: true });
            
            audio.src = audioUrl;
            audio.load();
            
            // iOS needs longer timeout
            timeout = setTimeout(() => {
                if (!loaded) {
                    loaded = true;
                    resolve(false);
                }
            }, 8000);
        });
    }

    // Create and configure audio element
    async createAudioElement(audioUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        
        // iOS Safari specific settings
        if (audio.setAttribute) {
            audio.setAttribute('playsinline', 'true');
            audio.setAttribute('webkit-playsinline', 'true');
        }
        
        audio.src = audioUrl;
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Audio preparation timeout'));
            }, 10000);
            
            const onReady = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            const onError = (e) => {
                clearTimeout(timeout);
                reject(e);
            };
            
            audio.addEventListener('canplay', onReady, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            audio.load();
        });
        
        return audio;
    }

    // Clean up current audio
    cleanup() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            
            // Remove event listeners if they exist
            if (this.currentAudio.endedHandler) {
                this.currentAudio.removeEventListener('ended', this.currentAudio.endedHandler);
            }
            if (this.currentAudio.errorHandler) {
                this.currentAudio.removeEventListener('error', this.currentAudio.errorHandler);
            }
            
            this.currentAudio = null;
        }
    }

    // Get current audio element
    getCurrentAudio() {
        return this.currentAudio;
    }

    // Set current audio element
    setCurrentAudio(audio) {
        this.currentAudio = audio;
    }

    // Check if device is iOS for special handling
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    // Initialize iOS-specific optimizations
    initializeIOS() {
        if (this.isIOS()) {
            console.log('🍎 iOS detected - applying audio optimizations');
            
            // Add iOS-specific styles
            const style = document.createElement('style');
            style.textContent = `
                audio {
                    -webkit-playsinline: true;
                    playsinline: true;
                }
            `;
            document.head.appendChild(style);
            
            // Pre-load first verse on user interaction
            document.addEventListener('click', this.preloadFirstVerse.bind(this), { once: true });
        }
    }

    // Pre-load first verse for iOS
    async preloadFirstVerse() {
        try {
            const surahNumber = getSurahFromURL();
            console.log('📱 Pre-loading first verse for iOS...');
            
            const audioUrl = await this.loadAudio(surahNumber, 1);
            const preloadAudio = new Audio(audioUrl);
            preloadAudio.preload = 'auto';
            preloadAudio.load();
            
            console.log('✅ First verse pre-loaded for iOS');
        } catch (error) {
            console.log('❌ Failed to pre-load first verse:', error);
        }
    }
}

// Create global instance
window.audioService = new AudioService();