const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3333;

// Serve quran-data files
app.use('/enhanced', express.static(path.join(__dirname, '..', 'quran-data', 'enhanced')));
app.use('/audio', express.static(path.join(__dirname, '..', 'quran-data', 'audio')));
app.use('/surah-timings', express.static(path.join(__dirname, '..', 'quran-data', 'surah-timings')));
app.use('/complete-timings', express.static(path.join(__dirname, '..', 'quran-data', 'complete-timings')));

// Serve static files from tools directory
app.use(express.static(__dirname));


// Add this new endpoint to save enhanced data
app.post('/api/save-enhanced', (req, res) => {
    const { surahNumber, verseNumber, enhancedSegments } = req.body;
    
    try {
        const surahNum = String(surahNumber).padStart(3, '0');
        const enhancedPath = path.join(__dirname, '..', 'quran-data', 'enhanced', `${surahNum}.json`);
        
        // Read existing enhanced file
        let enhancedData = JSON.parse(fs.readFileSync(enhancedPath, 'utf8'));
        
        // Find and update the specific verse
        const verseIndex = enhancedData.verses.findIndex(v => v.key === `${surahNumber}:${verseNumber}`);
        
        if (verseIndex >= 0) {
            // Update the segments
            enhancedData.verses[verseIndex].segments = enhancedSegments;
            console.log(`Updated enhanced data for verse ${verseNumber} with ${enhancedSegments.length} segments`);
            
            // Save back to file
            fs.writeFileSync(enhancedPath, JSON.stringify(enhancedData, null, 2));
            
            res.json({ 
                success: true, 
                message: `Enhanced data saved for Verse ${verseNumber}`
            });
        } else {
            res.status(404).json({ success: false, error: 'Verse not found in enhanced file' });
        }
        
    } catch (error) {
        console.error('Error saving enhanced data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update the existing save-timing endpoint to handle both
app.post('/api/save-timing', (req, res) => {
    const { surahNumber, verseNumber, segments, enhancedSegments } = req.body;
    
    try {
        const surahNum = String(surahNumber).padStart(3, '0');
        
        // Save timing data (existing code)
        const timingPath = path.join(__dirname, '..', 'quran-data', 'surah-timings', `surah_${surahNum}_timings.json`);
        let allTimings = [];
        if (fs.existsSync(timingPath)) {
            allTimings = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
        }
        
        const verseIndex = allTimings.findIndex(v => v.verseNumber == verseNumber);
        if (verseIndex >= 0) {
            allTimings[verseIndex].segments = segments;
        } else {
            return res.status(404).json({ success: false, error: 'Verse not found in timing file' });
        }
        
        fs.writeFileSync(timingPath, JSON.stringify(allTimings, null, 2));
        
        // ALSO save enhanced segments if provided
        if (enhancedSegments) {
            const enhancedPath = path.join(__dirname, '..', 'quran-data', 'enhanced', `${surahNum}.json`);
            let enhancedData = JSON.parse(fs.readFileSync(enhancedPath, 'utf8'));
            
            const enhancedVerseIndex = enhancedData.verses.findIndex(v => v.key === `${surahNumber}:${verseNumber}`);
            if (enhancedVerseIndex >= 0) {
                enhancedData.verses[enhancedVerseIndex].segments = enhancedSegments;
                fs.writeFileSync(enhancedPath, JSON.stringify(enhancedData, null, 2));
                console.log(`Updated both timing and enhanced data for verse ${verseNumber}`);
            }
        }
        
        res.json({ 
            success: true, 
            message: `All data saved for Surah ${surahNumber}, Verse ${verseNumber}`,
            file: `surah_${surahNum}_timings.json`
        });
        
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ Segment server running at http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT}/segment-editor.html to edit segments\n`);
});