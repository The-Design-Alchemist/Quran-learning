// controls.js - Simplified Playback Controls
// Clean version with Play/Pause, Start Over, and Repeat toggle

class PlaybackControls {
    constructor() {
        this.statusElement = document.getElementById('status');
        this.isLoading = false;
        this.audioTimeout = null;
    }

    // Start recitation
    start() {
        console.log('Starting recitation...');
        
        if (!window.appState.isReciting) {
            window.appState.isReciting = true;
            window.appState.isPaused = false;
            window.appState.autoAdvance = true;
            window.appState.currentRepeatCount = 0;
            window.appState.surahRepeatCount = 0;
            
            this.updateStatus('Starting recitation...');
            
            // Clear any existing timeouts
            if (this.audioTimeout) {
                clearTimeout(this.audioTimeout);
            }
            
            this.audioTimeout = setTimeout(() => {
                this.playCurrentVerse();
            }, 200);
            
        } else if (window.appState.isPaused) {
            console.log('Resuming from pause...');
            window.appState.isPaused = false;
            window.appState.autoAdvance = true;
            
            const currentAudio = audioService.getCurrentAudio();
            if (currentAudio && !currentAudio.ended) {
                currentAudio.play().catch(error => {
                    console.error('Resume error:', error);
                    this.playCurrentVerse();
                });
                this.updateStatus(`Resuming verse ${window.appState.verses[window.appState.currentVerseIndex].number}...`);
                
                // Resume word highlighting
                if (window.wordHighlighter) {
                    window.wordHighlighter.resumeHighlighting();
                }
            } else {
                this.playCurrentVerse();
            }
        }
    }

    // Pause recitation
    pause() {
        console.log('Pausing recitation...');
        
        if (window.appState.isReciting && !window.appState.isPaused) {
            window.appState.isPaused = true;
            window.appState.autoAdvance = false;
            
            const currentAudio = audioService.getCurrentAudio();
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
            }
            
            // Pause word highlighting
            if (window.wordHighlighter) {
                window.wordHighlighter.pauseHighlighting();
            }
            
            this.updateStatus('Recitation paused');
        }
    }

    // Stop recitation
    stop() {
        console.log('Stopping recitation...');
        
        // Clear any pending timeouts
        if (this.audioTimeout) {
            clearTimeout(this.audioTimeout);
            this.audioTimeout = null;
        }
        
        window.appState.isReciting = false;
        window.appState.isPaused = false;
        window.appState.autoAdvance = true;
        window.appState.currentRepeatCount = 0;
        window.appState.surahRepeatCount = 0;
        
        // Stop ALL audio elements
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.remove();
        });
        
        // Clean up audio service
        audioService.cleanup();
        
        // Remove all highlights
        window.verseDisplay.removeAllHighlights();
        
        // Clean up word highlighting
        if (window.wordHighlighter) {
            window.wordHighlighter.cleanup();
        }
        
        // Reset play/pause button state
        const icon = document.getElementById('play-pause-icon');
        const text = document.getElementById('play-pause-text');
        if (icon && text) {
            icon.textContent = '▶️';
            text.textContent = 'Play';
        }
        
        this.updateStatus('Recitation stopped');
    }

