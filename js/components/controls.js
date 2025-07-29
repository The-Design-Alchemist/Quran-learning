// Playback controls component

class PlaybackControls {
    constructor() {
        this.statusElement = document.getElementById('status');
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
        
        if (!window.isReciting) {
            window.isReciting = true;
            window.isPaused = false;
            window.autoAdvance = true;
            window.currentRepeatCount = 0;
            window.surahRepeatCount = 0;
            
            document.querySelector('.control-button').disabled = true;
            this.updateStatus('Starting recitation...');
            
            if (window.mediaSessionService) {
                window.mediaSessionService.updatePlaybackState();
            }
            
            setTimeout(() => {
                this.playCurrentVerse();
            }, 200);
            
        } else if (window.isPaused) {
            console.log('Resuming from pause...');
            window.isPaused = false;
            window.autoAdvance = true;
            
            if (window.mediaSessionService) {
                window.mediaSessionService.updatePlaybackState();
            }
            
            const currentAudio = audioService.getCurrentAudio();
            if (currentAudio && !currentAudio.ended) {
                currentAudio.play().catch(error => {
                    console.error('Resume error:', error);
                    this.playCurrentVerse();
                });
                this.updateStatus(`Resuming verse ${window.verses[window.currentVerseIndex].number}...`);
            } else {
                this.playCurrentVerse();
            }
        }
    }

