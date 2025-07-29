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

        window.verses.forEach((verse, index) => {
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
            
            if (window.verses[index]) {
                const currentVerse = document.getElementById(window.verses[index].id);
                if (currentVerse) {
                    currentVerse.classList.add('active');
                    
                    // Add highlight if currently reciting
                    if (window.isReciting && window.currentVerseIndex === index) {
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
        if (window.currentVerseIndex < window.verses.length - 1) {
            window.currentVerseIndex++;
            this.show(window.currentVerseIndex, 'right');
            
            if (window.isReciting) {
                window.autoAdvance = true;
            }
        }
    }

    // Navigate to previous verse
    previous() {
        if (window.currentVerseIndex > 0) {
            window.currentVerseIndex--;
            this.show(window.currentVerseIndex, 'left');
            window.autoAdvance = false;
        }
    }

    // Update verse counter display
    updateCounter() {
        const current = window.verses[window.currentVerseIndex];
        if (current) {
            this.counter.textContent = current.number === 'Bismillah' ? 
                'Bismillah' : 
                `Verse ${current.number} of ${window.currentSurah.verses}`;
        }
    }

    // Update navigation button states
    updateNavigationButtons() {
        this.prevBtn.disabled = window.currentVerseIndex === 0;
        this.nextBtn.disabled = window.currentVerseIndex === window.verses.length - 1;
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
        if (window.verses[window.currentVerseIndex]) {
            return document.getElementById(window.verses[window.currentVerseIndex].id);
        }
        return null;
    }
}

// Create global instance
window.verseDisplay = new VerseDisplay();