// Update the playCurrentVerse method in PlaybackControls class
async playCurrentVerse() {
    if (this.isLoading || !window.appState.isReciting) {
        console.log('Already loading or stopped, ignoring request');
        return;
    }
    
    this.isLoading = true;
    
    try {
        const verse = window.appState.verses[window.appState.currentVerseIndex];
        
        // Skip Bismillah (has no audio)
        if (!verse.hasAudio) {
            this.updateStatus('Displaying Bismillah...');
            this.isLoading = false;
            
            if (window.appState.autoAdvance && window.appState.currentVerseIndex < window.appState.verses.length - 1) {
                this.audioTimeout = setTimeout(() => {
                    if (window.appState.isReciting && !window.appState.isPaused) {
                        window.appState.currentVerseIndex++;
                        window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                        this.playCurrentVerse();
                    }
                }, 1500);
            }
            return;
        }

        this.updateStatus(`Loading verse ${verse.number} audio...`);
        console.log(`🎵 Starting to load verse ${verse.number}`);

        const surahNumber = getSurahFromURL();
        const audioUrl = await audioService.loadAudio(surahNumber, verse.number);
        
        if (!window.appState.isReciting || window.appState.isPaused) {
            this.isLoading = false;
            return;
        }
        
        // Clean up any existing audio completely
        audioService.cleanup();
        
        // Create new audio element
        const newAudio = await audioService.createAudioElement(audioUrl);
        audioService.setCurrentAudio(newAudio);
        
        this.updateStatus(`Playing verse ${verse.number} - Mishary Alafasy${this.getRepeatInfo()}`);
        window.verseDisplay.addHighlight(verse.id);

        // Setup event handlers
        this.setupAudioEventHandlers(newAudio, verse);

        // iOS-specific play handling
        if (audioService.isIOS) {
            // Use a promise-based approach for iOS
            try {
                await newAudio.play();
                console.log(`🎵 Successfully playing verse ${verse.number}`);
            } catch (playError) {
                console.error('iOS play error:', playError);
                // Retry with user interaction requirement
                this.updateStatus('Tap to continue playing...');
                
                // Wait for user interaction
                const playOnInteraction = async () => {
                    try {
                        await newAudio.play();
                        document.removeEventListener('touchstart', playOnInteraction);
                        document.removeEventListener('click', playOnInteraction);
                    } catch (e) {
                        console.error('Failed to play after interaction:', e);
                    }
                };
                
                document.addEventListener('touchstart', playOnInteraction, { once: true });
                document.addEventListener('click', playOnInteraction, { once: true });
            }
        } else {
            await newAudio.play();
            console.log(`🎵 Successfully playing verse ${verse.number}`);
        }
        
        // Initialize word highlighting for this verse
        if (window.wordHighlighter && verse.hasAudio) {
            setTimeout(() => {
                const verseDisplay = document.getElementById('verse-display');
                if (verseDisplay && verseDisplay.classList.contains('active')) {
                    window.wordHighlighter.initializeVerse(verse.number);
                    window.wordHighlighter.startHighlighting();
                }
            }, 400);
        }

    } catch (error) {
        console.error(`💥 Failure loading verse ${window.appState.verses[window.appState.currentVerseIndex].number}:`, error);
        this.updateStatus(`Cannot load verse ${window.appState.verses[window.appState.currentVerseIndex].number} audio. Skipping...`);
        window.verseDisplay.removeHighlight(window.appState.verses[window.appState.currentVerseIndex].id);
        
        if (window.appState.autoAdvance && window.appState.isReciting && !window.appState.isPaused) {
            this.audioTimeout = setTimeout(() => {
                this.handleVerseCompletion();
            }, 1500);
        }
    } finally {
        this.isLoading = false;
    }
}

    // Setup event handlers for audio element
    setupAudioEventHandlers(audio, verse) {
       const endedHandler = () => {
    console.log(`🔁 Verse ${verse.number} playback ended`);
    window.verseDisplay.removeHighlight(verse.id);
    
    // Clean up word highlighting immediately when audio ends
    if (window.wordHighlighter) {
        window.wordHighlighter.reset();
    }
    
    // Clear any existing timeout
    if (this.audioTimeout) {
        clearTimeout(this.audioTimeout);
    }
    
    this.audioTimeout = setTimeout(() => {
        if (window.appState.isReciting && !window.appState.isPaused && window.appState.autoAdvance) {
            console.log(`➡️ Auto-advancing from verse ${verse.number}`);
            this.handleVerseCompletion();
        }
    }, 300);
};

        const errorHandler = (event) => {
            console.error(`❌ Audio playback error for verse ${verse.number}:`, event);
            window.verseDisplay.removeHighlight(verse.id);
            this.updateStatus(`Audio error for verse ${verse.number}, trying next...`);
            
            if (window.appState.autoAdvance && window.appState.isReciting && !window.appState.isPaused) {
                this.audioTimeout = setTimeout(() => {
                    this.handleVerseCompletion();
                }, 1500);
            }
        };

        // Remove any existing handlers first
        if (audio._endedHandler) {
            audio.removeEventListener('ended', audio._endedHandler);
        }
        if (audio._errorHandler) {
            audio.removeEventListener('error', audio._errorHandler);
        }

        // Store handlers for cleanup
        audio._endedHandler = endedHandler;
        audio._errorHandler = errorHandler;

        audio.addEventListener('ended', endedHandler, { once: true });
        audio.addEventListener('error', errorHandler, { once: true });
    }

    // Handle verse completion and repeat logic
    handleVerseCompletion() {
        console.log('Handling verse completion...');
        
        // Clean up word highlighting before moving to next verse
        if (window.wordHighlighter) {
            window.wordHighlighter.reset();
        }
        
        // Double check we're still playing
        if (!window.appState.isReciting || window.appState.isPaused) {
            console.log('Audio stopped or paused, not advancing');
            return;
        }
        
        // Handle verse repeat mode
        if (window.appState.repeatMode === 'verse') {
            window.appState.currentRepeatCount++;
            console.log(`Verse repeat: ${window.appState.currentRepeatCount}`);
            
            if (window.appState.repeatCount === 'infinite') {
                this.updateStatus(`Repeating verse ${window.appState.verses[window.appState.currentVerseIndex].number}`);
                
                this.audioTimeout = setTimeout(() => {
                    if (window.appState.isReciting && !window.appState.isPaused) {
                        this.playCurrentVerse();
                    }
                }, 500);
                return;
            }
        }
        
        // Move to next verse
        if (window.appState.autoAdvance && window.appState.currentVerseIndex < window.appState.verses.length - 1) {
            this.audioTimeout = setTimeout(() => {
                if (window.appState.isReciting && !window.appState.isPaused && window.appState.autoAdvance) {
                    window.appState.currentVerseIndex++;
                    window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                    
                    this.audioTimeout = setTimeout(() => {
                        if (window.appState.isReciting && !window.appState.isPaused && window.appState.autoAdvance) {
                            this.playCurrentVerse();
                        }
                    }, 200);
                }
            }, 500);
        } else {
            // Recitation complete
            console.log('Recitation completed');
            this.stop();
        }
    }

    // Update status display
    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
    }

    // Helper method for repeat info
    getRepeatInfo() {
        if (window.appState.repeatMode === 'verse') {
            return ' (🔁 Repeat On)';
        }
        return '';
    }
}

