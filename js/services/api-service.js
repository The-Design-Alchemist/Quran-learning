// api-service-js.js - Uses only local files
class ApiService {
    constructor() {
        this.dataCache = new Map();
    }

// In api-service.js, update the fetchVerseData method:

async fetchVerseData(surahNumber) {
    try {
        console.log(`📁 Loading local data for Surah ${surahNumber}...`);
        
        // Check cache
        if (this.dataCache.has(surahNumber)) {
            return this.dataCache.get(surahNumber);
        }

        // Load from local file
        const response = await fetch(`./quran-data/data/${surahNumber}.json`);
        if (!response.ok) {
            throw new Error('Local file not found');
        }

        const data = await response.json();
        
        // Format verses with transliteration
        const verses = data.verses.map(verse => ({
            number: verse.number,
            text: verse.arabic,
            translation: verse.translation,
            transliteration: verse.transliteration || '', // Add transliteration
            numberInSurah: verse.number,
            juz: 1,
            manzil: 1,
            page: 1,
            ruku: 1,
            hizbQuarter: 1,
            sajda: false
        }));

        this.dataCache.set(surahNumber, verses);
        console.log(`✅ Loaded ${verses.length} verses from local file`);
        return verses;

    } catch (error) {
        console.error('Error loading local data:', error);
        return this.generateFallbackVerses(surahNumber);
    }
}

    /*
    async fetchTranslation(surahNumber, verseNumber) {
    try {
        // Use cached data if available
        let data = this.dataCache.get(surahNumber);
        
        // If not cached, fetch it
        if (!data) {
            const response = await fetch(`./quran-data/data/${surahNumber}.json`);
            if (!response.ok) throw new Error('File not found');
            data = await response.json();
            this.dataCache.set(surahNumber, data);
        }
        
        const verse = data.verses.find(v => v.number === verseNumber);
        if (verse && verse.translation) {
            return verse.translation;
        }
    } catch (error) {
        console.log('Translation fetch failed:', error);
    }

    return `Translation for verse ${verseNumber}`;
} */

    generateFallbackVerses(surahNumber) {
        const surahInfo = window.SURAH_DATABASE[surahNumber];
        const verses = [];
        
        for (let i = 1; i <= surahInfo.verses; i++) {
            verses.push({
                number: i,
                text: `آية ${i}`,
                numberInSurah: i,
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false
            });
        }
        
        return verses;
    }
}

window.apiService = new ApiService();