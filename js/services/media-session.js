/* Media Session service for notification controls

class MediaSessionService {
    constructor() {
        this.isSupported = 'mediaSession' in navigator;
        this.iosInterval = null;
    }

    // Initialize media session with action handlers
    initialize() {
        if (!this.isSupported) {
            console.log('Media Session API not supported');
            return;
        }

        this.updateMetadata();
        this.setupActionHandlers();
        
        navigator.mediaSession.playbackState = 'none';
        console.log('Media Session initialized');
    }

    // Setup action handlers for media controls
    setupActionHandlers() {
        const actions = [
            { name: 'play', handler: () => window.playbackControls.start() },
            { name: 'pause', handler: () => window.playbackControls.pause() },
            { name: 'stop', handler: () => window.playbackControls.stop() },
            { name: 'previoustrack', handler: () => this.handlePrevious() },
            { name: 'nexttrack', handler: () => this.handleNext() },
            { name: 'seekbackward', handler: () => this.handlePrevious() },
            { name: 'seekforward', handler: () => this.handleNext() }
        ];

        actions.forEach(action => {
            try {
                navigator.mediaSession.setActionHandler(action.name, action.handler);
                console.log(`✅ ${action.name} handler set`);
            } catch (e) {
                console.log(`❌ ${action.name} not supported`);
            }
        });
    }

    // Update media session metadata
    updateMetadata() {
        if (!this.isSupported || !window.appState.currentSurah || !window.appState.verses) return;

        const currentVerse = window.appState.verses[window.appState.currentVerseIndex];
        if (!currentVerse) return;

        let title = currentVerse.number === 'Bismillah' ? 
            'Bismillah' : 
            `Verse ${currentVerse.number} of ${window.appState.currentSurah.verses}`;
        
        // Add repeat mode info
        if (window.appState.repeatMode === 'verse' && window.appState.currentRepeatCount > 0) {
            title += ` (🔁 ${window.appState.currentRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`;
        } else if (window.appState.repeatMode === 'surah' && window.appState.surahRepeatCount > 0) {
            title += ` (🔄 ${window.appState.surahRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount})`;
        } else if (window.appState.repeatMode === 'verse') {
            title += ' (🔁 Repeat Verse)';
        } else if (window.appState.repeatMode === 'surah') {
            title += ' (🔄 Repeat Surah)';
        }
        
        const artwork = this.generateArtwork(currentVerse, title);
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: 'Mishary Rashid Alafasy',
            album: `${window.appState.currentSurah.english} - Chapter ${getSurahFromURL()}`,
            artwork: [{ src: artwork, sizes: '512x512', type: 'image/svg+xml' }]
        });
    }

    // Generate dynamic artwork for media session
    generateArtwork(currentVerse, title) {
        const verseDisplay = currentVerse.number === 'Bismillah' ? 'بِسْمِ اللَّهِ' : currentVerse.number;
        const repeatIcon = window.appState.repeatMode !== 'none' ? 
            (window.appState.repeatMode === 'verse' ? '🔁 Repeat Verse' : '🔄 Repeat Surah') : '';
        
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:%23667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:%23764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(%23grad1)"/>
            <text x="256" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">القرآن</text>
            <text x="256" y="180" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white" opacity="0.9">${window.appState.currentSurah.english.split(' ')[0]}</text>
            <text x="256" y="240" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">${verseDisplay}</text>
            <text x="256" y="300" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" opacity="0.8">${title.split(' (')[0]}</text>
            <text x="256" y="340" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="white" opacity="0.7">Mishary Alafasy</text>
            ${repeatIcon ? `<text x="256" y="380" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="white" opacity="0.6">${repeatIcon}</text>` : ''}
        </svg>`;
    }

    // Update playback state
    updatePlaybackState() {
        if (!this.isSupported) return;

        try {
            if (window.appState.isReciting && !window.appState.isPaused) {
                navigator.mediaSession.playbackState = 'playing';
                this.startIOSKeepAlive();
            } else if (window.appState.isPaused) {
                navigator.mediaSession.playbackState = 'paused';
                this.stopIOSKeepAlive();
            } else {
                navigator.mediaSession.playbackState = 'none';
                this.stopIOSKeepAlive();
            }
        } catch (error) {
            console.error('Error updating playback state:', error);
        }
    }

    // Handle previous track from media controls
    handlePrevious() {
        if (window.appState.currentVerseIndex > 0) {
            if (audioService.getCurrentAudio()) {
                audioService.getCurrentAudio().pause();
                audioService.getCurrentAudio().currentTime = 0;
            }
            
            window.verseDisplay.previous();
            
            if (window.appState.isReciting && !window.appState.isPaused) {
                setTimeout(() => {
                    window.playbackControls.playCurrentVerse();
                }, 300);
            }
            
            window.updateStatus(`Previous verse - ${window.appState.verses[window.appState.currentVerseIndex].number === 'Bismillah' ? 'Bismillah' : `Verse ${window.appState.verses[window.appState.currentVerseIndex].number}`}`);
        }
    }

    // Handle next track from media controls
    handleNext() {
        if (window.appState.currentVerseIndex < window.appState.verses.length - 1) {
            if (audioService.getCurrentAudio()) {
                audioService.getCurrentAudio().pause();
                audioService.getCurrentAudio().currentTime = 0;
            }
            
            window.verseDisplay.next();
            
            if (window.appState.isReciting && !window.appState.isPaused) {
                setTimeout(() => {
                    window.playbackControls.playCurrentVerse();
                }, 300);
            }
            
            window.updateStatus(`Next verse - ${window.appState.verses[window.appState.currentVerseIndex].number === 'Bismillah' ? 'Bismillah' : `Verse ${window.appState.verses[window.appState.currentVerseIndex].number}`}`);
        } else {
            // Handle surah repeat
            if (window.appState.repeatMode === 'surah') {
                window.appState.surahRepeatCount++;
                if (window.appState.repeatCount === 'infinite' || window.appState.surahRepeatCount < window.appState.repeatCount) {
                    window.appState.currentVerseIndex = 0;
                    window.verseDisplay.show(0, 'right');
                    if (window.appState.isReciting && !window.appState.isPaused) {
                        setTimeout(() => {
                            window.playbackControls.playCurrentVerse();
                        }, 300);
                    }
                    window.updateStatus(`Repeating Surah - ${window.appState.surahRepeatCount}/${window.appState.repeatCount === 'infinite' ? '∞' : window.appState.repeatCount}`);
                }
            }
        }
    }

    // iOS-specific: Keep media session alive
startIOSKeepAlive() {
    if (!audioService.isIOS()) return;
    
    if (!this.iosInterval) {
        this.iosInterval = setInterval(() => {
            if (window.appState.isReciting && !window.appState.isPaused) {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            } else {
                this.stopIOSKeepAlive();
            }
        }, 5000); // Reduced frequency from 2000ms to 5000ms
    }
}

    // Stop iOS keep alive interval
    stopIOSKeepAlive() {
        if (this.iosInterval) {
            clearInterval(this.iosInterval);
            this.iosInterval = null;
        }
    }
}

// Create global instance
window.mediaSessionService = new MediaSessionService(); */