// settings.js - Settings management for translation and transliteration toggles

class SettingsManager {
    constructor() {
        this.settings = {
            showTranslation: true,
            showTransliteration: true
        };
        
        // Load saved settings from localStorage
        this.loadSettings();
        this.applySettings();
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('quranAppSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('quranAppSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }
    
    // Apply current settings to the UI
    applySettings() {
        this.setTranslationVisibility(this.settings.showTranslation);
        this.setTransliterationVisibility(this.settings.showTransliteration);
        this.updateUIControls();
    }
    
    // Update UI controls to match current settings
    updateUIControls() {
        const translationToggle = document.getElementById('translation-toggle');
        const transliterationToggle = document.getElementById('transliteration-toggle');
        
        if (translationToggle) {
            translationToggle.checked = this.settings.showTranslation;
        }
        if (transliterationToggle) {
            transliterationToggle.checked = this.settings.showTransliteration;
        }
    }
    
    // Toggle translation visibility
    toggleTranslation(show) {
        this.settings.showTranslation = show;
        this.setTranslationVisibility(show);
        this.saveSettings();
    }
    
    // Set translation visibility
    setTranslationVisibility(show) {
        const style = document.getElementById('dynamic-settings-style') || this.createStyleElement();
        let rules = style.innerHTML.split('\n').filter(rule => rule.trim() !== '');
        
        // Remove existing translation rule
        rules = rules.filter(rule => !rule.includes('.english-text'));
        
        if (!show) {
            // Add hiding rule for translation
            rules.push('.english-text { display: none !important; }');
        }
        
        style.innerHTML = rules.join('\n');
    }

    // Toggle transliteration visibility
    toggleTransliteration(show) {
        this.settings.showTransliteration = show;
        this.setTransliterationVisibility(show);
        this.saveSettings();
    }
    
    // Set transliteration visibility
    setTransliterationVisibility(show) {
        const style = document.getElementById('dynamic-settings-style') || this.createStyleElement();
        let rules = style.innerHTML.split('\n').filter(rule => rule.trim() !== '');
        
        // Remove existing transliteration rule
        rules = rules.filter(rule => !rule.includes('.transliteration-text'));
        
        if (!show) {
            // Add hiding rule for transliteration
            rules.push('.transliteration-text, .bismillah-transliteration { display: none !important; }');
        }
        
        style.innerHTML = rules.join('\n');
    }
    
    // Create style element for dynamic styles
    createStyleElement() {
        const style = document.createElement('style');
        style.id = 'dynamic-settings-style';
        document.head.appendChild(style);
        return style;
    }
}

// Global settings functions
function toggleSettings() {
    const menu = document.getElementById('settings-menu');
    const btn = document.getElementById('settings-toggle');
    
    if (menu.style.display === 'none') {
        menu.style.display = 'block';
        btn.classList.add('active');
        
        // Update controls to match current settings
        window.settingsManager.updateUIControls();
    } else {
        menu.style.display = 'none';
        btn.classList.remove('active');
    }
}

function closeSettings() {
    const menu = document.getElementById('settings-menu');
    const btn = document.getElementById('settings-toggle');
    menu.style.display = 'none';
    btn.classList.remove('active');
}

function toggleTranslation() {
    const toggle = document.getElementById('translation-toggle');
    window.settingsManager.toggleTranslation(toggle.checked);
}

function toggleTransliteration() {
    const toggle = document.getElementById('transliteration-toggle');
    window.settingsManager.toggleTransliteration(toggle.checked);
}

// Create global instance
window.settingsManager = new SettingsManager();