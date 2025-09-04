// verse-display.js - FIXED VERSION
// Verse display component for managing verse UI

class VerseDisplay {
    constructor() {
        this.container = document.getElementById('verse-container');
        this.counter = document.getElementById('verse-counter');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.isTransitioning = false; // Add transition lock
        this.currentSegmentIndex = 0; // Add segment tracking

        // ADD THIS - define waqfMarkers
        this.waqfMarkers = {
            '\u06D6': 'ۖ',  // small_stop
            '\u06D7': 'ۗ',  // preferable_stop
            '\u06D8': 'ۘ',  // permissible_stop
            '\u06D9': 'ۙ',  // preferred_stop
            '\u06DA': 'ۚ',  // compulsory_stop
            '\u06DB': 'ۛ'   // sufficient_stop
        };
    }

    // ADD THIS NEW METHOD (anywhere in the class, preferably after the show() method)
    detectOverflow() {
        const container = document.querySelector('.verse-container');
        const content = document.querySelector('.verse-display');
        
        if (container && content) {
            if (content.scrollHeight > container.clientHeight) {
                container.classList.add('has-overflow');
            } else {
                container.classList.remove('has-overflow');
            }
        }
    }

// In the generateHTML method, update the verse structure:
generateHTML() {
    this.container.innerHTML = '';
    
    // Create a single verse display container
    const verseDisplay = document.createElement('div');
    verseDisplay.className = 'verse-display';
    verseDisplay.id = 'verse-display';
    
    // This will hold the current verse content
    this.container.appendChild(verseDisplay);
    
    // Populate verse selector dropdown
    this.populateVerseSelector();
}


// Update the show method to handle segments
   // Update the show method in verse-display.js
show(index, direction = 'right') {
    const verseDisplay = document.getElementById('verse-display');
    if (!verseDisplay) return;


    
    const verse = window.appState.verses[index];
    if (!verse) {
        console.error('No verse at index:', index);
        return;
    }
    
    // Debug logging
    console.log(`Showing verse ${verse.number}:`, {
        hasSegments: !!verse.segments,
        segmentCount: verse.segments?.length,
        segments: verse.segments
    });
    
    // Clean up word highlighting from previous verse
    if (window.wordHighlighter && window.appState.currentVerseIndex !== index) {
        window.wordHighlighter.cleanup();
    }
    
    // Reset segment index when showing different verse
    if (window.appState.currentVerseIndex !== index) {
        this.currentSegmentIndex = 0;
    }
    
    
    // Update the current verse index
    window.appState.currentVerseIndex = index;
    
    // Check if verse has segments
    if (verse.segments && Array.isArray(verse.segments) && verse.segments.length > 1) {
        console.log(`Verse ${verse.number} has ${verse.segments.length} segments, showing segmented view`);
        window.appState.isSegmentedVerse = true;
        this.showSegmented(verse, this.currentSegmentIndex, direction);
    } else {
        console.log(`Verse ${verse.number} has no segments, showing full verse`);
        window.appState.isSegmentedVerse = false;
        this.showFullVerse(verse, direction);
    }
    
    // Save reading progress
    if (window.readingProgress && verse.number !== 'Bismillah') {
        const surahNumber = getSurahFromURL();
        window.readingProgress.savePosition(surahNumber, index, verse.number);
    }
    
    this.updateCounter();
    this.updateNavigationButtons();
}

