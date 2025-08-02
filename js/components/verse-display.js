// Verse display component for managing verse UI

class VerseDisplay {
    constructor() {
        this.container = document.getElementById('verse-container');
        this.counter = document.getElementById('verse-counter');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
    }

    // Generate HTML for all verses
    generateHTML() {
        this.container.innerHTML = '';

        window.appState.verses.forEach((verse, index) => {
            const verseDiv = document.createElement('div');
            verseDiv.className = `verse-display${index === 0 ? ' active' : ''}`;
            verseDiv.id = verse.id;

            if (verse.number === 'Bismillah') {
                verseDiv.innerHTML = `
                    <div class="bismillah">
                        <div class="bismillah-arabic">${verse.text}</div>
                        <div class="bismillah-english">${verse.english}</div>
                    </div>
                `;
            } else {
                verseDiv.innerHTML = `
                    <div class="verse-number">${verse.number}</div>
                    <div class="arabic-text">${verse.text}</div>
                    <div class="english-text">${verse.english}</div>
                `;
            }

            this.container.appendChild(verseDiv);
        });
    }

    // Show specific verse with animation
    show(index, direction = 'right') {
        // Hide all verses with exit animation
        document.querySelectorAll('.verse-display').forEach(verse => {
            verse.classList.remove('active');
            if (direction === 'right') {
                verse.classList.add('exit-left');
            } else {
                verse.classList.add('exit-right');
            }
        });

        // Show target verse after animation delay
        setTimeout(() => {
            document.querySelectorAll('.verse-display').forEach(verse => {
                verse.classList.remove('exit-left', 'exit-right');
            });
            
            if (window.appState.verses[index]) {
                const currentVerse = document.getElementById(window.appState.verses[index].id);
                if (currentVerse) {
                    currentVerse.classList.add('active');
                    
                    // Add highlight if currently reciting
                    if (window.appState.isReciting && window.appState.currentVerseIndex === index) {
                        currentVerse.classList.add('current-verse-highlight');
                    } else {
                        currentVerse.classList.remove('current-verse-highlight');
                    }
                }
            }
        }, 100);

        this.updateCounter();
        this.updateNavigationButtons();
        
        // Update media session metadata
        if (window.mediaSessionService) {
            window.mediaSessionService.updateMetadata();
        }
    }

    // Navigate to next verse
next() {
    // Disable navigation buttons temporarily
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    if (nextBtn) nextBtn.disabled = true;
    if (prevBtn) prevBtn.disabled = true;
    
    if (window.appState.currentVerseIndex < window.appState.verses.length - 1) {
        // Completely stop all audio and cleanup
        audioService.cleanup();
        this.removeAllHighlights();
        
        // Disable auto-advance to prevent conflicts
        window.appState.autoAdvance = false;
        
        // Increment verse index
        window.appState.currentVerseIndex++;
        console.log(`Manual next to verse ${window.appState.currentVerseIndex}`);
        
        // Update display
        this.show(window.appState.currentVerseIndex, 'right');
        
        // If reciting, play the new verse after cleanup is complete
        if (window.appState.isReciting && !window.appState.isPaused) {
            setTimeout(() => {
                window.appState.autoAdvance = true;
                window.playbackControls.playCurrentVerse();
                
                // Re-enable buttons after operation
                if (nextBtn) nextBtn.disabled = false;
                if (prevBtn) prevBtn.disabled = false;
            }, 800);
        } else {
            window.appState.autoAdvance = true;
            
            // Re-enable buttons after operation
            setTimeout(() => {
                if (nextBtn) nextBtn.disabled = false;
                if (prevBtn) prevBtn.disabled = false;
            }, 800);
        }
    } else {
        // Re-enable buttons if at the end
        if (nextBtn) nextBtn.disabled = false;
        if (prevBtn) prevBtn.disabled = false;
    }
}

// Navigate to previous verse
previous() {
    if (window.appState.currentVerseIndex > 0) {
        // Completely stop all audio and cleanup
        audioService.cleanup();
        this.removeAllHighlights();
        
        // Disable auto-advance to prevent conflicts
        window.appState.autoAdvance = false;
        
        // Decrement verse index
        window.appState.currentVerseIndex--;
        console.log(`Manual previous to verse ${window.appState.currentVerseIndex}`);
        
        // Update display
        this.show(window.appState.currentVerseIndex, 'left');
        
        // If reciting, play the new verse after cleanup is complete
        if (window.appState.isReciting && !window.appState.isPaused) {
            setTimeout(() => {
                window.appState.autoAdvance = true; // Re-enable auto-advance
                window.playbackControls.playCurrentVerse();
            }, 800); // Longer delay to ensure cleanup
        } else {
            window.appState.autoAdvance = true; // Re-enable auto-advance
        }
    }
}

    // Update verse counter display
updateCounter() {
    const current = window.appState.verses[window.appState.currentVerseIndex];
    if (current) {
        if (current.number === 'Bismillah') {
            this.counter.textContent = 'Bismillah';
        } else {
            // Show actual position in array, not verse number
            const totalVerses = window.appState.currentSurah.verses;
            const currentPosition = window.appState.currentVerseIndex; // includes Bismillah
            this.counter.textContent = `Verse ${current.number} of ${totalVerses}`;
        }
    }
}

    // Update navigation button states
    updateNavigationButtons() {
        this.prevBtn.disabled = window.appState.currentVerseIndex === 0;
        this.nextBtn.disabled = window.appState.currentVerseIndex === window.appState.verses.length - 1;
    }

    // Add highlight to current verse
    addHighlight(verseId) {
        const verseElement = document.getElementById(verseId);
        if (verseElement) {
            verseElement.classList.add('current-verse-highlight');
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
        document.querySelectorAll('.verse-display').forEach(verse => {
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