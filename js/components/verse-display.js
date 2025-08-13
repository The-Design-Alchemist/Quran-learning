// verse-display.js - FIXED VERSION
// Verse display component for managing verse UI

class VerseDisplay {
    constructor() {
        this.container = document.getElementById('verse-container');
        this.counter = document.getElementById('verse-counter');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.isTransitioning = false; // Add transition lock
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


// In verse-display.js, update the show() method:
show(index, direction = 'right') {
    const verseDisplay = document.getElementById('verse-display');
    if (!verseDisplay) return;
    
    const verse = window.appState.verses[index];
    if (!verse) return;
    
    // Add exit animation to current content
    verseDisplay.classList.add(direction === 'right' ? 'exit-left' : 'exit-right');
    
    // After animation, update content
    setTimeout(() => {
        // Clear previous classes
        verseDisplay.className = 'verse-display';
        
        // Update content based on verse type
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
        
        // Detect verse length and add data attribute
        const wordCount = verse.text.split(/\s+/).length;
        if (wordCount > 50) {
            verseDisplay.setAttribute('data-verse-length', 'very-long');
        } else if (wordCount > 30) {
            verseDisplay.setAttribute('data-verse-length', 'long');
        } else {
            verseDisplay.setAttribute('data-verse-length', 'normal');
        }
        
        // Set verse as active (for word highlighting)
        verseDisplay.setAttribute('data-verse-index', index);
        verseDisplay.classList.add('active');
        
        // Add enter animation
        setTimeout(() => {
            verseDisplay.classList.add(direction === 'right' ? 'enter-right' : 'enter-left');
            
            // CALL detectOverflow HERE
            this.detectOverflow();
            
            // SAVE READING PROGRESS HERE
            if (window.readingProgress && verse.number !== 'Bismillah') {
                const surahNumber = getSurahFromURL();
                window.readingProgress.savePosition(surahNumber, index, verse.number);
            }
        }, 50);
        
    }, 300);
    
    this.updateCounter();
    this.updateNavigationButtons();
}


    // Navigate to next verse - FIXED
    next() {
        if (this.isTransitioning) return; // Prevent multiple clicks
        
        if (window.appState.currentVerseIndex < window.appState.verses.length - 1) {
            // Disable navigation buttons temporarily
            const nextBtn = document.getElementById('next-btn');
            const prevBtn = document.getElementById('prev-btn');
            if (nextBtn) nextBtn.disabled = true;
            if (prevBtn) prevBtn.disabled = true;
            
            // Stop ALL audio playback completely
            this.stopAllAudio();
            
            // Clear any pending audio operations
            if (window.playbackControls.audioTimeout) {
                clearTimeout(window.playbackControls.audioTimeout);
                window.playbackControls.audioTimeout = null;
            }
            
            // Disable auto-advance to prevent conflicts
            window.appState.autoAdvance = false;
            
            // Wait for audio cleanup to complete
            setTimeout(() => {
                // Increment verse index
                window.appState.currentVerseIndex++;
                console.log(`Manual next to verse ${window.appState.currentVerseIndex}`);
                
                // Update display
                this.show(window.appState.currentVerseIndex, 'right');
                
                // If reciting and NOT paused, play the new verse
                if (window.appState.isReciting && !window.appState.isPaused) {
                    setTimeout(() => {
                        window.appState.autoAdvance = true;
                        window.playbackControls.playCurrentVerse();
                    }, 500);
                } else {
                    // Even if paused, re-enable auto-advance for when playback resumes
                    window.appState.autoAdvance = true;
                }
                
                // Re-enable buttons after transition
                setTimeout(() => {
                    this.updateNavigationButtons();
                }, 500);
            }, 100);
        }
    }

    // Navigate to previous verse - FIXED
    previous() {
        if (this.isTransitioning) return; // Prevent multiple clicks
        
        if (window.appState.currentVerseIndex > 0) {
            // Disable navigation buttons temporarily
            const nextBtn = document.getElementById('next-btn');
            const prevBtn = document.getElementById('prev-btn');
            if (nextBtn) nextBtn.disabled = true;
            if (prevBtn) prevBtn.disabled = true;
            
            // Stop ALL audio playback completely
            this.stopAllAudio();
            
            // Clear any pending audio operations
            if (window.playbackControls.audioTimeout) {
                clearTimeout(window.playbackControls.audioTimeout);
                window.playbackControls.audioTimeout = null;
            }
            
            // Disable auto-advance to prevent conflicts
            window.appState.autoAdvance = false;
            
            // Wait for audio cleanup to complete
            setTimeout(() => {
                // Decrement verse index
                window.appState.currentVerseIndex--;
                console.log(`Manual previous to verse ${window.appState.currentVerseIndex}`);
                
                // Update display
                this.show(window.appState.currentVerseIndex, 'left');
                
                // If reciting and NOT paused, play the new verse
                if (window.appState.isReciting && !window.appState.isPaused) {
                    setTimeout(() => {
                        window.appState.autoAdvance = true;
                        window.playbackControls.playCurrentVerse();
                    }, 500);
                } else {
                    // Even if paused, re-enable auto-advance for when playback resumes
                    window.appState.autoAdvance = true;
                }
                
                // Re-enable buttons after transition
                setTimeout(() => {
                    this.updateNavigationButtons();
                }, 500);
            }, 100);
        }
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

// Update the updateCounter method to also update dropdown
updateCounter() {
    const current = window.appState.verses[window.appState.currentVerseIndex];
    const selector = document.getElementById('verse-selector');
    
    if (current) {
        // Update dropdown selection
        if (selector) {
            selector.value = window.appState.currentVerseIndex;
        }
        
        // The verse counter is now replaced by dropdown, but keep for any other uses
        const counter = document.getElementById('verse-counter');
        if (counter) {
            if (current.number === 'Bismillah') {
                counter.textContent = 'Bismillah';
            } else {
                const totalVerses = window.appState.currentSurah.verses;
                counter.textContent = `Verse ${current.number} of ${totalVerses}`;
            }
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
}

// Add window resize listener to recheck overflow
window.addEventListener('resize', () => {
    if (window.verseDisplay) {
        window.verseDisplay.detectOverflow();
    }
});

// Create global instance
window.verseDisplay = new VerseDisplay();

