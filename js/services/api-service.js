// api-service-js.js - Complete version with CDN integration
// This will automatically fetch real Quran text from CDN when needed

class ApiService {
    constructor() {
        this.dataCache = new Map();
        this.combinedDataLoaded = false;
        this.combinedData = null;
    }

    // Load the combined data file if it exists
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
            console.log('📁 No local data found, will use CDN');
        }
    }

    // Fetch real Quran text from CDN
    async fetchFromCDN(surahNumber) {
        console.log(`🌐 Fetching real text for Surah ${surahNumber} from CDN...`);
        
        try {
            // These URLs work well and don't have CORS issues
            const sources = [
                // Source 1: GitHub raw content (usually works best)
                {
                    arabic: `https://raw.githubusercontent.com/risan/quran-json/main/data/editions/ar/${surahNumber}.json`,
                    english: `https://raw.githubusercontent.com/risan/quran-json/main/data/editions/en/${surahNumber}.json`
                },
                // Source 2: Alternative GitHub source
                {
                    arabic: `https://raw.githubusercontent.com/semarketir/quranjson/master/source/surah/${surahNumber}.json`,
                    english: null // This source has both in one file
                }
            ];

            // Try each source
            for (const source of sources) {
                try {
                    if (source.english) {
                        // Separate Arabic and English files
                        const [arabicResponse, englishResponse] = await Promise.all([
                            fetch(source.arabic),
                            fetch(source.english)
                        ]);
                        
                        if (arabicResponse.ok) {
                            const arabicData = await arabicResponse.json();
                            const englishData = englishResponse.ok ? await englishResponse.json() : {};
                            
                            return this.formatSeparateFiles(arabicData, englishData);
                        }
                    } else {
                        // Combined file
                        const response = await fetch(source.arabic);
                        if (response.ok) {
                            const data = await response.json();
                            return this.formatCombinedFile(data);
                        }
                    }
                } catch (error) {
                    console.log('Source failed, trying next...');
                }
            }
        } catch (error) {
            console.error('CDN fetch failed:', error);
        }
        
        return null;
    }

    // Format data from separate Arabic/English files
    formatSeparateFiles(arabicData, englishData) {
        const arabicVerses = Object.values(arabicData);
        const englishVerses = Object.values(englishData);
        
        const verses = [];
        for (let i = 0; i < arabicVerses.length; i++) {
            verses.push({
                number: i + 1,
                text: arabicVerses[i] || '',
                translation: englishVerses[i] || `Verse ${i + 1}`,
                numberInSurah: i + 1,
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

    // Format data from combined file
    formatCombinedFile(data) {
        let verses = [];
        
        // Handle different data structures
        if (data.verses) {
            verses = data.verses.map((verse, index) => ({
                number: verse.number || index + 1,
                text: verse.text || verse.ar || '',
                translation: verse.translation || verse.en || `Verse ${index + 1}`,
                numberInSurah: verse.number || index + 1,
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false
            }));
        } else if (Array.isArray(data)) {
            verses = data.map((verse, index) => ({
                number: index + 1,
                text: verse.text || verse.ar || verse,
                translation: verse.translation || verse.en || `Verse ${index + 1}`,
                numberInSurah: index + 1,
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false
            }));
        }
        
        return verses;
    }

    // Main method to fetch verse data
    async fetchVerseData(surahNumber) {
        try {
            console.log(`📡 Loading verse data for Surah ${surahNumber}...`);
            
            // Check cache first
            if (this.dataCache.has(surahNumber)) {
                console.log('📦 Using cached data');
                return this.dataCache.get(surahNumber);
            }
            
            // Try local data first
            await this.loadCombinedData();
            
            if (this.combinedData && this.combinedData[surahNumber]) {
                const surahData = this.combinedData[surahNumber];
                
                // Check if it's placeholder data (contains "آية رقم" or similar patterns)
                const firstVerse = surahData.verses[0];
                if (firstVerse && firstVerse.arabic && 
                    (firstVerse.arabic.includes('آية رقم') || 
                     firstVerse.arabic.includes('آية ') ||
                     firstVerse.arabic.length < 10)) {
                    
                    console.log('📝 Local data has placeholders, fetching real text from CDN...');
                    
                    // Try to get real data from CDN
                    const cdnVerses = await this.fetchFromCDN(surahNumber);
                    if (cdnVerses && cdnVerses.length > 0) {
                        this.dataCache.set(surahNumber, cdnVerses);
                        console.log(`✅ Successfully loaded ${cdnVerses.length} verses with real text`);
                        return cdnVerses;
                    }
                }
                
                // Use local data if it looks real
                const verses = surahData.verses.map(verse => ({
                    number: verse.number,
                    text: verse.arabic || verse.text || '',
                    numberInSurah: verse.number,
                    juz: 1,
                    manzil: 1,
                    page: 1,
                    ruku: 1,
                    hizbQuarter: 1,
                    sajda: false
                }));
                
                this.dataCache.set(surahNumber, verses);
                console.log(`✅ Using local data: ${verses.length} verses`);
                return verses;
            }
            
            // No local data, try CDN
            console.log('🌐 No local data, fetching from CDN...');
            const cdnVerses = await this.fetchFromCDN(surahNumber);
            if (cdnVerses && cdnVerses.length > 0) {
                this.dataCache.set(surahNumber, cdnVerses);
                console.log(`✅ Successfully loaded ${cdnVerses.length} verses from CDN`);
                return cdnVerses;
            }
            
            // Last resort: generate fallback
            return this.generateFallbackVerses(surahNumber);

        } catch (error) {
            console.error('Error fetching verse data:', error);
            return this.generateFallbackVerses(surahNumber);
        }
    }

    // Fetch translation for a specific verse
    async fetchTranslation(surahNumber, verseNumber) {
        try {
            // Check cache first
            if (this.dataCache.has(surahNumber)) {
                const verses = this.dataCache.get(surahNumber);
                const verse = verses.find(v => v.number === verseNumber);
                if (verse && verse.translation) {
                    return verse.translation;
                }
            }
            
            // Check local data
            if (this.combinedData && this.combinedData[surahNumber]) {
                const surahData = this.combinedData[surahNumber];
                const verse = surahData.verses.find(v => v.number === verseNumber);
                
                if (verse && verse.translation) {
                    return verse.translation;
                }
            }
            
            // If no translation found, fetch from CDN
            const cdnVerses = await this.fetchFromCDN(surahNumber);
            if (cdnVerses) {
                const verse = cdnVerses.find(v => v.number === verseNumber);
                if (verse && verse.translation) {
                    return verse.translation;
                }
            }
            
        } catch (error) {
            console.log('Translation fetch failed:', error);
        }

        return this.getFallbackTranslation(surahNumber, verseNumber);
    }

    // Generate fallback verses when all else fails
    generateFallbackVerses(surahNumber) {
        const surahInfo = window.SURAH_DATABASE[surahNumber];
        if (!surahInfo) {
            console.error(`Surah ${surahNumber} not found in database`);
            return [];
        }
        
        const fallbackVerses = [];
        
        // Add some real verses for common surahs
        const realVerses = this.getRealFallbackVerses(surahNumber);
        if (realVerses.length > 0) {
            return realVerses;
        }
        
        // Generate basic fallback
        for (let i = 1; i <= surahInfo.verses; i++) {
            fallbackVerses.push({
                number: i,
                text: i === 1 && surahNumber !== 9 ? 
                    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : 
                    `الآية ${i}`,
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

    // Get real verses for common surahs as fallback
    getRealFallbackVerses(surahNumber) {
        const verses = {
            1: [ // Al-Fatihah
                { number: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", numberInSurah: 1, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", numberInSurah: 2, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ", numberInSurah: 3, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 4, text: "مَالِكِ يَوْمِ الدِّينِ", numberInSurah: 4, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", numberInSurah: 5, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", numberInSurah: 6, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", numberInSurah: 7, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false }
            ],
            112: [ // Al-Ikhlas
                { number: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ", numberInSurah: 1, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 2, text: "اللَّهُ الصَّمَدُ", numberInSurah: 2, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ", numberInSurah: 3, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false },
                { number: 4, text: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", numberInSurah: 4, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false }
            ]
        };
        
        return verses[surahNumber] || [];
    }

    // Get fallback translation
    getFallbackTranslation(surahNumber, verseNumber) {
        const translations = {
            1: {
                1: "In the name of Allah, the Most Gracious, the Most Merciful.",
                2: "All praise is due to Allah, the Lord of all the worlds.",
                3: "The Most Gracious, the Most Merciful.",
                4: "Master of the Day of Judgment.",
                5: "You alone we worship, and You alone we ask for help.",
                6: "Guide us to the straight path.",
                7: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray."
            },
            112: {
                1: "Say: He is Allah, the One!",
                2: "Allah, the Eternal, Absolute;",
                3: "He begets not, nor is He begotten;",
                4: "And there is none like unto Him."
            },
            113: {
                1: "Say: I seek refuge with the Lord of the daybreak",
                2: "From the evil of that which He created",
                3: "And from the evil of darkness when it settles",
                4: "And from the evil of the blowers in knots",
                5: "And from the evil of an envier when he envies"
            },
            114: {
                1: "Say: I seek refuge with the Lord of mankind,",
                2: "The King of mankind,",
                3: "The God of mankind,",
                4: "From the evil of the whisperer who withdraws,",
                5: "Who whispers in the hearts of mankind,",
                6: "From among the jinn and mankind."
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

console.log('✅ API Service initialized with CDN support');