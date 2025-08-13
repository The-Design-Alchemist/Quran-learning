// word-highlighting.js - Word-by-word highlighting system

class WordHighlighter {
    constructor() {
        this.currentWordIndex = 0;
        this.wordTimings = null;
        this.highlightInterval = null;
        this.currentVerseWords = [];
    }

   initializeVerse(verseNumber) {
    // Check if highlighting is enabled
    if (!window.appState.highlightingEnabled) {
        return;
    }
       this.reset();

    // Updated selector for single verse display
    const verseElement = document.querySelector('.verse-display.active .arabic-text');
    console.log('Verse element found:', verseElement);

    if (!verseElement) return;

    // Store original text for cleanup (POINT 6)
    if (!verseElement.dataset.originalText) {
        verseElement.dataset.originalText = verseElement.textContent;
    }

    // Split verse into words and wrap each in a span
    const arabicText = verseElement.textContent;
    const words = arabicText.split(/\s+/).filter(word => word.length > 0);
    console.log('Words found:', words.length);

    // Create wrapped words with spans
    verseElement.innerHTML = words.map((word, index) =>
        `<span class="arabic-word" data-word-index="${index}">${word}</span>`
    ).join(' ');

    this.currentVerseWords = document.querySelectorAll('.verse-display.active .arabic-word');

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
    
    if (this.highlightInterval) {
        clearInterval(this.highlightInterval);
    }
    
    this.currentWordIndex = -1;
    
    // Get sync offset from settings (default 300ms works well for Mishary)
    const syncOffset = window.settingsManager?.settings?.syncOffset || 300;
    
    this.highlightInterval = setInterval(() => {
        if (!audio || audio.paused || audio.ended) {
            this.pauseHighlighting();
            // Clean up when audio ends
            if (audio && audio.ended) {
                setTimeout(() => {
                    this.reset();
                }, 300);
            }
            return;
        }
        
        const currentTime = audio.currentTime;
        const duration = audio.duration || 10;
        const wordCount = this.currentVerseWords.length;
        
        // Calculate progress percentage
        const progressPercent = currentTime / duration;
        
        // Stop highlighting near the end to prevent wrap-around
        if (progressPercent >= 0.97) {
            // Highlight last word
            if (this.currentWordIndex !== wordCount - 1) {
                this.highlightWord(wordCount - 1);
            }
            // Stop the interval
            this.pauseHighlighting();
            // Clean up after a short delay
            setTimeout(() => {
                this.reset();
            }, 500);
            return;
        }
        
        // Apply sync offset (in milliseconds)
        const adjustedTime = currentTime + (syncOffset / 1000);
        
        // Calculate which word should be highlighted
        const targetIndex = Math.min(
            Math.floor((adjustedTime / duration) * wordCount),
            wordCount - 1  // Never exceed last word
        );
        
        // Only update if changed and valid
        if (targetIndex !== this.currentWordIndex && targetIndex >= 0) {
            this.highlightWord(targetIndex);
        }
    }, 30);
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
        const wordElement = this.currentVerseWords[wordIndex];
        wordElement.classList.add('word-highlight');

        // Add previous word styling for context
        if (wordIndex > 0) {
            this.currentVerseWords[wordIndex - 1].classList.add('word-previous');
        }

        this.currentWordIndex = wordIndex;

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
    this.currentWordIndex = -1;  // Reset to -1 instead of 0
    this.wordTimings = null;

    // Remove all highlights from single verse display
    document.querySelectorAll('.verse-display .arabic-word').forEach(word => {
        word.classList.remove('word-highlight', 'word-previous');
    });
}
    
    // Clean up
   cleanup() {
    this.reset();
    this.currentVerseWords = [];
    
    // Ensure we clean up from the single verse display
    const verseDisplay = document.querySelector('.verse-display');
    if (verseDisplay) {
        const arabicText = verseDisplay.querySelector('.arabic-text');
        if (arabicText && arabicText.dataset.originalText) {
            // Restore original text if we stored it
            arabicText.textContent = arabicText.dataset.originalText;
            delete arabicText.dataset.originalText;
        }
    }
}
}

// Create global instance
window.wordHighlighter = new WordHighlighter();