    // Update showSegmented method to properly handle segments
showSegmented(verse, segmentIndex, direction = 'right') {
    const verseDisplay = document.getElementById('verse-display');
    if (!verseDisplay || !verse.segments) return;
    
    const segment = verse.segments[segmentIndex];
    if (!segment) return;
    
    // Store current segment for repeat functionality
    window.appState.currentSegment = segmentIndex;
    window.appState.isSegmentedVerse = true;
    
    verseDisplay.classList.add(direction === 'right' ? 'exit-left' : 'exit-right');
    
    setTimeout(() => {
        verseDisplay.className = 'verse-display';
        
        // Show verse number at the beginning of first segment
        const verseNumberDisplay = segmentIndex === 0 ? 
            `<div class="verse-number">${verse.number}</div>` : '';
        
        // Add verse end mark only on last segment
        const isLastSegment = segmentIndex === verse.segments.length - 1;
        const verseEndMark = isLastSegment ? 
            `<span class="verse-end-mark">${this.getVerseEndMark(verse.number)}</span>` : '';
        
        verseDisplay.innerHTML = `
        <div class="verse-content">
            ${verseNumberDisplay}
            <div class="segment-indicator">
                Part ${segmentIndex + 1} of ${verse.segments.length}
                ${segment.waqfMark ? `- ${this.getWaqfName(segment.type)}` : ''}
            </div>
            <div class="verse-text-group">
                <div class="arabic-text">
                    ${this.wrapWordsForHighlighting(segment.arabic, verse.number, segmentIndex)}
                    ${verseEndMark}
                </div>
                <div class="transliteration-text">${segment.transliteration}</div>
                <div class="english-text">${segment.translation}</div>
            </div>
        </div>
        
        <div class="segment-controls">
            <button class="segment-nav-btn" 
                    onclick="window.verseDisplay.navigateSegment('prev')" 
                    ${segmentIndex === 0 ? 'disabled' : ''}>
                ◀ Previous Part
            </button>
            
            <div class="segment-progress">
                ${verse.segments.map((_, idx) => 
                    `<span class="segment-dot ${idx === segmentIndex ? 'active' : ''}" 
                           onclick="window.verseDisplay.jumpToSegment(${idx})"></span>`
                ).join('')}
            </div>
            
            <button class="segment-nav-btn" 
                    onclick="window.verseDisplay.navigateSegment('next')"
                    ${segmentIndex === verse.segments.length - 1 ? 'disabled' : ''}>
                Next Part ▶
            </button>
        </div>
    `;
        
        verseDisplay.setAttribute('data-verse-index', window.appState.currentVerseIndex);
        verseDisplay.setAttribute('data-segment-index', segmentIndex);
        verseDisplay.setAttribute('data-verse-number', verse.number);
        verseDisplay.classList.add('active');
        
        setTimeout(() => {
            verseDisplay.classList.add(direction === 'right' ? 'enter-right' : 'enter-left');
            this.initializeWordClickHandlers();
        }, 50);
        
    }, 300);
}
    
// Update the navigateSegment method:
navigateSegment(direction) {
    const verse = window.appState.verses[window.appState.currentVerseIndex];
    if (!verse.segments) return;

    // Reset repeat mode when manually navigating segments
    if (window.appState.repeatMode === 'segment') {
        window.appState.repeatMode = 'none';
        const btn = document.getElementById('repeat-btn');
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🔁 Repeat';
        }
    }
    
    const audio = audioService.getCurrentAudio();
    
    if (direction === 'next' && this.currentSegmentIndex < verse.segments.length - 1) {
        this.currentSegmentIndex++;
        this.showSegmented(verse, this.currentSegmentIndex);
        
        // Restart audio for new segment
        if (audio && window.appState.isReciting) {
            window.playbackControls.playCurrentVerse();
        }
    } else if (direction === 'prev' && this.currentSegmentIndex > 0) {
        this.currentSegmentIndex--;
        this.showSegmented(verse, this.currentSegmentIndex);
        
        // Restart audio for new segment
        if (audio && window.appState.isReciting) {
            window.playbackControls.playCurrentVerse();
        }
    }
}
    
    getVerseEndMark(verseNumber) {
    if (!verseNumber || verseNumber === 'Bismillah') return '';
    
    const arabicNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNum = verseNumber.toString()
        .split('')
        .map(d => arabicNumerals[parseInt(d)])
        .join('');
    return `۝${arabicNum}`;
}

    // Add method to wrap words for highlighting
wrapWordsForHighlighting(arabicText, verseNumber, segmentIndex) {
    const words = arabicText.split(/\s+/);
    let actualWordIndex = 0;
    
    return words.map((word) => {
        // Check for waqf marks
        if (/[\u06D6-\u06DD]/.test(word)) {
            return `<span class="waqf-mark">${word}</span>`;
        }
        // Check for verse end numbers
        if (/^[\u06DD][\u0660-\u0669]+$/.test(word)) {
            return `<span class="verse-end-marker">${word}</span>`;
        }
        // Regular words get clickable spans
        const span = `<span class="arabic-word" 
                      data-word-index="${actualWordIndex}" 
                      data-verse-number="${verseNumber}"
                      data-segment-index="${segmentIndex}">${word}</span>`;
        actualWordIndex++;
        return span;
    }).join(' ');
}
    
    // Initialize click handlers for word jumping
