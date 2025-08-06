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

// In the generateHTML method, update the verse structure:
generateHTML() {
    this.container.innerHTML = '';
    
    // Create a scrollable container for all verses
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'verses-scroll-container';
    scrollContainer.id = 'verses-scroll-container';
    
    window.appState.verses.forEach((verse, index) => {
        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse-item';
        verseDiv.id = verse.id;
        verseDiv.setAttribute('data-verse-index', index);

        if (verse.number === 'Bismillah') {
            verseDiv.innerHTML = `
                <div class="bismillah">
                    <div class="bismillah-arabic">${verse.text}</div>
                    <div class="bismillah-english">${verse.english}</div>
                </div>
            `;
        } else {
            verseDiv.innerHTML = `
                <div class="verse-content">
                    <div class="verse-number">${verse.number}</div>
                    <div class="verse-text-group">
                        <div class="arabic-text">${verse.text}</div>
                        <div class="english-text">${verse.english}</div>
                    </div>
                </div>
            `;
        }

        scrollContainer.appendChild(verseDiv);
    });
    
    this.container.appendChild(scrollContainer);
}

    // Update the show method for smooth scrolling:
show(index, direction = 'right') {
    // Remove all active states
    document.querySelectorAll('.verse-item').forEach(verse => {
        verse.classList.remove('active', 'current-verse-highlight');
    });
    
    // Add active state to current verse
    if (window.appState.verses[index]) {
        const currentVerse = document.getElementById(window.appState.verses[index].id);
        if (currentVerse) {
            currentVerse.classList.add('active');
            
            // Smooth scroll to verse
            this.scrollToVerse(currentVerse);
            
            // Add highlight if currently reciting
            if (window.appState.isReciting && window.appState.currentVerseIndex === index) {
                currentVerse.classList.add('current-verse-highlight');
            }
        }
    }
    
    this.updateCounter();
    this.updateNavigationButtons();
    
    // Update media session metadata
    if (window.mediaSessionService) {
        window.mediaSessionService.updateMetadata();
    }
}

// New method for smooth scrolling
scrollToVerse(verseElement) {
    const container = document.getElementById('verses-scroll-container');
    if (!container || !verseElement) return;
    
    const containerRect = container.getBoundingClientRect();
    const verseRect = verseElement.getBoundingClientRect();
    
    // Calculate the position to scroll to (center the verse in view)
    const scrollTop = verseElement.offsetTop - (containerRect.height / 2) + (verseRect.height / 2);
    
    // Smooth scroll
    container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
    });
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

    // Update verse counter display
    updateCounter() {
        const current = window.appState.verses[window.appState.currentVerseIndex];
        if (current) {
            if (current.number === 'Bismillah') {
                this.counter.textContent = 'Bismillah';
            } else {
                const totalVerses = window.appState.currentSurah.verses;
                this.counter.textContent = `Verse ${current.number} of ${totalVerses}`;
            }
        }
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
    const verseElement = document.getElementById(verseId);
    if (verseElement) {
        verseElement.classList.add('current-verse-highlight');
        this.scrollToVerse(verseElement);
    }
}

    // Remove highlight from verse
    removeHighlight(verseId) {
    const verseElement = document.getElementById(verseId);
    if (verseElement) {
        verseElement.classList.remove('current-verse-highlight');
    }
}

    // Remove all highlights
    removeAllHighlights() {
    document.querySelectorAll('.verse-item').forEach(verse => {
        verse.classList.remove('current-verse-highlight');
    });
}

    // Get current verse element
    getCurrentVerseElement() {
        if (window.appState.verses[window.appState.currentVerseIndex]) {
            return document.getElementById(window.appState.verses[window.appState.currentVerseIndex].id);
        }
        return null;
    }
}

// Create global instance
window.verseDisplay = new VerseDisplay();