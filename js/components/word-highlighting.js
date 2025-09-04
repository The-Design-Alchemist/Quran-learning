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
        this.cleanup();
        
        // Check if highlighting is enabled
    if (!window.appState.highlightingEnabled) {
        console.log('Word highlighting is disabled');
        // Still wrap words for clicking, but without highlighting classes
        this.initializeForClickOnly();
        return;
    }
    
    if (!window.appState.highlightingEnabled) {
        return;
    }
    
    this.reset();

    const verseElement = document.querySelector('.verse-display.active .arabic-text');
    if (!verseElement) return;

    if (!verseElement.dataset.originalText) {
        verseElement.dataset.originalText = verseElement.textContent;
    }

    const arabicText = verseElement.textContent;
    const words = arabicText.split(/\s+/).filter(word => word.length > 0);
    
    // Wrap words but exclude waqf marks and verse end numbers
    verseElement.innerHTML = words.map((word, index) => {
        // Check if word contains waqf mark
        if (/[\u06D6-\u06DD]/.test(word)) {
            return `<span class="waqf-mark">${word}</span>`;
        }
        // Check if it's a verse end marker (Arabic-Indic numerals)
        if (/^[\u06DD][\u0660-\u0669]+$/.test(word) || /^[\u06DD][\u0660-\u0669]+[\u06DD]$/.test(word)) {
            return `<span class="verse-end-marker">${word}</span>`;
        }
        return `<span class="arabic-word" data-word-index="${index}">${word}</span>`;
    }).join(' ');

    // Only get actual words for highlighting, not waqf marks or verse numbers
    this.currentVerseWords = document.querySelectorAll('.verse-display.active .arabic-word');

    this.currentVerseWords.forEach((wordElement, index) => {
        wordElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.jumpToWord(index);
        });
    });
}

   // Replace the loadWordTimings method in word-highlighting.js
async loadWordTimings(surahNumber, verseNumber) {
    // Don't load separately - use the timing data already loaded by controls.js
    // The timing data is set globally as window.currentVerseTimings
    if (window.currentVerseTimings && window.currentVerseTimings.words) {
        this.wordTimings = window.currentVerseTimings.words;
        console.log(`✅ Using loaded timings for verse ${verseNumber}`);
    } else {
        this.wordTimings = null;
        console.log('⚠️ No timing data available for highlighting');
    }
}

    
initializeForClickOnly() {
    const verseElement = document.querySelector('.verse-display.active .arabic-text');
    if (!verseElement) return;

    if (!verseElement.dataset.originalText) {
        verseElement.dataset.originalText = verseElement.textContent;
    }

    const arabicText = verseElement.textContent;
    const words = arabicText.split(/\s+/).filter(word => word.length > 0);
    
    // Wrap words but exclude waqf marks and verse end numbers
    verseElement.innerHTML = words.map((word, index) => {
        // Check if word contains waqf mark
        if (/[\u06D6-\u06DD]/.test(word)) {
            return `<span class="waqf-mark">${word}</span>`;
        }
        // Check if it's a verse end marker
        if (/^[\u06DD][\u0660-\u0669]+$/.test(word) || /^[\u06DD][\u0660-\u0669]+[\u06DD]$/.test(word)) {
            return `<span class="verse-end-marker">${word}</span>`;
        }
        // Add clickable words WITHOUT storing them in currentVerseWords
        return `<span class="arabic-word-clickable" data-word-index="${index}">${word}</span>`;
    }).join(' ');

    // Add click handlers for word jumping
    document.querySelectorAll('.arabic-word-clickable').forEach((wordElement, index) => {
        wordElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.jumpToWord(index);
        });
    });
}
    

    // Replace the existing startHighlighting method
    startHighlighting() {
   // Check if highlighting is enabled
    if (!window.appState.highlightingEnabled) {
        console.log('Word highlighting is disabled');
        return;
    }

    const audio = audioService.getCurrentAudio();
    if (!audio || !this.currentVerseWords.length) return;
    
    if (this.highlightInterval) {
        clearInterval(this.highlightInterval);
    }
    
    // Use precise timing data if available
    if (window.currentVerseTimings && window.currentVerseTimings.words) {
        this.startPreciseHighlighting(audio, window.currentVerseTimings.words);
    } else {
        // Fallback to estimate-based highlighting
        this.startEstimatedHighlighting(audio);
    }
}
    
