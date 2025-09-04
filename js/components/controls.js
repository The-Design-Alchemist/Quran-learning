// controls.js - Complete Clean Version
// Playback Controls with segment support

class PlaybackControls {
    constructor() {
        this.statusElement = document.getElementById('status');
        this.isLoading = false;
        this.audioTimeout = null;
        this.playbackMonitor = null;
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

            if (window.wordHighlighter) {
                window.wordHighlighter.pauseHighlighting();
            }

            this.updateStatus('Recitation paused');
        }
    }

    // Stop recitation
    stop() {
        console.log('Stopping recitation...');

        if (this.audioTimeout) {
            clearTimeout(this.audioTimeout);
            this.audioTimeout = null;
        }

        if (this.playbackMonitor) {
            clearInterval(this.playbackMonitor);
            this.playbackMonitor = null;
        }

        window.appState.isReciting = false;
        window.appState.isPaused = false;
        window.appState.autoAdvance = true;
        window.appState.currentRepeatCount = 0;
        window.appState.surahRepeatCount = 0;

        if (audioService.isIOS && audioService.reusableAudio) {
            audioService.reusableAudio.pause();
            audioService.reusableAudio.currentTime = 0;
        } else {
            const allAudioElements = document.querySelectorAll('audio');
            allAudioElements.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
                audio.remove();
            });
        }

        audioService.cleanup();
        window.verseDisplay.removeAllHighlights();

        if (window.wordHighlighter) {
            window.wordHighlighter.cleanup();
        }

        const icon = document.getElementById('play-pause-icon');
        const text = document.getElementById('play-pause-text');
        if (icon && text) {
            icon.textContent = '▶️';
            text.textContent = 'Play';
        }

        this.updateStatus('Recitation stopped');
    }

    // Play current verse
    async playCurrentVerse() {
        if (this.isLoading || !window.appState.isReciting) {
            console.log('Already loading or stopped, ignoring request');
            return;
        }

        this.isLoading = true;

        if (this.playbackMonitor) {
            clearInterval(this.playbackMonitor);
            this.playbackMonitor = null;
        }

        try {
            const verse = window.appState.verses[window.appState.currentVerseIndex];

            if (!verse) {
                console.error('No verse found at index:', window.appState.currentVerseIndex);
                this.isLoading = false;
                return;
            }

            const verseNumber = verse.number || verse.numberInSurah;
            console.log('Playing verse:', verseNumber);

            // Skip Bismillah (has no audio)
            if (!verse.hasAudio || verseNumber === 'Bismillah' || !verseNumber) {
                this.updateStatus('Displaying verse...');
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

            let statusMessage = `Loading verse ${verseNumber} audio...`;
            if (verse.segments && verse.segments.length > 1) {
                const segmentIndex = window.verseDisplay.getCurrentSegmentIndex();
                statusMessage = `Loading verse ${verseNumber} (Part ${segmentIndex + 1}/${verse.segments.length}) audio...`;
            }
            this.updateStatus(statusMessage);

            const surahNumber = getSurahFromURL();
            const audioUrl = await audioService.loadAudio(surahNumber, verseNumber);

            if (!window.appState.isReciting || window.appState.isPaused) {
                this.isLoading = false;
                return;
            }

            audioService.cleanup();

            const newAudio = await audioService.createAudioElement(audioUrl);
            audioService.setCurrentAudio(newAudio);

            // If verse has segments, set audio boundaries for current segment
            if (verse.segments && verse.segments.length > 1 && window.currentVerseTimings) {
                this.setupSegmentBoundaries(newAudio, verse, window.currentVerseTimings);
            }

            // Load timing data first
            const timingData = await audioService.loadTimingData(surahNumber, verseNumber);
            if (timingData) {
                console.log(`Loaded timing data for verse ${verseNumber}`);
                this.currentTimingData = timingData;
                window.currentVerseTimings = timingData;

                // NOW set up segment boundaries after we have timing data
                if (verse.segments && verse.segments.length > 1) {
                    this.setupSegmentBoundaries(newAudio, verse, timingData);
                }
            } else {
                console.log(`No timing data for verse ${verseNumber}`);
                window.currentVerseTimings = null;
            }

            this.updateStatus(`Playing verse ${verseNumber} - Mishary Alafasy${this.getRepeatInfo()}`);
            window.verseDisplay.addHighlight(verse.id);

            this.setupAudioEventHandlers(newAudio, verse);

            try {
                await newAudio.play();
                console.log(`Successfully playing verse ${verseNumber}`);
            } catch (playError) {
                console.error('Play error:', playError);

                if (window.appState.currentVerseIndex === 0 && audioService.isIOS) {
                    this.updateStatus('Tap to start playing...');

                    const playOnInteraction = async () => {
                        try {
                            await newAudio.play();
                            console.log('Started playback after user interaction');
                        } catch (e) {
                            console.error('Failed to play after interaction:', e);
                        }
                    };

                    document.addEventListener('touchstart', playOnInteraction, { once: true });
                    document.addEventListener('click', playOnInteraction, { once: true });
                } else {
                    console.log('Attempting to recover playback...');
                    setTimeout(async () => {
                        try {
                            await newAudio.play();
                        } catch (e) {
                            console.error('Recovery failed:', e);
                            this.handleVerseCompletion();
                        }
                    }, 100);
                }
            }

         if (window.wordHighlighter && verse.hasAudio) {
    setTimeout(() => {
        const verseDisplay = document.getElementById('verse-display');
        if (verseDisplay && verseDisplay.classList.contains('active')) {
            window.wordHighlighter.initializeVerse(verseNumber);
            // Only start highlighting if enabled
            if (window.appState.highlightingEnabled) {
                window.wordHighlighter.startHighlighting();
            }
        }
    }, 400);
}

        } catch (error) {
            console.error(`Failure loading verse:`, error);
            this.updateStatus(`Cannot load verse audio. Skipping...`);

            if (window.appState.autoAdvance && window.appState.isReciting && !window.appState.isPaused) {
                this.audioTimeout = setTimeout(() => {
                    this.handleVerseCompletion();
                }, 1500);
            }
        } finally {
            this.isLoading = false;
        }
    }



    // Setup precise playback monitoring for segments
    setupPrecisePlayback(audio, verse, timingData) {
        return;
    }

    setupSegmentBoundaries(audio, verse, timingData) {
        if (!timingData || !verse.segments || verse.segments.length <= 1) return;

        const currentSegmentIndex = window.verseDisplay.getCurrentSegmentIndex();

        if (timingData.segments && timingData.segments[currentSegmentIndex]) {
            const segmentTiming = timingData.segments[currentSegmentIndex];

            const startTime = segmentTiming.start;
            const endTime = segmentTiming.end;

            console.log(`Segment ${currentSegmentIndex + 1}: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s`);

            audio.currentTime = startTime;

            // Remove any existing handlers
            if (audio._boundaryHandler) {
                audio.removeEventListener('timeupdate', audio._boundaryHandler);
                audio._boundaryHandler = null;
            }

            // Always set up boundary handler for segments
            const boundaryHandler = () => {
                if (audio.currentTime >= endTime) {
                    if (window.appState.repeatMode === 'segment') {
                        // Loop back to start for segment repeat
                        console.log('Segment boundary reached, looping...');
                        audio.currentTime = startTime;

                        // Reinitialize word highlighting
                        if (window.wordHighlighter) {
                            window.wordHighlighter.reset();
                            setTimeout(() => {
                                window.wordHighlighter.reinitializeForSegment();
                                if (window.currentVerseTimings && window.currentVerseTimings.words) {
                                    window.wordHighlighter.startPreciseHighlighting(
                                        audio,
                                        window.currentVerseTimings.words
                                    );
                                }
                            }, 50);
                        }
                    } else {
                        // Stop at segment end and trigger ended event
                        audio.pause();
                        audio.removeEventListener('timeupdate', audio._boundaryHandler);
                        audio._boundaryHandler = null;

                        // Manually trigger the ended event
                        const endedEvent = new Event('ended');
                        audio.dispatchEvent(endedEvent);
                    }
                }
            };

            audio._boundaryHandler = boundaryHandler;
            audio.addEventListener('timeupdate', boundaryHandler);
        }
    }

    // Setup audio event handlers
    setupAudioEventHandlers(audio, verse) {
        const endedHandler = () => {
            console.log(`Verse ${verse.number} playback ended`);
            window.verseDisplay.removeHighlight(verse.id);

            if (window.wordHighlighter) {
                window.wordHighlighter.reset();
            }

            // Handle completion
            if (this.audioTimeout) {
                clearTimeout(this.audioTimeout);
            }

            this.audioTimeout = setTimeout(() => {
                if (window.appState.isReciting && !window.appState.isPaused) {
                    this.handleVerseCompletion();
                }
            }, 300);
        };

        const errorHandler = (event) => {
            console.error(`Audio playback error for verse ${verse.number}:`, event);
            window.verseDisplay.removeHighlight(verse.id);
            this.updateStatus(`Audio error for verse ${verse.number}`);

            // Stop on error
            window.playbackControls.stop();
        };

        // Remove old handlers
        if (audio._endedHandler) {
            audio.removeEventListener('ended', audio._endedHandler);
        }
        if (audio._errorHandler) {
            audio.removeEventListener('error', audio._errorHandler);
        }

        audio._endedHandler = endedHandler;
        audio._errorHandler = errorHandler;

        // IMPORTANT: Remove { once: true } to allow multiple triggers for repeat
        audio.addEventListener('ended', endedHandler);
        audio.addEventListener('error', errorHandler);
    }

    // Handle verse completion
    handleVerseCompletion() {
        console.log('Handling verse completion...');

        const verse = window.appState.verses[window.appState.currentVerseIndex];
        const audio = audioService.getCurrentAudio();

        // Handle repeat mode
        if (window.appState.repeatMode !== 'none' && audio) {
            // For segmented verses
            if (verse.segments && verse.segments.length > 1) {
                const currentSegmentIndex = window.verseDisplay.getCurrentSegmentIndex();

                if (window.appState.repeatMode === 'segment') {
                    // Repeat current segment
                    console.log('Repeating segment', currentSegmentIndex + 1);

                    if (window.currentVerseTimings && window.currentVerseTimings.segments) {
                        const segment = window.currentVerseTimings.segments[currentSegmentIndex];
                        if (segment) {
                            audio.currentTime = segment.start;
                            audio.play().catch(e => console.error('Repeat play error:', e));

                            // Reinitialize word highlighting
                            if (window.wordHighlighter) {
                                window.wordHighlighter.reset();
                                setTimeout(() => {
                                    window.wordHighlighter.reinitializeForSegment();
                                    if (window.currentVerseTimings && window.currentVerseTimings.words) {
                                        window.wordHighlighter.startPreciseHighlighting(
                                            audio,
                                            window.currentVerseTimings.words
                                        );
                                    }
                                }, 100);
                            }
                        }
                    } else {
                        // Fallback if no timing data
                        audio.currentTime = 0;
                        audio.play().catch(e => console.error('Repeat play error:', e));
                    }
                    return;
                } else if (window.appState.repeatMode === 'verse') {
                    // Repeat entire verse from beginning
                    console.log('Repeating entire verse');
                    audio.currentTime = 0;
                    audio.play().catch(e => console.error('Repeat play error:', e));

                    // Reset to first segment if segmented
                    if (verse.segments && verse.segments.length > 1) {
                        window.verseDisplay.currentSegmentIndex = 0;
                        window.verseDisplay.showSegmented(verse, 0);
                    }

                    // Reinitialize word highlighting
                    if (window.wordHighlighter) {
                        window.wordHighlighter.reset();
                        setTimeout(() => {
                            window.wordHighlighter.initializeVerse(verse.number);
                            window.wordHighlighter.startHighlighting();
                        }, 100);
                    }
                    return;
                }
            } else {
                // Non-segmented verse repeat
                if (window.appState.repeatMode === 'verse') {
                    console.log('Repeating verse', verse.number);
                    audio.currentTime = 0;
                    audio.play().catch(e => console.error('Repeat play error:', e));

                    // Reinitialize word highlighting
                    if (window.wordHighlighter) {
                        window.wordHighlighter.reset();
                        setTimeout(() => {
                            window.wordHighlighter.initializeVerse(verse.number);
                            window.wordHighlighter.startHighlighting();
                        }, 100);
                    }
                    return;
                }
            }
        }

        // No repeat mode - just stop playback (don't advance)
        console.log('Playback complete - stopping');
        this.updateStatus('Verse completed');

        // Stop playback but keep UI ready
        window.appState.isReciting = false;

        // Update play button to show it's stopped
        const icon = document.getElementById('play-pause-icon');
        const text = document.getElementById('play-pause-text');
        if (icon && text) {
            icon.textContent = '▶️';
            text.textContent = 'Play';
        }
    }

    // Play from segment start
    playFromSegmentStart(segmentIndex) {
        const audio = audioService.getCurrentAudio();
        if (!audio || !window.currentVerseTimings) {
            this.playCurrentVerse();
            return;
        }

        const verse = window.appState.verses[window.appState.currentVerseIndex];
        if (!verse.segments || segmentIndex >= verse.segments.length) return;

        let wordOffset = 0;
        for (let i = 0; i < segmentIndex; i++) {
            const segmentWords = verse.segments[i].arabic.split(/\s+/).filter(w =>
                w.length > 0 && !w.match(/[\u06D6-\u06DB]/)
            );
            wordOffset += segmentWords.length;
        }

        const segmentWords = verse.segments[segmentIndex].arabic.split(/\s+/).filter(w =>
            w.length > 0 && !w.match(/[\u06D6-\u06DB]/)
        );
        const segmentEndWord = wordOffset + segmentWords.length - 1;

        if (window.appState.repeatMode === 'segment' &&
            window.currentVerseTimings.words[wordOffset] &&
            window.currentVerseTimings.words[segmentEndWord]) {

            const startTime = window.currentVerseTimings.words[wordOffset].start;
            const endTime = window.currentVerseTimings.words[segmentEndWord].end + 1.0;

            audio.currentTime = startTime;

            const loopHandler = () => {
                if (audio.currentTime >= endTime) {
                    audio.currentTime = startTime;
                }
            };

            if (audio._loopHandler) {
                audio.removeEventListener('timeupdate', audio._loopHandler);
            }

            audio._loopHandler = loopHandler;
            audio.addEventListener('timeupdate', loopHandler);

            audio.play();
        } else {
            if (window.currentVerseTimings.words[wordOffset]) {
                audio.currentTime = window.currentVerseTimings.words[wordOffset].start;
                audio.play();
            }
        }
    }

    // Update status display
    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
    }

    // Get repeat info for status
    getRepeatInfo() {
        if (window.appState.repeatMode === 'segment') {
            return ' (🔁 Part)';
        } else if (window.appState.repeatMode === 'verse') {
            return ' (🔁 Verse)';
        }
        return '';
    }
}

