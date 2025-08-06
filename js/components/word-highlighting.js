// word-highlighting.js - Word-by-word highlighting system

class WordHighlighter {
    constructor() {
        this.currentWordIndex = 0;
        this.wordTimings = null;
        this.highlightInterval = null;
        this.currentVerseWords = [];
    }

initializeVerse(verseNumber) {
    this.reset();
    
    // Updated selector for the new structure
    const verseElement = document.querySelector('.verse-item.active .arabic-text');
    console.log('Verse element found:', verseElement);
    
    if (!verseElement) return;
    
    // Split verse into words and wrap each in a span
    const arabicText = verseElement.textContent;
    const words = arabicText.split(/\s+/).filter(word => word.length > 0);
    console.log('Words found:', words.length);
    
    // Create wrapped words with spans
    verseElement.innerHTML = words.map((word, index) => 
        `<span class="arabic-word" data-word-index="${index}">${word}</span>`
    ).join(' ');
    
    this.currentVerseWords = document.querySelectorAll('.verse-item.active .arabic-word');
    
    // Add click handlers to each word
    this.currentVerseWords.forEach((wordElement, index) => {
        wordElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.jumpToWord(index);
        });
    });
    
    // Load timings for this verse
    this.loadWordTimings(getSurahFromURL(), verseNumber);
}


// ADD THIS NEW METHOD for jumping to a specific word
jumpToWord(wordIndex) {
    const audio = audioService.getCurrentAudio();
    if (!audio || !audio.duration) return;
    
    // Check if audio is playing or paused
    const wasPlaying = window.appState.isReciting && !window.appState.isPaused;
    
    // Calculate the time position for this word
    const wordCount = this.currentVerseWords.length;
    const timePerWord = audio.duration / wordCount;
    const targetTime = wordIndex * timePerWord;
    
    console.log(`Jumping to word ${wordIndex + 1} at ${targetTime.toFixed(2)}s`);
    
    // Update the audio position
    audio.currentTime = targetTime;
    
    // Update the highlighting immediately
    this.highlightWord(wordIndex);
    
    // If audio was playing, ensure it continues
    if (wasPlaying && audio.paused) {
        audio.play().catch(error => {
            console.error('Error resuming playback:', error);
        });
    }
    
    // Update status
    if (window.playbackControls) {
        window.playbackControls.updateStatus(
            `Jumped to word ${wordIndex + 1} of ${wordCount}`
        );
    }
    
    // Visual feedback - brief pulse effect
    const clickedWord = this.currentVerseWords[wordIndex];
    clickedWord.style.transform = 'scale(1.3)';
    setTimeout(() => {
        clickedWord.style.transform = '';
    }, 200);
}


    // Load word timings from file or generate estimated timings
    async loadWordTimings(surahNumber, verseNumber) {
        try {
            // Try to load timing file
            const response = await fetch(`./quran-data/timings/${surahNumber}/${verseNumber}.json`);
            if (response.ok) {
                this.wordTimings = await response.json();
            } else {
                // Generate estimated timings if file doesn't exist
                this.wordTimings = this.generateEstimatedTimings();
            }
        } catch (error) {
            console.log('No timing file found, using estimated timings');
            this.wordTimings = this.generateEstimatedTimings();
        }
    }
    
    // Generate estimated word timings based on audio duration
    generateEstimatedTimings() {
        const audio = audioService.getCurrentAudio();
        if (!audio || !this.currentVerseWords.length) return null;
        
        // Estimate duration when audio is loaded
        const estimatedDuration = 10; // Default 10 seconds, will update when audio loads
        const wordCount = this.currentVerseWords.length;
        const timePerWord = estimatedDuration / wordCount;
        
        const timings = [];
        for (let i = 0; i < wordCount; i++) {
            timings.push({
                wordIndex: i,
                startTime: i * timePerWord,
                endTime: (i + 1) * timePerWord
            });
        }
        
        return timings;
    }
    
    // Start highlighting with audio
startHighlighting() {
    const audio = audioService.getCurrentAudio();
    if (!audio || !this.currentVerseWords.length) return;
    
    // Clear any existing interval
    if (this.highlightInterval) {
        clearInterval(this.highlightInterval);
    }
    
    // Start with -1 so first word gets highlighted
    this.currentWordIndex = -1;
    
    console.log('Starting highlight interval...');
    
    // Highlight first word immediately
    this.highlightWord(0);
    
    // Check current time and highlight appropriate word
    this.highlightInterval = setInterval(() => {
        if (!audio || audio.paused || audio.ended) {
            this.pauseHighlighting();
            return;
        }
        
        const currentTime = audio.currentTime;
        const duration = audio.duration || 10;
        const wordCount = this.currentVerseWords.length;
        const timePerWord = duration / wordCount;
        
        // Calculate which word should be highlighted with offset
        const adjustedTime = currentTime + 0.3; // Slight offset for better sync
        const wordIndex = Math.min(
            Math.floor(adjustedTime / timePerWord), 
            wordCount - 1
        );
        
        if (wordIndex !== this.currentWordIndex && wordIndex >= 0) {
            this.highlightWord(wordIndex);
        }
    }, 50);
}
    
    // Update highlight based on current time
    updateHighlight(currentTime) {
        if (!this.wordTimings) return;
        
        // Find the word that should be highlighted
        let wordToHighlight = -1;
        for (let i = 0; i < this.wordTimings.length; i++) {
            const timing = this.wordTimings[i];
            if (currentTime >= timing.startTime && currentTime < timing.endTime) {
                wordToHighlight = i;
                break;
            }
        }
        
        // Update highlighting if word changed
        if (wordToHighlight !== this.currentWordIndex && wordToHighlight !== -1) {
            this.highlightWord(wordToHighlight);
        }
    }
    
    // Highlight specific word
    highlightWord(wordIndex) {
        // Remove previous highlights
        this.currentVerseWords.forEach(word => {
            word.classList.remove('word-highlight', 'word-previous');
        });
        
        // Add current highlight
        if (wordIndex >= 0 && wordIndex < this.currentVerseWords.length) {
            this.currentVerseWords[wordIndex].classList.add('word-highlight');
            
            // Add previous word styling for context
            if (wordIndex > 0) {
                this.currentVerseWords[wordIndex - 1].classList.add('word-previous');
            }
            
            this.currentWordIndex = wordIndex;
            
            // Smooth scroll to keep highlighted word in view
            this.scrollToWord(this.currentVerseWords[wordIndex]);
        }
    }
    
    // Scroll to keep highlighted word visible
    scrollToWord(wordElement) {
        const container = document.querySelector('.verse-container');
        const wordRect = wordElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if word is outside visible area
        if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
            wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Pause highlighting
    pauseHighlighting() {
        if (this.highlightInterval) {
            clearInterval(this.highlightInterval);
            this.highlightInterval = null;
        }
    }
    
    // Resume highlighting
    resumeHighlighting() {
        if (!this.highlightInterval && this.wordTimings) {
            this.startHighlighting();
        }
    }
    
    // Reset highlighting
    reset() {
        this.pauseHighlighting();
        this.currentWordIndex = 0;
        this.wordTimings = null;
        
        // Remove all highlights
        document.querySelectorAll('.arabic-word').forEach(word => {
            word.classList.remove('word-highlight', 'word-previous');
        });
    }
    
    // Clean up
    cleanup() {
        this.reset();
        this.currentVerseWords = [];
    }
}

// Create global instance
window.wordHighlighter = new WordHighlighter();