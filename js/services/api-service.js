// api-service-js.js - Final version using local data
// This version uses the data files you generated, no external APIs

class ApiService {
    constructor() {
        this.dataCache = new Map();
        this.combinedDataLoaded = false;
        this.combinedData = null;
    }

    // Load the combined data file once
    async loadCombinedData() {
        if (this.combinedDataLoaded) return;
        
        try {
            // Try to load the combined data file
            const response = await fetch('./data/quran-complete.json');
            if (response.ok) {
                this.combinedData = await response.json();
                this.combinedDataLoaded = true;
                console.log('✅ Quran data loaded successfully');
            }
        } catch (error) {
            console.error('Failed to load combined Quran data:', error);
        }
    }

    // Fetch verse data from local files
    async fetchVerseData(surahNumber) {
        try {
            console.log(`📡 Loading verse data for Surah ${surahNumber}...`);
            
            // Try to load from combined data first
            await this.loadCombinedData();
            
            if (this.combinedData && this.combinedData[surahNumber]) {
                const surahData = this.combinedData[surahNumber];
                console.log(`✅ Successfully loaded ${surahData.verses.length} verses from local data`);
                
                // Format verses to match expected structure
                return surahData.verses.map(verse => ({
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
            }
            
            // Fallback: try individual file
            try {
                const response = await fetch(`./data/quran/${surahNumber}.json`);
                if (response.ok) {
                    const surahData = await response.json();
                    console.log(`✅ Loaded from individual file: ${surahData.verses.length} verses`);
                    
                    return surahData.verses.map(verse => ({
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
                }
            } catch (error) {
                console.log('Individual file not found');
            }
            
            // Last resort: generate fallback
            return this.generateFallbackVerses(surahNumber);

        } catch (error) {
            console.error('Error fetching verse data:', error);
            return this.generateFallbackVerses(surahNumber);
        }
    }

    // Fetch translation from local data
    async fetchTranslation(surahNumber, verseNumber) {
        try {
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

    // Generate fallback verses when data is not available
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

    // Get fallback translation
    getFallbackTranslation(surahNumber, verseNumber) {
        const translations = {
            114: {
                1: "Say: \"I seek refuge with the Lord of mankind,\"",
                2: "\"The King of mankind,\"",
                3: "\"The God of mankind,\"",
                4: "\"From the evil of the whisperer who withdraws,\"",
                5: "\"Who whispers in the hearts of mankind,\"",
                6: "\"From among the jinn and mankind.\""
            },
            112: {
                1: "Say: He is Allah, the One!",
                2: "Allah, the Eternal, Absolute;",
                3: "He begets not, nor is He begotten;",
                4: "And there is none like unto Him."
            },
            1: {
                1: "In the name of Allah, the Beneficent, the Merciful.",
                2: "All praise is due to Allah, the Lord of the Worlds.",
                3: "The Beneficent, the Merciful.",
                4: "Master of the Day of Judgment.",
                5: "Thee do we serve and Thee do we beseech for help.",
                6: "Keep us on the right path.",
                7: "The path of those upon whom Thou hast bestowed favors. Not (the path) of those upon whom Thy wrath is brought down, nor of those who go astray."
            }
        };

        if (translations[surahNumber] && translations[surahNumber][verseNumber]) {
            return translations[surahNumber][verseNumber];
        }

        return `Translation for Surah ${surahNumber}, Verse ${verseNumber}`;
    }
}

// Create global instance
window.apiService = new ApiService();