// reading-progress.js - Track and manage reading progress

class ReadingProgress {
    constructor() {
        this.storageKey = 'quranReadingProgress';
        this.recentKey = 'quranRecentSurahs';
        this.progress = this.loadProgress();
        this.recentSurahs = this.loadRecentSurahs();
    }
    
    // Load progress from localStorage
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Error loading progress:', e);
            return {};
        }
    }
    
    // Save progress to localStorage
    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.error('Error saving progress:', e);
        }
    }
    
    // Save current position for a surah
    savePosition(surahNumber, verseIndex, verseNumber) {
        this.progress[surahNumber] = {
            verseIndex: verseIndex,
            verseNumber: verseNumber,
            timestamp: Date.now()
        };
        this.saveProgress();
        console.log(`Saved position: Surah ${surahNumber}, Verse ${verseNumber} (index ${verseIndex})`);
    }
    
    // Get saved position for a surah
    getPosition(surahNumber) {
        return this.progress[surahNumber] || null;
    }
    
    // Clear position for a surah
    clearPosition(surahNumber) {
        delete this.progress[surahNumber];
        this.saveProgress();
    }
    
    // Clear all saved positions
    clearAllProgress() {
        this.progress = {};
        this.saveProgress();
    }
    
    // Get a formatted time since last read
    getTimeSinceLastRead(surahNumber) {
        const position = this.getPosition(surahNumber);
        if (!position) return null;
        
        const now = Date.now();
        const diff = now - position.timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    // Load recent surahs from localStorage
    loadRecentSurahs() {
        try {
            const saved = localStorage.getItem(this.recentKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading recent surahs:', e);
            return [];
        }
    }
    
    // Save recent surahs to localStorage
    saveRecentSurahs() {
        try {
            localStorage.setItem(this.recentKey, JSON.stringify(this.recentSurahs));
        } catch (e) {
            console.error('Error saving recent surahs:', e);
        }
    }
    
    // Add a surah to recent list
    addToRecent(surahNumber) {
        // Remove if already exists (to avoid duplicates)
        this.recentSurahs = this.recentSurahs.filter(item => item.surahNumber !== surahNumber);
        
        // Add to beginning with timestamp
        this.recentSurahs.unshift({
            surahNumber: surahNumber,
            timestamp: Date.now(),
            lastVerse: this.progress[surahNumber]?.verseNumber || 1
        });
        
        // Keep only last 6 recent surahs
        this.recentSurahs = this.recentSurahs.slice(0, 6);
        
        this.saveRecentSurahs();
    }
    
    // Get recent surahs
    getRecentSurahs() {
        return this.recentSurahs;
    }
    
    // Clear recent surahs
    clearRecentSurahs() {
        this.recentSurahs = [];
        this.saveRecentSurahs();
    }
}

// Create global instance
window.readingProgress = new ReadingProgress();