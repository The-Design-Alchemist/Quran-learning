// controls.js - FINAL VERSION with Word Highlighting
// Playback controls component

class PlaybackControls {
    constructor() {
        this.statusElement = document.getElementById('status');
        this.isLoading = false;
        this.audioTimeout = null; // Track timeouts
        this.setupEventListeners();
    }

    // Setup event listeners for controls
    setupEventListeners() {
        // Navigation buttons are now handled directly by verse-display.js
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
            
            const startButton = document.querySelector('.control-button');
            if (startButton) startButton.disabled = true;
            this.updateStatus('Starting recitation...');
            
            if (window.mediaSessionService) {
                window.mediaSessionService.updatePlaybackState();
            }
            
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
            
            if (window.mediaSessionService) {
                window.mediaSessionService.updatePlaybackState();
            }
            
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
            
            if (window.mediaSessionService) {
                window.mediaSessionService.updatePlaybackState();
            }
            
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

    // Stop recitation - FIXED
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
        
        const startButton = document.querySelector('.control-button');
        if (startButton) startButton.disabled = false;
        
        if (window.mediaSessionService) {
            window.mediaSessionService.updatePlaybackState();
        }
        
        this.updateStatus('Recitation stopped');
    }

    // Play current verse - FIXED
    async playCurrentVerse() {
        // Check if already loading or if we should stop
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
            console.log(`✅ Audio URL obtained: ${audioUrl}`);
            
            // Double check we're still supposed to be playing
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

            // Update media session
            if (window.mediaSessionService) {
                window.mediaSessionService.updateMetadata();
                window.mediaSessionService.updatePlaybackState();
            }

            // Play audio
            console.log(`▶️ Attempting to play verse ${verse.number}`);
            await newAudio.play();
            console.log(`🎵 Successfully playing verse ${verse.number}`);
            
            // Initialize word highlighting for this verse with a small delay
if (window.wordHighlighter && verse.hasAudio) {
    setTimeout(() => {
        window.wordHighlighter.initializeVerse(verse.number);
        window.wordHighlighter.startHighlighting();
    }, 100); // Small delay to ensure verse is active
}

        } catch (error) {
            console.error(`💥 Complete failure loading/playing verse ${window.appState.verses[window.appState.currentVerseIndex].number}:`, error);
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

    // Setup event handlers for audio element - FIXED
    setupAudioEventHandlers(audio, verse) {
        const endedHandler = () => {
            console.log(`📝 Verse ${verse.number} playback ended`);
            window.verseDisplay.removeHighlight(verse.id);
            
            // Maintain playing state for iOS
            if (window.mediaSessionService && 'mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
            
            // Clear any existing timeout
            if (this.audioTimeout) {
                clearTimeout(this.audioTimeout);
            }
            
            this.audioTimeout = setTimeout(() => {
                // CHECK: Only auto-advance if still enabled and reciting
                if (window.appState.isReciting && !window.appState.isPaused && window.appState.autoAdvance) {
                    console.log(`➡️ Auto-advancing from verse ${verse.number}`);
                    this.handleVerseCompletion();
                } else {
                    console.log(`⏸️ Not auto-advancing: reciting=${window.appState.isReciting}, paused=${window.appState.isPaused}, autoAdvance=${window.appState.autoAdvance}`);
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

    // Handle verse completion and repeat logic - FIXED
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
        
        // Maintain playing state
        if (window.mediaSessionService && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        
        // Handle verse repeat mode
        if (window.appState.repeatMode === 'verse') {
            window.appState.currentRepeatCount++;
            console.log(`Verse repeat: ${window.appState.currentRepeatCount}/${window.appState.repeatCount}`);
            
            if (window.appState.repeatCount === 'infinite' || window.appState.currentRepeatCount < window.appState.repeatCount) {
                this.updateStatus(`Repeating verse ${window.appState.verses[window.appState.currentVerseIndex].number} (${window.appState.currentRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`);
                
                this.audioTimeout = setTimeout(() => {
                    if (window.appState.isReciting && !window.appState.isPaused) {
                        this.playCurrentVerse();
                    }
                }, 500);
                return;
            } else {
                window.appState.currentRepeatCount = 0;
            }
        }
        
        // Move to next verse ONLY if auto-advance is still enabled
        if (window.appState.autoAdvance && window.appState.currentVerseIndex < window.appState.verses.length - 1) {
            this.audioTimeout = setTimeout(() => {
                // Double-check we're still supposed to advance
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
        } else if (window.appState.repeatMode === 'surah') {
            // Handle surah repeat mode
            window.appState.surahRepeatCount++;
            console.log(`Surah repeat: ${window.appState.surahRepeatCount}/${window.appState.repeatCount}`);
            
            if (window.appState.repeatCount === 'infinite' || window.appState.surahRepeatCount < window.appState.repeatCount) {
                this.updateStatus(`Repeating Surah (${window.appState.surahRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`);
                this.audioTimeout = setTimeout(() => {
                    if (window.appState.isReciting && !window.appState.isPaused) {
                        window.appState.currentVerseIndex = 0;
                        window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                        this.audioTimeout = setTimeout(() => {
                            if (window.appState.isReciting && !window.appState.isPaused) {
                                this.playCurrentVerse();
                            }
                        }, 200);
                    }
                }, 1000);
                return;
            }
        } else {
            // Recitation complete
            console.log('Recitation completed');
            this.stop();
        }
    }

    // Update status display
    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    // Helper method for repeat info
    getRepeatInfo() {
        if (window.appState.repeatMode === 'verse' && window.appState.currentRepeatCount > 0) {
            return ` (🔁 ${window.appState.currentRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`;
        } else if (window.appState.repeatMode === 'surah' && window.appState.surahRepeatCount > 0) {
            return ` (🔄 ${window.appState.surahRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`;
        }
        return '';
    }

    // Change repeat mode
    changeRepeatMode() {
        const selectedMode = document.querySelector('input[name="repeatMode"]:checked').value;
        window.appState.repeatMode = selectedMode;
        window.appState.currentRepeatCount = 0;
        window.appState.surahRepeatCount = 0;
        
        console.log(`Repeat mode changed to: ${selectedMode}`);
    }

    // Change repeat count
    changeRepeatCount() {
        const countSelect = document.getElementById('repeat-count');
        window.appState.repeatCount = countSelect.value === 'infinite' ? 'infinite' : parseInt(countSelect.value);
        
        console.log(`Repeat count changed to: ${window.appState.repeatCount}`);
    }
}

// Global control functions for HTML onclick handlers
function startRecitation() {
    window.playbackControls.start();
}

function pauseRecitation() {
    window.playbackControls.pause();
}

function stopRecitation() {
    window.playbackControls.stop();
}

function nextVerse() {
    window.verseDisplay.next();
}

function previousVerse() {
    window.verseDisplay.previous();
}

function changeRepeatMode() {
    window.playbackControls.changeRepeatMode();
}

function changeRepeatCount() {
    window.playbackControls.changeRepeatCount();
}

// Create global instance
window.playbackControls = new PlaybackControls();