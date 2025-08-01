// api-service-js.js - Immediate fix that forces CDN loading
// This version will ALWAYS fetch from online sources, ignoring local files

class ApiService {
    constructor() {
        this.dataCache = new Map();
        this.forceOnline = true; // Force online fetching
    }

    // Main method to fetch verse data - simplified for reliability
    async fetchVerseData(surahNumber) {
        try {
            console.log(`📡 Fetching real verse data for Surah ${surahNumber}...`);
            
            // Check cache first
            if (this.dataCache.has(surahNumber)) {
                console.log('📦 Using cached data');
                return this.dataCache.get(surahNumber);
            }

            // ALWAYS fetch from online sources (ignore local files)
            const verses = await this.fetchFromReliableAPI(surahNumber);
            
            if (verses && verses.length > 0) {
                this.dataCache.set(surahNumber, verses);
                console.log(`✅ Successfully loaded ${verses.length} verses with real text`);
                return verses;
            }

            // Fallback
            return this.generateFallbackVerses(surahNumber);

        } catch (error) {
            console.error('Error fetching verse data:', error);
            return this.generateFallbackVerses(surahNumber);
        }
    }

    // Fetch from the most reliable API
    async fetchFromReliableAPI(surahNumber) {
        console.log('🌐 Fetching from Quran CDN...');
        
        try {
            // This API is very reliable and has no CORS issues
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.code === 200 && data.data && data.data.ayahs) {
                    // Format the verses properly
                    return data.data.ayahs.map(ayah => ({
                        number: ayah.numberInSurah,
                        text: ayah.text,
                        numberInSurah: ayah.numberInSurah,
                        juz: ayah.juz,
                        manzil: ayah.manzil,
                        page: ayah.page,
                        ruku: ayah.ruku,
                        hizbQuarter: ayah.hizbQuarter,
                        sajda: ayah.sajda || false
                    }));
                }
            }
        } catch (error) {
            console.log('Primary API failed, trying backup...');
        }

        // Backup: Try alternative API
        try {
            const response = await fetch(`https://raw.githubusercontent.com/semarketir/quranjson/master/source/surah/${surahNumber}.json`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.ayahs || data.verses) {
                    const verses = data.ayahs || data.verses;
                    return verses.map((verse, index) => ({
                        number: verse.number || index + 1,
                        text: verse.text || verse.ar || '',
                        numberInSurah: verse.number || index + 1,
                        juz: 1,
                        manzil: 1,
                        page: 1,
                        ruku: 1,
                        hizbQuarter: 1,
                        sajda: false
                    }));
                }
            }
        } catch (error) {
            console.log('Backup API also failed');
        }

        return null;
    }

    // Fetch English translation
    async fetchTranslation(surahNumber, verseNumber) {
        try {
            const cacheKey = `trans_${surahNumber}_${verseNumber}`;
            
            // Check cache
            if (this.dataCache.has(cacheKey)) {
                return this.dataCache.get(cacheKey);
            }

            console.log(`📖 Fetching translation for ${surahNumber}:${verseNumber}`);

            // Try primary translation API
            const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/en.sahih`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.code === 200 && data.data && data.data.text) {
                    const translation = data.data.text;
                    this.dataCache.set(cacheKey, translation);
                    return translation;
                }
            }
        } catch (error) {
            console.log('Translation fetch failed');
        }

        // Return fallback translation
        return this.getFallbackTranslation(surahNumber, verseNumber);
    }

    // Generate fallback verses
    generateFallbackVerses(surahNumber) {
        const surahInfo = window.SURAH_DATABASE[surahNumber];
        if (!surahInfo) return [];

        console.log('⚠️ Using fallback verses');
        
        const verses = [];
        for (let i = 1; i <= surahInfo.verses; i++) {
            verses.push({
                number: i,
                text: this.getKnownVerse(surahNumber, i),
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

    // Get known verses for common surahs
    getKnownVerse(surahNumber, verseNumber) {
        // Surah Al-Fatihah (1)
        if (surahNumber === 1) {
            const fatihah = [
                "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                "الرَّحْمَٰنِ الرَّحِيمِ",
                "مَالِكِ يَوْمِ الدِّينِ",
                "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
                "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"
            ];
            return fatihah[verseNumber - 1] || `آية ${verseNumber}`;
        }
        
        // Surah Al-Ikhlas (112)
        if (surahNumber === 112) {
            const ikhlas = [
                "قُلْ هُوَ اللَّهُ أَحَدٌ",
                "اللَّهُ الصَّمَدُ",
                "لَمْ يَلِدْ وَلَمْ يُولَدْ",
                "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ"
            ];
            return ikhlas[verseNumber - 1] || `آية ${verseNumber}`;
        }
        
        // Default
        return `آية ${verseNumber}`;
    }

    // Get fallback translation
    getFallbackTranslation(surahNumber, verseNumber) {
        // Common translations
        if (surahNumber === 1) {
            const translations = [
                "In the name of Allah, the Most Gracious, the Most Merciful",
                "All praise is for Allah, Lord of all worlds",
                "The Most Gracious, the Most Merciful",
                "Master of the Day of Judgment",
                "You alone we worship, and You alone we ask for help",
                "Guide us to the straight path",
                "The path of those You have blessed, not of those who earned Your anger, nor of those astray"
            ];
            return translations[verseNumber - 1] || `Translation of verse ${verseNumber}`;
        }
        
        if (surahNumber === 9 && verseNumber === 1) {
            return "Freedom from obligation from Allah and His Messenger to those with whom you made a treaty among the polytheists.";
        }
        
        if (surahNumber === 9 && verseNumber === 2) {
            return "So travel freely throughout the land for four months and know that you cannot escape Allah and that Allah will disgrace the disbelievers.";
        }
        
        return `Translation of verse ${verseNumber}`;
    }
}

// Create global instance
window.apiService = new ApiService();

console.log('✅ API Service initialized - forcing online data');