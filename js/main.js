// Main application logic

// Global variables
window.currentAudio = null;
window.currentVerseIndex = 0;
window.isReciting = false;
window.isPaused = false;
window.autoAdvance = true;
window.repeatMode = 'none';
window.repeatCount = 3;
window.currentRepeatCount = 0;
window.surahRepeatCount = 0;
window.currentSurah = null;
window.verses = [];

// Application class to manage everything
class QuranLearningApp {
    constructor() {
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        this.audioControlsElement = document.getElementById('audio-controls');
        this.verseContainerElement = document.getElementById('verse-container');
        this.navigationControlsElement = document.getElementById('navigation-controls');
    }

    // Initialize the application
    async initialize() {
        try {
            const surahNumber = getSurahFromURL();
            console.log(`🚀 Starting Dynamic Quran App for Surah ${surahNumber}`);
            
            await this.loadSurah(surahNumber);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }

    // Load a specific Surah
    async loadSurah(surahNumber) {
        try {
            console.log(`🕌 Loading Surah ${surahNumber}`);
            
            // Show loading state
            this.showLoading();
            
            // Validate and get Surah info
            window.currentSurah = SURAH_DATABASE[surahNumber];
            if (!window.currentSurah) {
                throw new Error(`Surah ${surahNumber} not found`);
            }

            // Update header
            this.updateHeader(surahNumber);

            // Fetch verse data
            const verseData = await apiService.fetchVerseData(surahNumber);
            
            // Build verses array
            await this.buildVersesArray(surahNumber, verseData);

            console.log(`📖 Loaded ${window.verses.length} verses for Surah ${surahNumber}`);

            // Generate verse HTML
            window.verseDisplay.generateHTML();

            // Initialize display
            window.currentVerseIndex = 0;
            window.verseDisplay.show(0);
            
            // Show content
            this.showContent();

            // Initialize services
            this.initializeServices();

        } catch (error) {
            console.error('Error loading Surah:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        this.loadingElement.style.display = 'block';
        this.errorElement.style.display = 'none';
        this.audioControlsElement.style.display = 'none';
        this.verseContainerElement.style.display = 'none';
        this.navigationControlsElement.style.display = 'none';
    }

    // Show error state
    showError(message) {
        this.loadingElement.style.display = 'none';
        this.errorElement.style.display = 'block';
        document.getElementById('error-message').textContent = message;
    }

    // Show main content
    showContent() {
        this.loadingElement.style.display = 'none';
        this.errorElement.style.display = 'none';
        this.audioControlsElement.style.display = 'block';
        this.verseContainerElement.style.display = 'flex';
        this.navigationControlsElement.style.display = 'flex';
    }

    // Update header with Surah info
    updateHeader(surahNumber) {
        document.getElementById('surah-title').textContent = window.currentSurah.arabic;
        document.getElementById('surah-info').textContent = 
            `${window.currentSurah.english} • Chapter ${surahNumber} • ${window.currentSurah.verses} Verses • ${window.currentSurah.revelation}`;
    }

    // Build verses array from API data
    async buildVersesArray(surahNumber, verseData) {
        window.verses = [];
        
        // Add Bismillah for all surahs except At-Tawbah (9)
        if (surahNumber !== 9) {
            window.verses.push({
                number: 'Bismillah',
                text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                english: "In the name of Allah, the Most Gracious, the Most Merciful",
                id: "bismillah-display",
                hasAudio: false
            });
        }

        // Add all verses with translations
        for (let i = 0; i < verseData.length; i++) {
            const verse = verseData[i];
            const verseNumber = verse.numberInSurah || verse.number || (i + 1);
            
            // Get English translation
            let englishTranslation;
            try {
                englishTranslation = await apiService.fetchTranslation(surahNumber, verseNumber);
            } catch (error) {
                englishTranslation = `Translation for Surah ${surahNumber}, Verse ${verseNumber}`;
            }
            
            window.verses.push({
                number: verseNumber,
                text: verse.text || `Verse ${verseNumber}`,
                english: englishTranslation,
                id: `verse-${verseNumber}-display`,
                hasAudio: true
            });
        }
    }

    // Initialize all services
    initializeServices() {
        // Initialize audio service with iOS support
        audioService.initializeIOS();
        
        // Initialize media session
        mediaSessionService.initialize();
        
        // Update status
        window.playbackControls.updateStatus(`Ready to recite ${window.currentSurah.english} with Mishary Alafasy`);
    }
}

// Global status update function for backward compatibility
window.updateStatus = function(message) {
    if (window.playbackControls) {
        window.playbackControls.updateStatus(message);
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuranLearningApp();
    app.initialize();
});

// Also support old window.onload for compatibility
window.addEventListener('load', () => {
    // Ensure all components are initialized
    if (!window.playbackControls) {
        console.log('Initializing components...');
    }
});