    // Pause recitation
    pause() {
        console.log('Pausing recitation...');
        
        if (window.isReciting && !window.isPaused) {
            window.isPaused = true;
            window.autoAdvance = false;
            
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
        
        window.isReciting = false;
        window.isPaused = false;
        window.autoAdvance = true;
        window.currentRepeatCount = 0;
        window.surahRepeatCount = 0;
        
        audioService.cleanup();
        window.verseDisplay.removeAllHighlights();
        
        document.querySelector('.control-button').disabled = false;
        
        if (window.mediaSessionService) {
            window.mediaSessionService.updatePlaybackState();
        }
        
        this.updateStatus('Recitation stopped');
    }

    // Play current verse
    async playCurrentVerse() {
        const verse = window.verses[window.currentVerseIndex];
        
        // Skip Bismillah (has no audio)
        if (!verse.hasAudio) {
            if (window.autoAdvance && window.currentVerseIndex < window.verses.length - 1) {
                setTimeout(() => {
                    window.currentVerseIndex++;
                    window.verseDisplay.show(window.currentVerseIndex, 'right');
                    this.playCurrentVerse();
                }, 2000);
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
            
            this.updateStatus(`Playing verse ${verse.number} - Mishary Alafasy`);
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
            
            if (window.autoAdvance && window.isReciting && !window.isPaused) {
                setTimeout(() => {
                    console.log(`⏭️ Skipping verse ${verse.number} due to complete failure`);
                    this.handleVerseCompletion();
                }, 2000);
            }
        }
    }

    // Setup event handlers for audio element
    setupAudioEventHandlers(audio, verse) {
        audio.endedHandler = () => {
            console.log(`📝 Verse ${verse.number} playback ended`);
            window.verseDisplay.removeHighlight(verse.id);
            
            // Maintain playing state for iOS
            if (window.mediaSessionService && 'mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
            
            setTimeout(() => {
                if (window.isReciting && !window.isPaused && window.autoAdvance) {
                    console.log(`➡️ Moving to handle verse completion`);
                    this.handleVerseCompletion();
                }
            }, 300);
        };

        audio.errorHandler = (event) => {
            console.error(`❌ Audio playback error for verse ${verse.number}:`, event);
            window.verseDisplay.removeHighlight(verse.id);
            this.updateStatus(`Audio error for verse ${verse.number}, trying next...`);
            
            if (window.autoAdvance && window.isReciting && !window.isPaused) {
                setTimeout(() => {
                    console.log(`⏭️ Skipping to next verse due to error`);
                    this.handleVerseCompletion();
                }, 1500);
            }
        };

        audio.addEventListener('ended', audio.endedHandler);
        audio.addEventListener('error', audio.errorHandler);
    }

    // Handle verse completion and repeat logic
    handleVerseCompletion() {
        console.log('Handling verse completion...');
        
        // Maintain playing state
        if (window.mediaSessionService && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        
        // Handle verse repeat mode
        if (window.repeatMode === 'verse') {
            window.currentRepeatCount++;
            console.log(`Verse repeat: ${window.currentRepeatCount}/${window.repeatCount}`);
            
            if (window.repeatCount === 'infinite' || window.currentRepeatCount < window.repeatCount) {
                this.updateStatus(`Repeating verse ${window.verses[window.currentVerseIndex].number} (${window.currentRepeatCount}/${window.repeatCount === 'infinite' ? '∞' : window.repeatCount})`);
                
                const currentAudio = audioService.getCurrentAudio();
                if (currentAudio && currentAudio.src) {
                    setTimeout(() => {
                        if (window.isReciting && !window.isPaused) {
                            if (window.mediaSessionService && 'mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                            }
                            currentAudio.currentTime = 0;
                            currentAudio.play().catch(error => {
                                console.error('Repeat play error:', error);
                                this.playCurrentVerse();
                            });
                        }
                    }, 500);
                } else {
                    setTimeout(() => {
                        if (window.isReciting && !window.isPaused) {
                            this.playCurrentVerse();
                        }
                    }, 500);
                }
                return;
            } else {
                window.currentRepeatCount = 0;
            }
        }
        
        // Move to next verse
        if (window.currentVerseIndex < window.verses.length - 1) {
            setTimeout(() => {
                if (window.isReciting && !window.isPaused && window.autoAdvance) {
                    window.currentVerseIndex++;
                    window.verseDisplay.show(window.currentVerseIndex, 'right');
                    
                    setTimeout(() => {
                        if (window.isReciting && !window.isPaused) {
                            if (window.mediaSessionService && 'mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                            }
                            this.playCurrentVerse();
                        }
                    }, 200);
                }
            }, 500);
        } else {
            // Handle surah repeat mode
            if (window.repeatMode === 'surah') {
                window.surahRepeatCount++;
                console.log(`Surah repeat: ${window.surahRepeatCount}/${window.repeatCount}`);
                
                if (window.repeatCount === 'infinite' || window.surahRepeatCount < window.repeatCount) {
                    this.updateStatus(`Repeating Surah (${window.surahRepeatCount}/${window.repeatCount === 'infinite' ? '∞' : window.repeatCount})`);
                    setTimeout(() => {
                        if (window.isReciting && !window.isPaused) {
                            if (window.mediaSessionService && 'mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                            }
                            window.currentVerseIndex = 0;
                            window.verseDisplay.show(window.currentVerseIndex, 'right');
                            setTimeout(() => {
                                if (window.isReciting && !window.isPaused) {
                                    this.playCurrentVerse();
                                }
                            }, 200);
                        }
                    }, 1000);
                    return;
                }
            }
            
            // Recitation complete
            console.log('Recitation completed');
            this.stop();
        }
    }

    // Update status display
    updateStatus(message) {
        let fullMessage = message;
        
        // Add repeat info to status
        if (window.repeatMode === 'verse' && window.currentRepeatCount > 0) {
            fullMessage += ` (Repeating: ${window.currentRepeatCount}/${window.repeatCount === 'infinite' ? '∞' : window.repeatCount})`;
        } else if (window.repeatMode === 'surah' && window.surahRepeatCount > 0) {
            fullMessage += ` (Surah repeat: ${window.surahRepeatCount}/${window.repeatCount === 'infinite' ? '∞' : window.repeatCount})`;
        }
        
        this.statusElement.textContent = fullMessage;
    }

    // Change repeat mode
    changeRepeatMode() {
        const selectedMode = document.querySelector('input[name="repeatMode"]:checked').value;
        window.repeatMode = selectedMode;
        window.currentRepeatCount = 0;
        window.surahRepeatCount = 0;
        
        this.updateStatus(`Repeat mode: ${window.repeatMode === 'none' ? 'No repeat' : 
                        window.repeatMode === 'verse' ? 'Repeat current verse' : 'Repeat entire surah'}`);
    }

    // Change repeat count
    changeRepeatCount() {
        const countSelect = document.getElementById('repeat-count');
        window.repeatCount = countSelect.value === 'infinite' ? 'infinite' : parseInt(countSelect.value);
        
        this.updateStatus(`Repeat count set to: ${window.repeatCount === 'infinite' ? 'infinite' : window.repeatCount}`);
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