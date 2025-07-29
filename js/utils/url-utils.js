// URL utility functions

// Get Surah number from URL parameter
function getSurahFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const surahParam = urlParams.get('surah');
    
    if (surahParam) {
        const surahNumber = parseInt(surahParam);
        if (surahNumber >= 1 && surahNumber <= 114) {
            return surahNumber;
        }
    }
    
    // Default to Surah An-Nas (114) if no valid parameter
    return 114;
}

// Update URL without reloading page
function updateURL(surahNumber) {
    const newUrl = `${window.location.pathname}?surah=${surahNumber}`;
    window.history.pushState({ surah: surahNumber }, '', newUrl);
}

// Get base URL for the application
function getBaseURL() {
    return window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
}

// Export functions to global scope
window.getSurahFromURL = getSurahFromURL;
window.updateURL = updateURL;
window.getBaseURL = getBaseURL;