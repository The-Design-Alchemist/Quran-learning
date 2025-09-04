// Main application logic

// Application state - centralized state management
window.appState = {
    currentVerseIndex: 0,
    isReciting: false,
    isPaused: false,
    autoAdvance: true,
    repeatMode: 'none',
    repeatCount: 3,
    currentRepeatCount: 0,
    surahRepeatCount: 0,
    currentSurah: null,
    verses: [],
    highlightingEnabled: true, // This will be overridden by settings
    currentSegment: 0,
    isSegmentedVerse: false
};

// After DOM loads, sync with settings
document.addEventListener('DOMContentLoaded', () => {
    // Sync highlighting state with saved settings
    if (window.settingsManager) {
        window.appState.highlightingEnabled = window.settingsManager.settings.showHighlighting;
    }
});

// Keep only essential globals
window.currentAudio = null;

// Application class to manage everything
class QuranLearningApp {
    constructor() {
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        this.audioControlsElement = document.getElementById('audio-controls');
        this.verseContainerElement = document.getElementById('verse-container');
        this.navigationControlsElement = document.getElementById('navigation-controls');
    }

    // Add this to the QuranLearningApp initialize method
async initialize() {
    try {
        // Add iOS audio initialization on first user interaction
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const initAudioOnInteraction = async () => {
                await audioService.unlockAudioContext();
                document.removeEventListener('touchstart', initAudioOnInteraction);
                document.removeEventListener('click', initAudioOnInteraction);
            };
            
            document.addEventListener('touchstart', initAudioOnInteraction, { once: true });
            document.addEventListener('click', initAudioOnInteraction, { once: true });
        }
        
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
            window.appState.currentSurah = SURAH_DATABASE[surahNumber];
            if (!window.appState.currentSurah) {
                throw new Error(`Surah ${surahNumber} not found`);
            }

            // Update header
            this.updateHeader(surahNumber);

            // Track this surah as recently accessed
            if (window.readingProgress) {
                window.readingProgress.addToRecent(surahNumber);
            }

            // Fetch verse data
            const verseData = await apiService.fetchVerseData(surahNumber);
            if (!verseData || verseData.length === 0) {
                throw new Error(`No verse data found for Surah ${surahNumber}`);
            }

            // Build verses array
            await this.buildVersesArray(surahNumber, verseData);

            console.log(`📖 Loaded ${window.appState.verses.length} verses for Surah ${surahNumber}`);

            // Generate verse HTML
            window.verseDisplay.generateHTML();

            // Check for saved progress
        const savedPosition = window.readingProgress.getPosition(surahNumber);
        
        if (savedPosition && savedPosition.verseIndex > 0) {
            // Show resume dialog
            this.showResumeDialog(savedPosition);
        } else {
            // Start from beginning
            window.appState.currentVerseIndex = 0;
            window.verseDisplay.show(0);
        }
            
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

        // Enable navigation buttons after content is shown
        setTimeout(() => {
            window.verseDisplay.updateNavigationButtons();
        }, 100);
    }

    // Add this new method to QuranLearningApp class:
showResumeDialog(savedPosition) {
    const timeSince = window.readingProgress.getTimeSinceLastRead(getSurahFromURL());
    
    // Create a simple modal dialog
    const modal = document.createElement('div');
    modal.className = 'resume-modal';
    modal.innerHTML = `
        <div class="resume-dialog">
            <h3>Continue where you left off?</h3>
            <p>You were at <strong>Verse ${savedPosition.verseNumber}</strong></p>
            <p class="time-ago">${timeSince}</p>
            <div class="resume-buttons">
                <button class="resume-btn resume-yes" onclick="resumeFromSaved()">
                    ✓ Continue
                </button>
                <button class="resume-btn resume-no" onclick="startFromBeginning()">
                    ⟲ Start Over
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store the saved position globally for the button handlers
    window.savedResumePosition = savedPosition;
}

    // Update header with Surah info
    updateHeader(surahNumber) {
    document.getElementById('surah-title').textContent = window.appState.currentSurah.arabic;
    document.getElementById('surah-info').textContent = 
        `${window.appState.currentSurah.english} • Chapter ${surahNumber} • ${window.appState.currentSurah.verses} Verses • ${window.appState.currentSurah.revelation}`;
}

    // Build verses array from API data
   // Build verses array from API data
async buildVersesArray(surahNumber, verseData) {
    window.appState.verses = [];
    
    // Add Bismillah for all surahs except At-Tawbah (9)
    if (surahNumber !== 9) {
        window.appState.verses.push({
            number: 'Bismillah',
            text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            english: "In the name of Allah, the Most Gracious, the Most Merciful",
            transliteration: "Bismillah ir-Rahman ir-Raheem",
            id: "bismillah-display",
            hasAudio: false
        });
    }

    // Add all verses - DON'T OVERWRITE, just add missing fields
    for (let i = 0; i < verseData.length; i++) {
        const verse = verseData[i];
        
        // Use the verse object as-is, just add the id field
        verse.id = `verse-${verse.number}-display`;
        
        // If segments exist, they're already in the verse object
        // Just push the complete verse object
        window.appState.verses.push(verse);
    }
    
    // Debug: Check for segmented verses
    console.log('Checking for segmented verses after building array:');
    window.appState.verses.forEach((verse, index) => {
        if (verse.segments) {
            console.log(`✅ Verse ${verse.number} has ${verse.segments.length} segments`);
        }
    });
}

    // Initialize all services
    initializeServices() {
        // Update status
        window.playbackControls.updateStatus(`Ready to recite ${window.appState.currentSurah.english} with Mishary Alafasy`);
    }
}


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