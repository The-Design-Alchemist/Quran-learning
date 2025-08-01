// audio-service-js.js - Uses only local audio files
class AudioService {
    constructor() {
        this.currentAudio = null;
    }

    async loadAudio(surahNumber, verseNumber) {
        const paddedSurah = surahNumber.toString().padStart(3, '0');
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        const audioPath = `./quran-data/audio/${paddedSurah}/${paddedSurah}${paddedVerse}.mp3`;
        
        console.log(`🎵 Loading local audio: ${audioPath}`);
        
        // Check if file exists
        try {
            const response = await fetch(audioPath, { method: 'HEAD' });
            if (response.ok) {
                console.log('✅ Local audio file found');
                return audioPath;
            }
        } catch (error) {
            console.log('❌ Local audio file not found');
            throw new Error('Audio file not found');
        }
        
        return audioPath;
    }

    async createAudioElement(audioUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = audioUrl;
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
            }, 5000);
            
            audio.addEventListener('canplay', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(e);
            }, { once: true });
            
            audio.load();
        });
        
        return audio;
    }

    cleanup() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    getCurrentAudio() {
        return this.currentAudio;
    }

    setCurrentAudio(audio) {
        this.currentAudio = audio;
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    initializeIOS() {
        // iOS optimizations if needed
    }
}

window.audioService = new AudioService();