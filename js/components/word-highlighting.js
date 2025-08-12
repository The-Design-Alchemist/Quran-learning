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
        // Since it's single verse, we don't need to scroll
    }
}

    // Simplified for single verse display - adds visual focus effect
scrollToWord(wordElement) {
    // For single verse display, we add a subtle focus animation
    // instead of scrolling since everything is visible
    
    if (!wordElement) return;
    
    // Optional: Add a subtle scale animation to draw attention
    wordElement.style.transition = 'transform 0.3s ease';
    wordElement.style.transform = 'scale(1.2)';
    
    // Reset the scale after a moment
    setTimeout(() => {
        wordElement.style.transform = '';
    }, 300);
    
    // Optional: If the verse is very long and might overflow on mobile,
    // ensure the word is in the center of the viewport
    const container = document.querySelector('.verse-display');
    const containerRect = container?.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    
    // Only if word is outside the visible area (edge case for very long verses)
    if (containerRect && (wordRect.left < containerRect.left || wordRect.right > containerRect.right)) {
        wordElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'center' 
        });
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