initializeWordClickHandlers() {
    document.querySelectorAll('.arabic-word').forEach(wordElement => {
        wordElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const wordIndex = parseInt(wordElement.dataset.wordIndex);
            const segmentIndex = parseInt(wordElement.dataset.segmentIndex);
            this.jumpToWord(wordIndex, segmentIndex);
        });
    });
}
    
  // Update the jumpToWord method:
jumpToWord(wordIndex, segmentIndex) {
    const audio = audioService.getCurrentAudio();
    if (!audio || !window.currentVerseTimings) return;
    
    const verse = window.appState.verses[window.appState.currentVerseIndex];
    let fullVerseWordIndex = wordIndex;
    
    // Calculate the actual word position in the full verse
    if (verse.segments && verse.segments.length > 1 && segmentIndex !== undefined) {
        fullVerseWordIndex = 0;
        
        // Add all words from previous segments
        for (let i = 0; i < segmentIndex; i++) {
            const segmentText = verse.segments[i].arabic;
            const words = segmentText.split(/\s+/).filter(w => 
                w.length > 0 && !this.isWaqfMark(w)
            );
            fullVerseWordIndex += words.length;
        }
        
        // Add the clicked word index
        fullVerseWordIndex += wordIndex;
    }
    
    console.log(`Jumping to segment ${segmentIndex}, word ${wordIndex}, full verse word ${fullVerseWordIndex}`);
    
    // Jump to the word timing
    if (window.currentVerseTimings.words && window.currentVerseTimings.words[fullVerseWordIndex]) {
        const wordTiming = window.currentVerseTimings.words[fullVerseWordIndex];
        audio.currentTime = wordTiming.start;
        
        // Resume playback if paused
        if (audio.paused) {
            audio.play();
            window.appState.isReciting = true;
            window.appState.isPaused = false;
            
            // Update play/pause button
            const icon = document.getElementById('play-pause-icon');
            const text = document.getElementById('play-pause-text');
            if (icon && text) {
                icon.textContent = '⏸️';
                text.textContent = 'Pause';
            }
        }
        
        // Restart highlighting from this position
        if (window.wordHighlighter) {
            window.wordHighlighter.reset();
            setTimeout(() => {
                window.wordHighlighter.reinitializeForSegment();
                window.wordHighlighter.startPreciseHighlighting(audio, window.currentVerseTimings.words);
            }, 100);
        }
    }
}

// Add helper to check if word is waqf mark
isWaqfMark(word) {
    const waqfMarks = ['\u06D6', '\u06D7', '\u06D8', '\u06D9', '\u06DA', '\u06DB'];
    return waqfMarks.some(mark => word.includes(mark));
}
    
    
    // Show full verse (no segments)
    showFullVerse(verse, direction) {
        const verseDisplay = document.getElementById('verse-display');
        if (!verseDisplay) return;
        
        // Add exit animation
        verseDisplay.classList.add(direction === 'right' ? 'exit-left' : 'exit-right');
        
        setTimeout(() => {
            verseDisplay.className = 'verse-display';
            
            // Your existing verse display code
            if (verse.number === 'Bismillah') {
                verseDisplay.innerHTML = `
                    <div class="bismillah">
                        <div class="bismillah-arabic">${verse.text}</div>
                        <div class="bismillah-transliteration">${verse.transliteration}</div>
                        <div class="bismillah-english">${verse.english}</div>
                    </div>
                `;
            } else {
                verseDisplay.innerHTML = `
                    <div class="verse-content">
                        <div class="verse-number">${verse.number}</div>
                        <div class="verse-text-group">
                            <div class="arabic-text">${verse.text}</div>
                            <div class="transliteration-text">${verse.transliteration}</div>
                            <div class="english-text">${verse.english}</div>
                        </div>
                    </div>
                `;
            }
            
            verseDisplay.setAttribute('data-verse-index', window.appState.currentVerseIndex);
            verseDisplay.classList.add('active');
            
            setTimeout(() => {
                verseDisplay.classList.add(direction === 'right' ? 'enter-right' : 'enter-left');
                this.detectOverflow();
            }, 50);
            
        }, 300);
    }
    

    // Navigate to next (handles segments)
   // Update next() method to NOT handle segments:
