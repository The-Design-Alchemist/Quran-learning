// word-highlighting.js - Word-by-word highlighting system with SMART ESTIMATION

class WordHighlighter {
    constructor() {
        this.currentWordIndex = 0;
        this.wordTimings = null;
        this.highlightInterval = null;
        this.currentVerseWords = [];
        this.syncOffset = parseInt(localStorage.getItem('syncOffset') || '300'); // Default 300ms offset
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

        // Store original text for cleanup
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

        // Load timings for this verse (for future use)
        this.loadWordTimings(getSurahFromURL(), verseNumber);
    }

    // Load word timings from file or generate estimated timings
    async loadWordTimings(surahNumber, verseNumber) {
        try {
            // Try to load timing file (for future implementation)
            const response = await fetch(`./quran-data/timings/${surahNumber}/${verseNumber}.json`);
            if (response.ok) {
                this.wordTimings = await response.json();
            } else {
                // Generate estimated timings if file doesn't exist
                this.wordTimings = null; // Will use smart estimation instead
            }
        } catch (error) {
            console.log('No timing file found, using smart estimation');
            this.wordTimings = null;
        }
    }

    // Start highlighting with audio
    startHighlighting() {
        const audio = audioService.getCurrentAudio();
        if (!audio || !this.currentVerseWords.length) return;
        
        if (this.highlightInterval) {
            clearInterval(this.highlightInterval);
        }
        
        this.currentWordIndex = -1;
        
        // Use smart estimation
        this.highlightWithSmartEstimation(audio);
    }

    // NEW METHOD: Smart estimation with word weighting
    highlightWithSmartEstimation(audio) {
        // Word weight map based on Arabic word length
        const WORD_WEIGHT_MAP = {
            short: 0.7,   // 1-2 letters (faster pronunciation)
            medium: 1.0,  // 3-4 letters (normal speed)
            long: 1.3,    // 5+ letters (slower pronunciation)
            veryLong: 1.6 // 7+ letters (much slower)
        };
        
        // Calculate weighted durations for each word
        const wordDurations = Array.from(this.currentVerseWords).map(wordEl => {
            const word = wordEl.textContent;
            const wordLength = word.length;
            
            // Special handling for words with special characters
            const hasSpecialChars = /[ًٌٍَُِّْٰ]/.test(word); // Arabic diacritics
            const extraWeight = hasSpecialChars ? 0.2 : 0;
            
            // Determine base weight
            let weight;
            if (wordLength <= 2) weight = WORD_WEIGHT_MAP.short;
            else if (wordLength <= 4) weight = WORD_WEIGHT_MAP.medium;
            else if (wordLength <= 6) weight = WORD_WEIGHT_MAP.long;
            else weight = WORD_WEIGHT_MAP.veryLong;
            
            return weight + extraWeight;
        });
        
        // Calculate total weight and normalize
        const totalWeight = wordDurations.reduce((sum, w) => sum + w, 0);
        const normalizedDurations = wordDurations.map(w => w / totalWeight);
        
        // Build cumulative time points (0 to 1)
        const timePoints = [0];
        for (let i = 0; i < normalizedDurations.length; i++) {
            const previousTime = timePoints[timePoints.length - 1];
            timePoints.push(previousTime + normalizedDurations[i]);
        }
        
        console.log('Time points calculated:', timePoints);
        console.log('Sync offset:', this.syncOffset + 'ms');
        
        // Highlighting interval
        this.highlightInterval = setInterval(() => {
            if (!audio || audio.paused || audio.ended) {
                this.pauseHighlighting();
                return;
            }
            
            const currentTime = audio.currentTime;
            const duration = audio.duration || 10;
            
            // Apply sync offset (positive offset = highlight earlier)
            const adjustedTime = (currentTime + (this.syncOffset / 1000)) / duration;
            
            // Ensure adjusted time is within bounds
            const clampedTime = Math.max(0, Math.min(1, adjustedTime));
            
            // Find corresponding word based on time points
            let targetWord = 0;
            for (let i = 0; i < timePoints.length - 1; i++) {
                if (clampedTime >= timePoints[i] && clampedTime < timePoints[i + 1]) {
                    targetWord = i;
                    break;
                }
            }
            
            // Handle end of verse
            if (clampedTime >= timePoints[timePoints.length - 1]) {
                targetWord = this.currentVerseWords.length - 1;
            }
            
            // Only update if word changed
            if (targetWord !== this.currentWordIndex && targetWord >= 0) {
                this.highlightWord(targetWord);
            }
        }, 30); // 30ms for smooth updates
    }

    // Jump to specific word when clicked
    jumpToWord(wordIndex) {
        const audio = audioService.getCurrentAudio();
        if (!audio || !audio.duration) return;

        // Check if audio is playing or paused
        const wasPlaying = window.appState.isReciting && !window.appState.isPaused;

        // Calculate the time position for this word using the same weighting
        const WORD_WEIGHT_MAP = {
            short: 0.7,
            medium: 1.0,
            long: 1.3,
            veryLong: 1.6
        };
        
        // Calculate weights for all words
        const wordDurations = Array.from(this.currentVerseWords).map(wordEl => {
            const wordLength = wordEl.textContent.length;
            const hasSpecialChars = /[ًٌٍَُِّْٰ]/.test(wordEl.textContent);
            const extraWeight = hasSpecialChars ? 0.2 : 0;
            
            let weight;
            if (wordLength <= 2) weight = WORD_WEIGHT_MAP.short;
            else if (wordLength <= 4) weight = WORD_WEIGHT_MAP.medium;
            else if (wordLength <= 6) weight = WORD_WEIGHT_MAP.long;
            else weight = WORD_WEIGHT_MAP.veryLong;
            
            return weight + extraWeight;
        });
        
        const totalWeight = wordDurations.reduce((sum, w) => sum + w, 0);
        const normalizedDurations = wordDurations.map(w => w / totalWeight);
        
        // Calculate target time
        let targetTimePercent = 0;
        for (let i = 0; i < wordIndex; i++) {
            targetTimePercent += normalizedDurations[i];
        }
        
        // Apply to audio (subtract offset since we're jumping directly)
        const targetTime = (targetTimePercent * audio.duration) - (this.syncOffset / 1000);
        audio.currentTime = Math.max(0, Math.min(audio.duration, targetTime));

        console.log(`Jumping to word ${wordIndex + 1} at ${targetTime.toFixed(2)}s`);

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
                `Jumped to word ${wordIndex + 1} of ${this.currentVerseWords.length}`
            );
        }

        // Visual feedback - brief pulse effect
        const clickedWord = this.currentVerseWords[wordIndex];
        clickedWord.classList.add('word-jumped');
        setTimeout(() => {
            clickedWord.classList.remove('word-jumped');
        }, 500);
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

            // Optional: Smooth scroll to word if it's out of view
            const container = document.querySelector('.verse-container');
            const wordRect = wordElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
                wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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
        if (!this.highlightInterval && this.currentVerseWords.length) {
            this.startHighlighting();
        }
    }

    // Reset highlighting
    reset() {
        this.pauseHighlighting();
        this.currentWordIndex = -1;
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

    // Method to adjust sync offset
    setSyncOffset(offset) {
        this.syncOffset = offset;
        localStorage.setItem('syncOffset', offset);
        console.log('Sync offset updated to:', offset + 'ms');
    }
}

// Create global instance
window.wordHighlighter = new WordHighlighter();