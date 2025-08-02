// Playback controls component

class PlaybackControls {
    constructor() {
        this.statusElement = document.getElementById('status');
        this.isLoading = false; // Add this line
        this.setupEventListeners();
    }

    // Setup event listeners for controls
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', () => {
            window.verseDisplay.previous();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            window.verseDisplay.next();
        });
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
            
            setTimeout(() => {
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
            this.updateStatus('Recitation paused');
        }
    }

    // Stop recitation
    stop() {
        console.log('Stopping recitation...');
        
        window.appState.isReciting = false;
        window.appState.isPaused = false;
        window.appState.autoAdvance = true;
        window.appState.currentRepeatCount = 0;
        window.appState.surahRepeatCount = 0;
        
        // Stop current audio immediately
        const currentAudio = audioService.getCurrentAudio();
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        audioService.cleanup();
        window.verseDisplay.removeAllHighlights();
        
        const startButton = document.querySelector('.control-button');
        if (startButton) startButton.disabled = false;
        
        if (window.mediaSessionService) {
            window.mediaSessionService.updatePlaybackState();
        }
        
        this.updateStatus('Recitation stopped');
    }

    // Play current verse
    async playCurrentVerse() {
        // Add this check at the very beginning
    if (this.isLoading) {
        console.log('Already loading audio, ignoring request');
        return;
    }
        
        const verse = window.appState.verses[window.appState.currentVerseIndex];
        
        // Skip Bismillah (has no audio)
        if (!verse.hasAudio) {
            this.updateStatus('Displaying Bismillah...');
            if (window.appState.autoAdvance && window.appState.currentVerseIndex < window.appState.verses.length - 1) {
                setTimeout(() => {
                    window.appState.currentVerseIndex++;
                    window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                    this.playCurrentVerse();
                }, 1500);
            }
            return;
        }

        this.updateStatus(`Loading verse ${verse.number} audio...`);
        console.log(`🎵 Starting to load verse ${verse.number}`);

        try {
            const surahNumber = getSurahFromURL();
            const audioUrl = await audioService.loadAudio(surahNumber, verse.number);
            console.log(`✅ Audio URL obtained: ${audioUrl}`);
            
            // Clean up previous audio
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

        } catch (error) {
            console.error(`💥 Complete failure loading/playing verse ${verse.number}:`, error);
            this.updateStatus(`Cannot load verse ${verse.number} audio. Skipping...`);
            window.verseDisplay.removeHighlight(verse.id);
            
            if (window.appState.autoAdvance && window.appState.isReciting && !window.appState.isPaused) {
                setTimeout(() => {
                    console.log(`⏭️ Skipping verse ${verse.number} due to complete failure`);
                    this.handleVerseCompletion();
                }, 1500);
            }
        }
    }

    // Setup event handlers for audio element
    setupAudioEventHandlers(audio, verse) {
        const endedHandler = () => {
            console.log(`📝 Verse ${verse.number} playback ended`);
    window.verseDisplay.removeHighlight(verse.id);
    
    // Maintain playing state for iOS
    if (window.mediaSessionService && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
    }
    
    setTimeout(() => {
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
                setTimeout(() => {
                    console.log(`⏭️ Skipping verse ${verse.number} due to complete failure`);
                    this.handleVerseCompletion();
                }, 1500);
            }
        };

        // Store handlers for cleanup
        audio._endedHandler = endedHandler;
        audio._errorHandler = errorHandler;

        audio.addEventListener('ended', endedHandler);
        audio.addEventListener('error', errorHandler);
    }

    // Handle verse completion and repeat logic
handleVerseCompletion() {
    console.log('Handling verse completion...');
    
    // CRITICAL: Check if we're still on the same verse that just ended
    // This prevents race conditions with manual navigation
    const currentAudio = audioService.getCurrentAudio();
    if (!currentAudio || !window.appState.isReciting || window.appState.isPaused) {
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
            
            setTimeout(() => {
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
        setTimeout(() => {
            // Double-check auto-advance is still enabled before proceeding
            if (window.appState.isReciting && !window.appState.isPaused && window.appState.autoAdvance) {
                window.appState.currentVerseIndex++;
                window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                
                setTimeout(() => {
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
            setTimeout(() => {
                if (window.appState.isReciting && !window.appState.isPaused) {
                    window.appState.currentVerseIndex = 0;
                    window.verseDisplay.show(window.appState.currentVerseIndex, 'right');
                    setTimeout(() => {
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