// Replace the startPreciseHighlighting method completely:
startPreciseHighlighting(audio, wordTimings) {
    if (!wordTimings || !this.currentVerseWords) return;
    
    let currentHighlightedIndex = -1;
    const verse = window.appState.verses[window.appState.currentVerseIndex];
    
    this.highlightInterval = setInterval(() => {
        if (!audio || audio.paused || audio.ended) {
            if (audio?.ended) this.reset();
            return;
        }
        
        const currentTime = audio.currentTime;
        const timing = window.currentVerseTimings;
        
        // Handle segmented verses
        if (verse?.segments?.length > 1 && timing?.segments) {
            const segmentIndex = window.verseDisplay.getCurrentSegmentIndex();
            const segment = timing.segments[segmentIndex];
            
            if (!segment) return;
            
            // Use pre-calculated word indices
            const { startWord, endWord } = segment;
            
            // Find current word in range
            for (let i = startWord; i <= endWord && i < wordTimings.length; i++) {
                if (currentTime >= wordTimings[i].start && currentTime < wordTimings[i].end) {
                    const localIndex = i - startWord;
                    
                    if (localIndex !== currentHighlightedIndex && 
                        localIndex < this.currentVerseWords.length) {
                        currentHighlightedIndex = localIndex;
                        this.highlightWord(localIndex);
                    }
                    break;
                }
            }
        } else {
            // Non-segmented verse
            for (let i = 0; i < wordTimings.length; i++) {
                if (currentTime >= wordTimings[i].start && currentTime < wordTimings[i].end) {
                    if (i !== currentHighlightedIndex && i < this.currentVerseWords.length) {
                        currentHighlightedIndex = i;
                        this.highlightWord(i);
                    }
                    break;
                }
            }
        }
    }, 30);
}

// Helper method to check if word is a waqf mark
isWaqfMark(word) {
    const waqfMarks = ['\u06D6', '\u06D7', '\u06D8', '\u06D9', '\u06DA', '\u06DB', '۞', 'ۚ', 'ۛ'];
    return waqfMarks.some(mark => word.includes(mark));
}

// Helper method to check if word is verse end mark
isVerseEndMark(word) {
    // Arabic-Indic digits used in verse end marks
    return /^۞[۰-۹]+$/.test(word);
}

// Add helper method to check if segment should advance
// Replace checkSegmentAdvance method:
checkSegmentAdvance(currentTime, verse, currentWordIndex) {
    if (!verse || !verse.segments || verse.segments.length <= 1) return;
    if (!window.currentVerseTimings || !window.currentVerseTimings.words) return;
    
    const currentSegmentIndex = window.verseDisplay.getCurrentSegmentIndex();
    let expectedWordCount = 0;
    
    // Calculate expected word count up to current segment
    for (let i = 0; i <= currentSegmentIndex; i++) {
        const segmentText = verse.segments[i].arabic;
        const words = segmentText.split(/\s+/).filter(w => 
            w.length > 0 && !this.isWaqfMark(w)
        );
        expectedWordCount += words.length;
    }
    
}


// Add helper to check if a word is a waqf mark
isWaqfMark(word) {
    const waqfMarks = ['\u06D6', '\u06D7', '\u06D8', '\u06D9', '\u06DA', '\u06DB'];
    return waqfMarks.some(mark => word.includes(mark));
}

reinitializeForSegment() {
    // Don't reset completely, just update the word elements
    this.currentWordIndex = -1;
    
    const verseElement = document.querySelector('.verse-display.active .arabic-text');
    if (!verseElement) return;
    
    // Store original text
    if (!verseElement.dataset.originalText) {
        verseElement.dataset.originalText = verseElement.textContent;
    }
    
    // Split into words and wrap
    const arabicText = verseElement.textContent;
    const words = arabicText.split(/\s+/).filter(word => word.length > 0);
    
    // Track actual word index (excluding waqf marks)
    let actualWordIndex = 0;
    
    verseElement.innerHTML = words.map((word) => {
        // Check if word contains waqf mark
        if (/[\u06D6-\u06DD]/.test(word)) {
            return `<span class="waqf-mark">${word}</span>`;
        }
        // Check if it's a verse end marker
        if (/^[\u06DD][\u0660-\u0669]+$/.test(word) || /^[\u06DD][\u0660-\u0669]+[\u06DD]$/.test(word)) {
            return `<span class="verse-end-marker">${word}</span>`;
        }
        // Only increment index for actual words
        const span = `<span class="arabic-word" data-word-index="${actualWordIndex}">${word}</span>`;
        actualWordIndex++;
        return span;
    }).join(' ');
    
    // Only select actual words, not waqf marks or verse numbers
    this.currentVerseWords = document.querySelectorAll('.verse-display.active .arabic-word');
    
    // Re-add click handlers
    this.currentVerseWords.forEach((wordElement, index) => {
        wordElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.jumpToWord(index);
        });
    });
    
    console.log(`Reinitialized for segment with ${this.currentVerseWords.length} actual words`);
}

    // Keep the estimated highlighting as fallback
