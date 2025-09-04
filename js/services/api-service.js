// api-service-js.js - Uses only local files
class ApiService {
    constructor() {
        this.dataCache = new Map();
    }

    
// In api-service.js, update the fetchVerseData method:
// api-service.js - Update to use enhanced folder
async fetchVerseData(surahNumber) {
    try {
        const response = await fetch(`./quran-data/enhanced/${surahNumber.toString().padStart(3, '0')}.json`);
        const data = await response.json();
        
        // Transform to match app's expected structure
        const verses = [];
        
        
        // Add all verses with segments PROPERLY PRESERVED
        data.verses.forEach(verse => {
            const verseNumber = verse.key.split(':')[1];
            
            verses.push({
                number: verseNumber,
                text: verse.arabic || verse.arabicSimple,  // Don't add verse end mark yet
                arabic: verse.arabic || verse.arabicSimple, // Keep original arabic too
                english: verse.translation,
                transliteration: verse.transliteration,
                hasAudio: true,
                segments: verse.segments,  // THIS IS CRITICAL - preserve segments
                words: verse.words,
                wordCount: verse.wordCount,
                key: verse.key,
                id: `verse-${verseNumber}-display`
            });
        });
        
        console.log('Sample verse with segments:', verses.find(v => v.segments));
        return verses;
        
    } catch (error) {
        console.error('Error loading enhanced data:', error);
        throw error;
    }
}

getVerseEndMark(verseNumber) {
    const arabicNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNum = verseNumber.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    return `۝${arabicNum}`;
}
    
    createSegmentsFromWaqf(arabicText, translation, transliteration, verseNumber) {
    // Enhanced Waqf pattern - ensure we catch all marks
    const waqfPattern = /[\u06D4\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB\u06DC\u06DD\u06DE\u06DF\u06E0-\u06E9\u0670]/g;
    
    // Find all Waqf positions
    const waqfPositions = [];
    let match;
    while ((match = waqfPattern.exec(arabicText)) !== null) {
        waqfPositions.push({
            index: match.index,
            mark: match[0],
            endIndex: match.index + 1
        });
    }
    
    const wordCount = arabicText.split(/\s+/).length;
    
    // Only segment if we have marks and sufficient length
    if (waqfPositions.length === 0 || wordCount < 15) {
        return [];
    }
    
    console.log(`Verse ${verseNumber}: Found ${waqfPositions.length} Waqf marks in ${wordCount} words`);
    
    const segments = [];
    let lastIndex = 0;
    
    // Split translation into sentences for better distribution
    const translationSentences = translation.split(/[.!?;]/).filter(s => s.trim());
    const transliterationWords = transliteration.split(/\s+/);
    
    waqfPositions.forEach((waqf, segmentIndex) => {
        const segmentArabic = arabicText.substring(lastIndex, waqf.endIndex).trim();
        
        if (segmentArabic.length > 0) {
            // Better translation distribution
            const segmentRatio = (waqf.endIndex - lastIndex) / arabicText.length;
            const expectedTranslationLength = Math.floor(translation.length * segmentRatio);
            
            // Use sentence boundaries when possible
            let segmentTranslation = '';
            if (translationSentences.length > 1 && segmentIndex < translationSentences.length) {
                segmentTranslation = translationSentences[segmentIndex]?.trim() || 
                                   translation.substring(
                                       Math.floor(translation.length * (lastIndex / arabicText.length)),
                                       Math.floor(translation.length * (waqf.endIndex / arabicText.length))
                                   ).trim();
            } else {
                // Fallback to proportional split
                const startPos = Math.floor(translation.length * (lastIndex / arabicText.length));
                const endPos = Math.floor(translation.length * (waqf.endIndex / arabicText.length));
                segmentTranslation = translation.substring(startPos, endPos).trim();
            }
            
            // Similar approach for transliteration
            const translitStartWord = Math.floor(transliterationWords.length * (lastIndex / arabicText.length));
            const translitEndWord = Math.ceil(transliterationWords.length * (waqf.endIndex / arabicText.length));
            const segmentTransliteration = transliterationWords.slice(translitStartWord, translitEndWord).join(' ');
            
            segments.push({
                id: `${verseNumber}_${segmentIndex + 1}`,
                segmentNumber: segmentIndex + 1,
                arabic: segmentArabic,
                translation: segmentTranslation || `Part ${segmentIndex + 1} translation`,
                transliteration: segmentTransliteration,
                waqfMark: waqf.mark,
                waqfType: this.getWaqfType(waqf.mark)
            });
        }
        
        lastIndex = waqf.endIndex;
    });
    
    // Handle remaining text after last Waqf
    if (lastIndex < arabicText.length) {
        const remainingArabic = arabicText.substring(lastIndex).trim();
        if (remainingArabic.length > 0) {
            const remainingTranslation = translation.substring(
                Math.floor(translation.length * (lastIndex / arabicText.length))
            ).trim();
            
            const remainingTransliteration = transliterationWords.slice(
                Math.floor(transliterationWords.length * (lastIndex / arabicText.length))
            ).join(' ');
            
            segments.push({
                id: `${verseNumber}_${segments.length + 1}`,
                segmentNumber: segments.length + 1,
                arabic: remainingArabic,
                translation: remainingTranslation || 'Final part translation',
                transliteration: remainingTransliteration,
                waqfMark: null,
                waqfType: 'end'
            });
        }
    }
    
    // Add total count to all segments
    segments.forEach(seg => {
        seg.totalSegments = segments.length;
    });
    
        console.log(`Verse ${verseNumber}: Created ${segments.length} segments with proper translations`);
        
    return segments;
}