// Simplified control functions
function togglePlayPause() {
    const icon = document.getElementById('play-pause-icon');
    const text = document.getElementById('play-pause-text');
    
    if (!window.appState.isReciting || window.appState.isPaused) {
        // Start or resume playback
        window.playbackControls.start();
        icon.textContent = '⏸️';
        text.textContent = 'Pause';
    } else {
        // Pause playback
        window.playbackControls.pause();
        icon.textContent = '▶️';
        text.textContent = 'Play';
    }
}

function startFromBeginning() {
    // Remove modal if it exists
    const modal = document.querySelector('.resume-modal');
    if (modal) modal.remove();
    
    // Stop current playback
    window.playbackControls.stop();
    
    // Reset to first verse
    window.appState.currentVerseIndex = 0;
    window.verseDisplay.show(0);
    
    // Clear saved position for this surah
    const surahNumber = getSurahFromURL();
    window.readingProgress.clearPosition(surahNumber);
    
    // Update button state
    const icon = document.getElementById('play-pause-icon');
    const text = document.getElementById('play-pause-text');
    if (icon && text) {
        icon.textContent = '▶️';
        text.textContent = 'Play';
    }
    
    // Update status
    window.playbackControls.updateStatus('Ready to recite from beginning');
}

function toggleRepeat() {
    const btn = document.getElementById('repeat-btn');
    
    if (window.appState.repeatMode === 'none') {
        // Enable repeat
        window.appState.repeatMode = 'verse';
        window.appState.repeatCount = 'infinite';
        btn.classList.add('active');
        window.playbackControls.updateStatus('Repeat enabled - verse will loop');
    } else {
        // Disable repeat
        window.appState.repeatMode = 'none';
        window.appState.repeatCount = 3;
        window.appState.currentRepeatCount = 0;
        btn.classList.remove('active');
        window.playbackControls.updateStatus('Repeat disabled');
    }
}

// Navigation functions
function nextVerse() {
    window.verseDisplay.next();
}

// Jump to selected verse
function jumpToVerse() {
    const selector = document.getElementById('verse-selector');
    if (selector) {
        const selectedIndex = parseInt(selector.value);
        window.verseDisplay.jumpToVerse(selectedIndex);
        
        // Update status
        const verse = window.appState.verses[selectedIndex];
        const verseText = verse.number === 'Bismillah' ? 'Bismillah' : `verse ${verse.number}`;
        window.playbackControls.updateStatus(`Jumped to ${verseText}`);
    }
}

function previousVerse() {
    window.verseDisplay.previous();
}

function resumeFromSaved() {
    // Remove modal
    const modal = document.querySelector('.resume-modal');
    if (modal) modal.remove();
    
    // Resume from saved position
    if (window.savedResumePosition) {
        window.appState.currentVerseIndex = window.savedResumePosition.verseIndex;
        window.verseDisplay.show(window.savedResumePosition.verseIndex);
        window.playbackControls.updateStatus(`Resumed at verse ${window.savedResumePosition.verseNumber}`);
        
        // Clear the saved position reference
        window.savedResumePosition = null;
    }
}

// Create global instance
window.playbackControls = new PlaybackControls();