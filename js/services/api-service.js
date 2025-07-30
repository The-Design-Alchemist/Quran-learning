// Add this to your api-service-js.js as a fallback method

class ApiService {
    constructor() {
        this.dataCache = new Map();
        this.combinedDataLoaded = false;
        this.combinedData = null;
    }

    // Try to fetch from CDN if local data doesn't have real Arabic
    async fetchFromCDN(surahNumber) {
        try {
            // Try GitHub raw content (usually not blocked by CORS)
            const arabicUrl = `https://raw.githubusercontent.com/risan/quran-json/main/data/editions/ar/${surahNumber}.json`;
            const englishUrl = `https://raw.githubusercontent.com/risan/quran-json/main/data/editions/en/${surahNumber}.json`;
            
            const [arabicResponse, englishResponse] = await Promise.all([
                fetch(arabicUrl),
                fetch(englishUrl)
            ]);
            
            if (arabicResponse.ok && englishResponse.ok) {
                const arabicData = await arabicResponse.json();
                const englishData = await englishResponse.json();
                
                const arabicVerses = Object.values(arabicData);
                const englishVerses = Object.values(englishData);
                
                const verses = [];
                for (let i = 0; i < arabicVerses.length; i++) {
                    verses.push({
                        number: i + 1,
                        text: arabicVerses[i] || '',
                        translation: englishVerses[i] || '',
                        numberInSurah: i + 1,
                        juz: 1,
                        manzil: 1,
                        page: 1,
                        ruku: 1,
                        hizbQuarter: 1,
                        sajda: false
                    });
                }
                
                console.log(`✅ Fetched real Quran text from CDN for Surah ${surahNumber}`);
                return verses;
            }
        } catch (error) {
            console.log('CDN fetch failed:', error);
        }
        return null;
    }

    async fetchVerseData(surahNumber) {
        try {
            console.log(`📡 Loading verse data for Surah ${surahNumber}...`);
            
            // Check cache first
            if (this.dataCache.has(surahNumber)) {
                return this.dataCache.get(surahNumber);
            }
            
            // Try local data first
            await this.loadCombinedData();
            
            if (this.combinedData && this.combinedData[surahNumber]) {
                const surahData = this.combinedData[surahNumber];
                
                // Check if it's placeholder data
                if (surahData.verses[0] && surahData.verses[0].arabic.includes('آية رقم')) {
                    console.log('Local data has placeholders, trying CDN...');
                    
                    // Try to get real data from CDN
                    const cdnVerses = await this.fetchFromCDN(surahNumber);
                    if (cdnVerses) {
                        this.dataCache.set(surahNumber, cdnVerses);
                        return cdnVerses;
                    }
                }
                
                // Use local data
                const verses = surahData.verses.map(verse => ({
                    number: verse.number,
                    text: verse.arabic,
                    numberInSurah: verse.number,
                    juz: 1,
                    manzil: 1,
                    page: 1,
                    ruku: 1,
                    hizbQuarter: 1,
                    sajda: false
                }));
                
                this.dataCache.set(surahNumber, verses);
                return verses;
            }
            
            // Try CDN as fallback
            const cdnVerses = await this.fetchFromCDN(surahNumber);
            if (cdnVerses) {
                this.dataCache.set(surahNumber, cdnVerses);
                return cdnVerses;
            }
            
            // Last resort: generate fallback
            return this.generateFallbackVerses(surahNumber);

        } catch (error) {
            console.error('Error fetching verse data:', error);
            return this.generateFallbackVerses(surahNumber);
        }
    }

    async loadCombinedData() {
        if (this.combinedDataLoaded) return;
        
        try {
            const response = await fetch('./data/quran-complete.json');
            if (response.ok) {
                this.combinedData = await response.json();
                this.combinedDataLoaded = true;
                console.log('✅ Local Quran data loaded');
            }
        } catch (error) {
            console.error('Failed to load local data:', error);
        }
    }

    async fetchTranslation(surahNumber, verseNumber) {
        try {
            // Check cache
            if (this.dataCache.has(surahNumber)) {
                const verses = this.dataCache.get(surahNumber);
                const verse = verses.find(v => v.number === verseNumber);
                if (verse && verse.translation) {
                    return verse.translation;
                }
            }
            
            // Check local data
            await this.loadCombinedData();
            
            if (this.combinedData && this.combinedData[surahNumber]) {
                const surahData = this.combinedData[surahNumber];
                const verse = surahData.verses.find(v => v.number === verseNumber);
                
                if (verse && verse.translation) {
                    return verse.translation;
                }
            }
        } catch (error) {
            console.log('Translation fetch failed:', error);
        }

        return this.getFallbackTranslation(surahNumber, verseNumber);
    }

    generateFallbackVerses(surahNumber) {
        const surahInfo = window.SURAH_DATABASE[surahNumber];
        const fallbackVerses = [];
        
        for (let i = 1; i <= surahInfo.verses; i++) {
            fallbackVerses.push({
                number: i,
                text: `آية ${i} من سورة ${surahInfo.arabic}`, 
                numberInSurah: i,
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false
            });
        }
        
        console.log(`⚠️ Using fallback data for ${fallbackVerses.length} verses`);
        return fallbackVerses;
    }

    getFallbackTranslation(surahNumber, verseNumber) {
        // Your existing fallback translations
        return `Translation for Surah ${surahNumber}, Verse ${verseNumber}`;
    }
}

// Create global instance
window.apiService = new ApiService();