startEstimatedHighlighting(audio) {
    // Your existing estimated highlighting code
    const duration = audio.duration || 10;
    const wordCount = this.currentVerseWords.length;
    
    this.highlightInterval = setInterval(() => {
        if (!audio || audio.paused || audio.ended) {
            this.pauseHighlighting();
            return;
        }
        
        const currentTime = audio.currentTime;
        const progressPercent = currentTime / duration;
        const targetIndex = Math.min(
            Math.floor(progressPercent * wordCount),
            wordCount - 1
        );
        
        if (targetIndex !== this.currentWordIndex && targetIndex >= 0) {
            this.highlightWord(targetIndex);
        }
    }, 100);
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

        // Check if we have precise timing data
        if (window.currentVerseTimings && window.currentVerseTimings.words) {
            // For segmented verses, we need to find the correct word timing
            const currentSegmentIndex = window.verseDisplay.getCurrentSegmentIndex();
            const verse = window.appState.verses[window.appState.currentVerseIndex];
        
            if (verse && verse.segments && verse.segments.length > 1) {
                // Calculate word offset for current segment
                let wordOffset = 0;
                for (let i = 0; i < currentSegmentIndex; i++) {
                    const segmentWords = verse.segments[i].arabic.split(/\s+/).filter(w => w.length > 0);
                    wordOffset += segmentWords.length;
                }
            
                // Adjust word index for the full verse
                const fullVerseWordIndex = wordOffset + wordIndex;
            
                // Find the timing for this word
                if (fullVerseWordIndex < window.currentVerseTimings.words.length) {
                    const wordTiming = window.currentVerseTimings.words[fullVerseWordIndex];
                    audio.currentTime = wordTiming.start;
                
                    console.log(`Jumping to word ${wordIndex + 1} (verse word ${fullVerseWordIndex + 1}) at ${wordTiming.start.toFixed(2)}s`);
                }
            } else {
                // Non-segmented verse - use direct word timing
                if (wordIndex < window.currentVerseTimings.words.length) {
                    const wordTiming = window.currentVerseTimings.words[wordIndex];
                    audio.currentTime = wordTiming.start;
                }
            }
        } else {

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
    // Update the reset method to clear intervals properly:
reset() {
    // Clear any running intervals first
    if (this.highlightInterval) {
        clearInterval(this.highlightInterval);
        this.highlightInterval = null;
    }
    
    this.currentWordIndex = -1;
    this.wordTimings = null;
    
    // Remove all highlights from single verse display
    document.querySelectorAll('.verse-display .arabic-word').forEach(word => {
        word.classList.remove('word-highlight', 'word-previous', 'word-jumped');
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

// Add Debug Helper HERE - before creating global instance
function debugSegmentMapping() {
    const verse = window.appState.verses[window.appState.currentVerseIndex];
    const timing = window.currentVerseTimings;
    const segmentIndex = window.verseDisplay.getCurrentSegmentIndex();
    
    if (!timing || !timing.segments) {
        console.log('No timing data available');
        return;
    }
    
    const currentSegment = timing.segments[segmentIndex];
    const audio = audioService.getCurrentAudio();
    
    console.table({
        'Current Segment': segmentIndex + 1,
        'Segment Start Time': currentSegment?.start,
        'Segment End Time': currentSegment?.end,
        'Start Word Index': currentSegment?.startWord || 'Not set',
        'End Word Index': currentSegment?.endWord || 'Not set',
        'Displayed Words': document.querySelectorAll('.arabic-word').length,
        'Audio Current Time': audio?.currentTime.toFixed(2),
        'Audio Paused': audio?.paused
    });
    
    // Also log the words in current segment
    if (currentSegment?.startWord !== undefined && currentSegment?.endWord !== undefined) {
        console.log('Words in this segment:');
        for (let i = currentSegment.startWord; i <= currentSegment.endWord && i < timing.words.length; i++) {
            console.log(`  Word ${i}: "${timing.words[i].word}" (${timing.words[i].start.toFixed(2)} - ${timing.words[i].end.toFixed(2)})`);
        }
    }
}

// Make it globally accessible for debugging
window.debugSegment = debugSegmentMapping;


// Create global instance
window.wordHighlighter = new WordHighlighter();