next() {
    if (this.isTransitioning) return;
    
    // Always move to next verse, not segment
    if (window.appState.currentVerseIndex < window.appState.verses.length - 1) {
        this.currentSegmentIndex = 0;
        this.stopAllAudio();
        
        setTimeout(() => {
            window.appState.currentVerseIndex++;
            this.show(window.appState.currentVerseIndex, 'right');
            
            if (window.appState.isReciting && !window.appState.isPaused) {
                setTimeout(() => {
                    window.playbackControls.playCurrentVerse();
                }, 500);
            }
        }, 100);
    }
}

    // Update previous() method to NOT handle segments:
previous() {
    if (this.isTransitioning) return;
    
    // Always move to previous verse, not segment
    if (window.appState.currentVerseIndex > 0) {
        this.stopAllAudio();
        
        setTimeout(() => {
            window.appState.currentVerseIndex--;
            this.currentSegmentIndex = 0;
            this.show(window.appState.currentVerseIndex, 'left');
            
            if (window.appState.isReciting && !window.appState.isPaused) {
                setTimeout(() => {
                    window.playbackControls.playCurrentVerse();
                }, 500);
            }
        }, 100);
    }
}

// Update the jumpToSegment method in verse-display.js
// Update jumpToSegment in verse-display.js
jumpToSegment(segmentIndex) {
    const currentVerse = window.appState.verses[window.appState.currentVerseIndex];
    if (currentVerse && currentVerse.segments && segmentIndex < currentVerse.segments.length) {
        const previousSegmentIndex = this.currentSegmentIndex;
        this.currentSegmentIndex = segmentIndex;
        
        // Keep the last word highlighted during transition
        const keepHighlight = Math.abs(previousSegmentIndex - segmentIndex) === 1;
        
        this.showSegmented(currentVerse, segmentIndex);
        
        const audio = audioService.getCurrentAudio();
        if (audio && window.currentVerseTimings && window.currentVerseTimings.segments) {
            const segmentTiming = window.currentVerseTimings.segments[segmentIndex];
            if (segmentTiming) {
                const isManualJump = Math.abs(previousSegmentIndex - segmentIndex) > 1;
                const isAudioOutOfSync = Math.abs(audio.currentTime - segmentTiming.start) > 1;
                
                if (isManualJump || isAudioOutOfSync) {
                    audio.currentTime = segmentTiming.start;
                }
            }
        }
        
        // Reinitialize word highlighting with delay
        if (window.wordHighlighter && audio) {
            // Clear old highlighting only if not sequential
            if (!keepHighlight) {
                window.wordHighlighter.reset();
            }
            
            setTimeout(() => {
                if (!audio.paused && window.appState.isReciting) {
                    window.wordHighlighter.reinitializeForSegment();
                    
                    if (window.currentVerseTimings && window.currentVerseTimings.words) {
                        window.wordHighlighter.startPreciseHighlighting(
                            audio, 
                            window.currentVerseTimings.words
                        );
                    }
                }
            }, 400);
        }
        
        if (window.playbackControls) {
            window.playbackControls.updateStatus(
                `Part ${segmentIndex + 1} of ${currentVerse.segments.length}`
            );
        }
    }
}

    // Get Waqf name for display
    getWaqfName(waqfType) {
        const waqfNames = {
            'compulsory_stop': 'Compulsory Stop (مـ)',
            'absolute_pause': 'Absolute Pause (ط)',
            'permissible_stop': 'Permissible Stop (ج)',
            'preferred_stop': 'Preferred Stop (صلى)',
            'small_stop': 'Brief Pause',
            'verse_end': 'End of Verse'
        };
        return waqfNames[waqfType] || waqfType;
    }


    // NEW METHOD: Stop all audio completely
    stopAllAudio() {
        // Stop current audio
        if (audioService.getCurrentAudio()) {
            audioService.getCurrentAudio().pause();
            audioService.getCurrentAudio().currentTime = 0;
        }
        
        // Stop any other audio elements that might be playing
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.remove(); // Remove from DOM
        });

        // Clean up word highlighting
    if (window.wordHighlighter) {
        window.wordHighlighter.cleanup();
    }
        
        // Clean up audio service
        audioService.cleanup();
        
        // Remove all highlights
        this.removeAllHighlights();
    }

   // Add this new method to populate the dropdown