    // Helper to identify Waqf type
getWaqfType(mark) {
    const types = {
        '\u06D4': 'full_stop',           // ۔
        '\u06D6': 'small_stop',           // ۖ
        '\u06D7': 'preferable_stop',      // ۗ
        '\u06D8': 'permissible_stop',     // ۘ
        '\u06D9': 'preferred_stop',       // ۙ
        '\u06DA': 'compulsory_stop',      // ۚ
        '\u06DB': 'sufficient_stop',      // ۛ
        '\u06DC': 'emphasis_stop',        // ۜ
        '\u06DD': 'verse_end',            // ۝
        '\u06DE': 'rub_el_hizb',         // ۞
        '\u06DF': 'rounded_zero',         // ۟
        '\u06E0': 'rectangular_zero',     // ۠
        '\u06E1': 'dotless_khah',        // ۡ
        '\u06E2': 'meem_isolated',       // ۢ
        '\u06E3': 'low_seen',            // ۣ
        '\u06E4': 'madda',               // ۤ
        '\u06E5': 'small_waw',           // ۥ
        '\u06E6': 'small_yeh',           // ۦ
        '\u06E7': 'high_yeh',            // ۧ
        '\u06E8': 'high_noon',           // ۨ
        '\u06E9': 'sajdah',              // ۩
        '\u0670': 'superscript_alef'     // ٰ
    };
    return types[mark] || 'unknown';
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
                sajda: false,
                hasAudio: true
            });
        }
        
        return verses;
    }

    /*
    async fetchVerseData(surahNumber) {
    try {
        console.log(`📖 Loading Surah ${surahNumber} with Waqf marks...`);
        
        // Check cache
        if (this.dataCache.has(surahNumber)) {
            return this.dataCache.get(surahNumber);
        }

        // Try to load from data-with-waqf folder first
        let response = await fetch(`./quran-data/data-with-waqf/${surahNumber.toString().padStart(3, '0')}.json`);
        
        // Fallback to regular data folder
        if (!response.ok) {
            console.log('No waqf data found, trying regular data folder...');
            response = await fetch(`./quran-data/data/${surahNumber}.json`);
            if (!response.ok) {
                throw new Error('Local file not found');
            }
        }

        const data = await response.json();
        
        // DEBUG: Check what we received
        console.log('Sample verse data:', data.verses[0]);
        
        // Format verses with segmentation
        const verses = data.verses.map(verse => {
            // DEBUG: Log the raw verse
            if (verse.number === 255 || verse.number === 256) {
                console.log(`Processing verse ${verse.number}:`, verse);
            }
            
            const processedVerse = {
                number: verse.number,
                text: verse.arabic || verse.text || verse.arabic_text || `آية ${verse.number}`,
                english: verse.translation || verse.english || verse.translation_english || `Translation for verse ${verse.number}`,
                transliteration: verse.transliteration || '',
                numberInSurah: verse.number,
                hasAudio: verse.number !== 'Bismillah',
                wordCount: (verse.arabic || verse.text || '').split(/\s+/).length
            };

            // Create segments from Waqf marks
            const segments = this.createSegmentsFromWaqf(
                processedVerse.text,
                processedVerse.english,
                processedVerse.transliteration,
                verse.number
            );

            // Only add segments if there are multiple
            if (segments.length > 1) {
                processedVerse.segments = segments;
                processedVerse.isSegmented = true;
            }

            return processedVerse;
        });

        this.dataCache.set(surahNumber, verses);
        console.log(`✅ Loaded ${verses.length} verses with segmentation`);
        return verses;

    } catch (error) {
        console.error('Error loading local data:', error);
        return this.generateFallbackVerses(surahNumber);
    }
}*/
}

window.apiService = new ApiService();