// === Standalone Control Functions ===

function togglePlayPause() {
    const icon = document.getElementById('play-pause-icon');
    const text = document.getElementById('play-pause-text');

    if (!window.appState.isReciting || window.appState.isPaused) {
        window.playbackControls.start();
        icon.textContent = '⏸️';
        text.textContent = 'Pause';
    } else {
        window.playbackControls.pause();
        icon.textContent = '▶️';
        text.textContent = 'Play';
    }
}

function startFromBeginning() {
    const modal = document.querySelector('.resume-modal');
    if (modal) modal.remove();

    window.playbackControls.stop();
    window.appState.currentVerseIndex = 0;
    window.verseDisplay.show(0);

    const surahNumber = getSurahFromURL();
    window.readingProgress.clearPosition(surahNumber);

    const icon = document.getElementById('play-pause-icon');
    const text = document.getElementById('play-pause-text');
    if (icon && text) {
        icon.textContent = '▶️';
        text.textContent = 'Play';
    }

    window.playbackControls.updateStatus('Ready to recite from beginning');
}

function toggleRepeat() {
    const btn = document.getElementById('repeat-btn');
    const verse = window.appState.verses[window.appState.currentVerseIndex];

    if (window.appState.repeatMode === 'none') {
        // Enable repeat based on current context
        if (verse && verse.segments && verse.segments.length > 1) {
            // We're in a segmented verse, so repeat segment
            window.appState.repeatMode = 'segment';
            window.playbackControls.updateStatus('Repeat segment enabled');
        } else {
            // Regular verse, repeat verse
            window.appState.repeatMode = 'verse';
            window.playbackControls.updateStatus('Repeat verse enabled');
        }
        btn.classList.add('active');
    } else {
        // Disable repeat
        window.appState.repeatMode = 'none';
        btn.classList.remove('active');
        window.playbackControls.updateStatus('Repeat disabled');
    }

    // Keep button text constant
    btn.textContent = '🔁 Repeat';
}

function nextVerse() {
    window.verseDisplay.next();
}

function previousVerse() {
    window.verseDisplay.previous();
}

function jumpToVerse() {
    const selector = document.getElementById('verse-selector');
    if (selector) {
        const selectedIndex = parseInt(selector.value);
        window.verseDisplay.jumpToVerse(selectedIndex);

        const verse = window.appState.verses[selectedIndex];
        const verseText = verse.number === 'Bismillah' ? 'Bismillah' : `verse ${verse.number}`;
        window.playbackControls.updateStatus(`Jumped to ${verseText}`);
    }
}

function resumeFromSaved() {
    const modal = document.querySelector('.resume-modal');
    if (modal) modal.remove();

    if (window.savedResumePosition) {
        window.appState.currentVerseIndex = window.savedResumePosition.verseIndex;
        window.verseDisplay.show(window.savedResumePosition.verseIndex);
        window.playbackControls.updateStatus(`Resumed at verse ${window.savedResumePosition.verseNumber}`);
        window.savedResumePosition = null;
    }
}

// Create global instance
window.playbackControls = new PlaybackControls();