populateVerseSelector() {
    const selector = document.getElementById('verse-selector');
    const totalSpan = document.getElementById('verse-total');
    
    if (!selector || !window.appState.verses) return;
    
    // Clear existing options
    selector.innerHTML = '';
    
    // Add options for each verse
    window.appState.verses.forEach((verse, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        if (verse.number === 'Bismillah') {
            option.textContent = 'Bismillah';
        } else {
            option.textContent = verse.number;
        }
        
        selector.appendChild(option);
    });
    
    // Update total count (excluding Bismillah)
    const totalVerses = window.appState.currentSurah.verses;
    totalSpan.textContent = `of ${totalVerses}`;
}

// Update the updateCounter method
    updateCounter() {
        const current = window.appState.verses[window.appState.currentVerseIndex];
        const selector = document.getElementById('verse-selector');
        
        if (current) {
            // Update dropdown selection
            if (selector) {
                selector.value = window.appState.currentVerseIndex;
            }
            
            // Update verse display info
            let displayText = '';
            if (current.number === 'Bismillah') {
                displayText = 'Bismillah';
            } else {
                const totalVerses = window.appState.currentSurah.verses;
                displayText = `Verse ${current.number} of ${totalVerses}`;
                
                // Add segment info if applicable
                if (current.segments && current.segments.length > 1) {
                    displayText += ` (Part ${this.currentSegmentIndex + 1}/${current.segments.length})`;
                }
            }
            
            const counter = document.getElementById('verse-counter');
            if (counter) {
                counter.textContent = displayText;
            }
        }
    }



    
    // Add method to handle jumping to selected verse
jumpToVerse(index) {
    // Stop any ongoing playback first
    if (window.appState.isReciting) {
        window.playbackControls.stop();
    }
    
    // Update verse index
    window.appState.currentVerseIndex = parseInt(index);
    
    // Show the selected verse
    this.show(window.appState.currentVerseIndex);
    
    // Update navigation buttons
    this.updateNavigationButtons();
    
    console.log(`Jumped to verse ${window.appState.verses[window.appState.currentVerseIndex].number}`);
}
    
    

    updateNavigationButtons() {
    // Get buttons directly each time
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Only disable based on position, not on playback state
    if (prevBtn) {
        prevBtn.disabled = window.appState.currentVerseIndex === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = window.appState.currentVerseIndex === window.appState.verses.length - 1;
    }
}

    // Add highlight to current verse
   addHighlight(verseId) {
    const verseDisplay = document.getElementById('verse-display');
    if (verseDisplay) {
        verseDisplay.classList.add('current-verse-highlight');
    }
}

    // Remove highlight from verse
    removeHighlight(verseId) {
    const verseDisplay = document.getElementById('verse-display');
    if (verseDisplay) {
        verseDisplay.classList.remove('current-verse-highlight');
    }
}

    // Remove all highlights
    removeAllHighlights() {
    const verseDisplay = document.getElementById('verse-display');
    if (verseDisplay) {
        verseDisplay.classList.remove('current-verse-highlight');
    }
}

    // Get current verse element
    getCurrentVerseElement() {
        return document.getElementById('verse-display');
    }

    // Get current segment index
    getCurrentSegmentIndex() {
        return this.currentSegmentIndex;
    }

}

// Add window resize listener to recheck overflow
window.addEventListener('resize', () => {
    if (window.verseDisplay) {
        window.verseDisplay.detectOverflow();
    }
});

// Create global instance
window.verseDisplay = new VerseDisplay();

