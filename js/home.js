
        // Complete list of all 114 surahs
        const surahs = [
            { number: 1, arabic: "سُورَةُ الْفَاتِحَة", english: "Al-Fatihah (The Opening)", verses: 7, revelation: "Makki" },
            { number: 2, arabic: "سُورَةُ الْبَقَرَة", english: "Al-Baqarah (The Cow)", verses: 286, revelation: "Madani" },
            { number: 3, arabic: "سُورَةُ آل عِمْرَان", english: "Aal-E-Imran (The Family of Imran)", verses: 200, revelation: "Madani" },
            { number: 4, arabic: "سُورَةُ النِّسَاء", english: "An-Nisa (The Women)", verses: 176, revelation: "Madani" },
            { number: 5, arabic: "سُورَةُ الْمَائِدَة", english: "Al-Ma'idah (The Table)", verses: 120, revelation: "Madani" },
            { number: 6, arabic: "سُورَةُ الْأَنْعَام", english: "Al-An'am (The Cattle)", verses: 165, revelation: "Makki" },
            { number: 7, arabic: "سُورَةُ الْأَعْرَاف", english: "Al-A'raf (The Heights)", verses: 206, revelation: "Makki" },
            { number: 8, arabic: "سُورَةُ الْأَنْفَال", english: "Al-Anfal (The Spoils of War)", verses: 75, revelation: "Madani" },
            { number: 9, arabic: "سُورَةُ التَّوْبَة", english: "At-Tawbah (The Repentance)", verses: 129, revelation: "Madani" },
            { number: 10, arabic: "سُورَةُ يُونُس", english: "Yunus (Jonah)", verses: 109, revelation: "Makki" },
            { number: 11, arabic: "سُورَةُ هُود", english: "Hud", verses: 123, revelation: "Makki" },
            { number: 12, arabic: "سُورَةُ يُوسُف", english: "Yusuf (Joseph)", verses: 111, revelation: "Makki" },
            { number: 13, arabic: "سُورَةُ الرَّعْد", english: "Ar-Ra'd (The Thunder)", verses: 43, revelation: "Madani" },
            { number: 14, arabic: "سُورَةُ إِبْرَاهِيم", english: "Ibrahim (Abraham)", verses: 52, revelation: "Makki" },
            { number: 15, arabic: "سُورَةُ الْحِجْر", english: "Al-Hijr", verses: 99, revelation: "Makki" },
            { number: 16, arabic: "سُورَةُ النَّحْل", english: "An-Nahl (The Bee)", verses: 128, revelation: "Makki" },
            { number: 17, arabic: "سُورَةُ الْإِسْرَاء", english: "Al-Isra (The Night Journey)", verses: 111, revelation: "Makki" },
            { number: 18, arabic: "سُورَةُ الْكَهْف", english: "Al-Kahf (The Cave)", verses: 110, revelation: "Makki" },
            { number: 19, arabic: "سُورَةُ مَرْيَم", english: "Maryam (Mary)", verses: 98, revelation: "Makki" },
            { number: 20, arabic: "سُورَةُ طه", english: "Ta-Ha", verses: 135, revelation: "Makki" },
            { number: 21, arabic: "سُورَةُ الْأَنْبِيَاء", english: "Al-Anbiya (The Prophets)", verses: 112, revelation: "Makki" },
            { number: 22, arabic: "سُورَةُ الْحَج", english: "Al-Hajj (The Pilgrimage)", verses: 78, revelation: "Madani" },
            { number: 23, arabic: "سُورَةُ الْمُؤْمِنُون", english: "Al-Mu'minun (The Believers)", verses: 118, revelation: "Makki" },
            { number: 24, arabic: "سُورَةُ النُّور", english: "An-Nur (The Light)", verses: 64, revelation: "Madani" },
            { number: 25, arabic: "سُورَةُ الْفُرْقَان", english: "Al-Furqan (The Criterion)", verses: 77, revelation: "Makki" },
            { number: 26, arabic: "سُورَةُ الشُّعَرَاء", english: "Ash-Shu'ara (The Poets)", verses: 227, revelation: "Makki" },
            { number: 27, arabic: "سُورَةُ النَّمْل", english: "An-Naml (The Ant)", verses: 93, revelation: "Makki" },
            { number: 28, arabic: "سُورَةُ الْقَصَص", english: "Al-Qasas (The Stories)", verses: 88, revelation: "Makki" },
            { number: 29, arabic: "سُورَةُ الْعَنْكَبُوت", english: "Al-Ankabut (The Spider)", verses: 69, revelation: "Makki" },
            { number: 30, arabic: "سُورَةُ الرُّوم", english: "Ar-Rum (The Romans)", verses: 60, revelation: "Makki" },
            { number: 31, arabic: "سُورَةُ لُقْمَان", english: "Luqman", verses: 34, revelation: "Makki" },
            { number: 32, arabic: "سُورَةُ السَّجْدَة", english: "As-Sajdah (The Prostration)", verses: 30, revelation: "Makki" },
            { number: 33, arabic: "سُورَةُ الْأَحْزَاب", english: "Al-Ahzab (The Clans)", verses: 73, revelation: "Madani" },
            { number: 34, arabic: "سُورَةُ سَبَأ", english: "Saba (Sheba)", verses: 54, revelation: "Makki" },
            { number: 35, arabic: "سُورَةُ فَاطِر", english: "Fatir (The Creator)", verses: 45, revelation: "Makki" },
            { number: 36, arabic: "سُورَةُ يس", english: "Ya-Sin", verses: 83, revelation: "Makki" },
            { number: 37, arabic: "سُورَةُ الصَّافَّات", english: "As-Saffat (Those Ranged in Ranks)", verses: 182, revelation: "Makki" },
            { number: 38, arabic: "سُورَةُ ص", english: "Sad", verses: 88, revelation: "Makki" },
            { number: 39, arabic: "سُورَةُ الزُّمَر", english: "Az-Zumar (The Groups)", verses: 75, revelation: "Makki" },
            { number: 40, arabic: "سُورَةُ غَافِر", english: "Ghafir (The Forgiver)", verses: 85, revelation: "Makki" },
            { number: 41, arabic: "سُورَةُ فُصِّلَت", english: "Fusilat (Explained in Detail)", verses: 54, revelation: "Makki" },
            { number: 42, arabic: "سُورَةُ الشُّورَى", english: "Ash-Shura (The Consultation)", verses: 53, revelation: "Makki" },
            { number: 43, arabic: "سُورَةُ الزُّخْرُف", english: "Az-Zukhruf (The Gold)", verses: 89, revelation: "Makki" },
            { number: 44, arabic: "سُورَةُ الدُّخَان", english: "Ad-Dukhan (The Smoke)", verses: 59, revelation: "Makki" },
            { number: 45, arabic: "سُورَةُ الْجَاثِيَة", english: "Al-Jathiyah (The Kneeling)", verses: 37, revelation: "Makki" },
            { number: 46, arabic: "سُورَةُ الْأَحْقَاف", english: "Al-Ahqaf (The Valley)", verses: 35, revelation: "Makki" },
            { number: 47, arabic: "سُورَةُ مُحَمَّد", english: "Muhammad", verses: 38, revelation: "Madani" },
            { number: 48, arabic: "سُورَةُ الْفَتْح", english: "Al-Fath (The Victory)", verses: 29, revelation: "Madani" },
            { number: 49, arabic: "سُورَةُ الْحُجُرَات", english: "Al-Hujurat (The Rooms)", verses: 18, revelation: "Madani" },
            { number: 50, arabic: "سُورَةُ ق", english: "Qaf", verses: 45, revelation: "Makki" },
            { number: 51, arabic: "سُورَةُ الذَّارِيَات", english: "Az-Zariyat (The Scatterers)", verses: 60, revelation: "Makki" },
            { number: 52, arabic: "سُورَةُ الطُّور", english: "At-Tur (The Mount)", verses: 49, revelation: "Makki" },
            { number: 53, arabic: "سُورَةُ النَّجْم", english: "An-Najm (The Star)", verses: 62, revelation: "Makki" },
            { number: 54, arabic: "سُورَةُ الْقَمَر", english: "Al-Qamar (The Moon)", verses: 55, revelation: "Makki" },
            { number: 55, arabic: "سُورَةُ الرَّحْمَن", english: "Ar-Rahman (The Most Gracious)", verses: 78, revelation: "Madani" },
            { number: 56, arabic: "سُورَةُ الْوَاقِعَة", english: "Al-Waqi'ah (The Event)", verses: 96, revelation: "Makki" },
            { number: 57, arabic: "سُورَةُ الْحَدِيد", english: "Al-Hadid (The Iron)", verses: 29, revelation: "Madani" },
            { number: 58, arabic: "سُورَةُ الْمُجَادِلَة", english: "Al-Mujadilah (The Pleading)", verses: 22, revelation: "Madani" },
            { number: 59, arabic: "سُورَةُ الْحَشْر", english: "Al-Hashr (The Gathering)", verses: 24, revelation: "Madani" },
            { number: 60, arabic: "سُورَةُ الْمُمْتَحَنَة", english: "Al-Mumtahanah (The Tested)", verses: 13, revelation: "Madani" },
            { number: 61, arabic: "سُورَةُ الصَّف", english: "As-Saff (The Row)", verses: 14, revelation: "Madani" },
            { number: 62, arabic: "سُورَةُ الْجُمُعَة", english: "Al-Jumu'ah (Friday)", verses: 11, revelation: "Madani" },
            { number: 63, arabic: "سُورَةُ الْمُنَافِقُون", english: "Al-Munafiqun (The Hypocrites)", verses: 11, revelation: "Madani" },
            { number: 64, arabic: "سُورَةُ التَّغَابُن", english: "At-Taghabun (Loss and Gain)", verses: 18, revelation: "Madani" },
            { number: 65, arabic: "سُورَةُ الطَّلَاق", english: "At-Talaq (The Divorce)", verses: 12, revelation: "Madani" },
            { number: 66, arabic: "سُورَةُ التَّحْرِيم", english: "At-Tahrim (The Prohibition)", verses: 12, revelation: "Madani" },
            { number: 67, arabic: "سُورَةُ الْمُلْك", english: "Al-Mulk (The Kingdom)", verses: 30, revelation: "Makki" },
            { number: 68, arabic: "سُورَةُ الْقَلَم", english: "Al-Qalam (The Pen)", verses: 52, revelation: "Makki" },
            { number: 69, arabic: "سُورَةُ الْحَاقَّة", english: "Al-Haqqah (The Inevitable)", verses: 52, revelation: "Makki" },
            { number: 70, arabic: "سُورَةُ الْمَعَارِج", english: "Al-Ma'arij (The Ways of Ascent)", verses: 44, revelation: "Makki" },
            { number: 71, arabic: "سُورَةُ نُوح", english: "Nuh (Noah)", verses: 28, revelation: "Makki" },
            { number: 72, arabic: "سُورَةُ الْجِن", english: "Al-Jinn (The Jinn)", verses: 28, revelation: "Makki" },
            { number: 73, arabic: "سُورَةُ الْمُزَّمِّل", english: "Al-Muzammil (The Wrapped)", verses: 20, revelation: "Makki" },
            { number: 74, arabic: "سُورَةُ الْمُدَّثِّر", english: "Al-Mudaththir (The Cloaked)", verses: 56, revelation: "Makki" },
            { number: 75, arabic: "سُورَةُ الْقِيَامَة", english: "Al-Qiyamah (The Resurrection)", verses: 40, revelation: "Makki" },
            { number: 76, arabic: "سُورَةُ الْإِنْسَان", english: "Al-Insan (The Human)", verses: 31, revelation: "Madani" },
            { number: 77, arabic: "سُورَةُ الْمُرْسَلَات", english: "Al-Mursalat (Those Sent)", verses: 50, revelation: "Makki" },
            { number: 78, arabic: "سُورَةُ النَّبَأ", english: "An-Naba (The Great News)", verses: 40, revelation: "Makki" },
            { number: 79, arabic: "سُورَةُ النَّازِعَات", english: "An-Nazi'at (Those Who Pull Out)", verses: 46, revelation: "Makki" },
            { number: 80, arabic: "سُورَةُ عَبَس", english: "Abasa (He Frowned)", verses: 42, revelation: "Makki" },
            { number: 81, arabic: "سُورَةُ التَّكْوِير", english: "At-Takwir (The Overthrowing)", verses: 29, revelation: "Makki" },
            { number: 82, arabic: "سُورَةُ الانْفِطَار", english: "Al-Infitar (The Cleaving)", verses: 19, revelation: "Makki" },
            { number: 83, arabic: "سُورَةُ الْمُطَفِّفِين", english: "Al-Mutaffifin (Those Who Deal in Fraud)", verses: 36, revelation: "Makki" },
            { number: 84, arabic: "سُورَةُ الانْشِقَاق", english: "Al-Inshiqaq (The Splitting Asunder)", verses: 25, revelation: "Makki" },
            { number: 85, arabic: "سُورَةُ الْبُرُوج", english: "Al-Buruj (The Stars)", verses: 22, revelation: "Makki" },
            { number: 86, arabic: "سُورَةُ الطَّارِق", english: "At-Tariq (The Night-Comer)", verses: 17, revelation: "Makki" },
            { number: 87, arabic: "سُورَةُ الْأَعْلَى", english: "Al-A'la (The Most High)", verses: 19, revelation: "Makki" },
            { number: 88, arabic: "سُورَةُ الْغَاشِيَة", english: "Al-Ghashiyah (The Overwhelming)", verses: 26, revelation: "Makki" },
            { number: 89, arabic: "سُورَةُ الْفَجْر", english: "Al-Fajr (The Dawn)", verses: 30, revelation: "Makki" },
            { number: 90, arabic: "سُورَةُ الْبَلَد", english: "Al-Balad (The City)", verses: 20, revelation: "Makki" },
            { number: 91, arabic: "سُورَةُ الشَّمْس", english: "Ash-Shams (The Sun)", verses: 15, revelation: "Makki" },
            { number: 92, arabic: "سُورَةُ اللَّيْل", english: "Al-Layl (The Night)", verses: 21, revelation: "Makki" },
            { number: 93, arabic: "سُورَةُ الضُّحَى", english: "Ad-Duha (The Forenoon)", verses: 11, revelation: "Makki" },
            { number: 94, arabic: "سُورَةُ الشَّرْح", english: "Ash-Sharh (The Opening Forth)", verses: 8, revelation: "Makki" },
            { number: 95, arabic: "سُورَةُ التِّين", english: "At-Tin (The Fig)", verses: 8, revelation: "Makki" },
            { number: 96, arabic: "سُورَةُ الْعَلَق", english: "Al-Alaq (The Clot)", verses: 19, revelation: "Makki" },
            { number: 97, arabic: "سُورَةُ الْقَدْر", english: "Al-Qadr (The Night of Decree)", verses: 5, revelation: "Makki" },
            { number: 98, arabic: "سُورَةُ الْبَيِّنَة", english: "Al-Bayyinah (The Clear Evidence)", verses: 8, revelation: "Madani" },
            { number: 99, arabic: "سُورَةُ الزَّلْزَلَة", english: "Az-Zalzalah (The Earthquake)", verses: 8, revelation: "Madani" },
            { number: 100, arabic: "سُورَةُ الْعَادِيَات", english: "Al-Adiyat (Those Who Run)", verses: 11, revelation: "Makki" },
            { number: 101, arabic: "سُورَةُ الْقَارِعَة", english: "Al-Qari'ah (The Striking Hour)", verses: 11, revelation: "Makki" },
            { number: 102, arabic: "سُورَةُ التَّكَاثُر", english: "At-Takathur (The Piling Up)", verses: 8, revelation: "Makki" },
            { number: 103, arabic: "سُورَةُ الْعَصْر", english: "Al-Asr (The Time)", verses: 3, revelation: "Makki" },
            { number: 104, arabic: "سُورَةُ الْهُمَزَة", english: "Al-Humazah (The Slanderer)", verses: 9, revelation: "Makki" },
            { number: 105, arabic: "سُورَةُ الْفِيل", english: "Al-Fil (The Elephant)", verses: 5, revelation: "Makki" },
            { number: 106, arabic: "سُورَةُ قُرَيْش", english: "Quraish", verses: 4, revelation: "Makki" },
            { number: 107, arabic: "سُورَةُ الْمَاعُون", english: "Al-Ma'un (The Assistance)", verses: 7, revelation: "Makki" },
            { number: 108, arabic: "سُورَةُ الْكَوْثَر", english: "Al-Kawthar (The Abundance)", verses: 3, revelation: "Makki" },
            { number: 109, arabic: "سُورَةُ الْكَافِرُون", english: "Al-Kafirun (The Disbelievers)", verses: 6, revelation: "Makki" },
            { number: 110, arabic: "سُورَةُ النَّصْر", english: "An-Nasr (The Help)", verses: 3, revelation: "Madani" },
            { number: 111, arabic: "سُورَةُ الْمَسَد", english: "Al-Masad (The Palm Fiber)", verses: 5, revelation: "Makki" },
            { number: 112, arabic: "سُورَةُ الْإِخْلَاص", english: "Al-Ikhlas (The Sincerity)", verses: 4, revelation: "Makki" },
            { number: 113, arabic: "سُورَةُ الْفَلَق", english: "Al-Falaq (The Daybreak)", verses: 5, revelation: "Makki" },
            { number: 114, arabic: "سُورَةُ النَّاس", english: "An-Nas (The Mankind)", verses: 6, revelation: "Makki" }
        ];

        function renderSurahs(surahList = surahs) {
            const surahGrid = document.getElementById('surahGrid');
            surahGrid.innerHTML = '';

            surahList.forEach(surah => {
                // All surahs are now available
                const isAvailable = true;

                const surahCard = document.createElement('div');
                surahCard.className = `surah-card ${isAvailable ? 'available' : 'coming-soon'}`;

                if (isAvailable) {
                    surahCard.onclick = () => openSurah(surah.number);
                }

                surahCard.innerHTML = `
                    <div class="surah-header">
                        <div class="surah-number">${surah.number}</div>
                        <div class="surah-status ${isAvailable ? 'status-available' : 'status-coming-soon'}">
                            ${isAvailable ? 'Available' : 'Coming Soon'}
                        </div>
                    </div>
                    <div class="surah-arabic">${surah.arabic}</div>
                    <div class="surah-english">${surah.english}</div>
                    <div class="surah-info">
                        <span class="surah-revelation">${surah.revelation}</span>
                        <span>${surah.verses} verses</span>
                    </div>
                `;

                surahGrid.appendChild(surahCard);
            });
        }

        function searchSurahs() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();

            if (searchTerm === '') {
                renderSurahs();
                return;
            }

            const filteredSurahs = surahs.filter(surah =>
                surah.english.toLowerCase().includes(searchTerm) ||
                surah.arabic.includes(searchTerm) ||
                surah.number.toString().includes(searchTerm)
            );

            renderSurahs(filteredSurahs);
        }

        function openSurah(surahNumber) {
            // Navigate to the learning page with the surah parameter
            window.location.href = `quran-learning.html?surah=${surahNumber}`;
        }

        // Function to get recent surahs from localStorage
    function getRecentSurahs() {
        try {
            const saved = localStorage.getItem('quranRecentSurahs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    // Function to render recent surahs
    function renderRecentSurahs() {
        const recentSurahs = getRecentSurahs();
        const recentSection = document.getElementById('recent-section');
        const recentGrid = document.getElementById('recentGrid');
        
        if (recentSurahs.length === 0) {
            recentSection.style.display = 'none';
            return;
        }
        
        recentSection.style.display = 'block';
        recentGrid.innerHTML = '';
        
        recentSurahs.forEach(recent => {
            const surah = surahs.find(s => s.number === recent.surahNumber);
            if (!surah) return;
            
            const recentCard = document.createElement('div');
            recentCard.className = 'recent-card';
            recentCard.onclick = () => openSurah(surah.number);
            
            // Calculate progress percentage
            const savedProgress = getSavedProgress(surah.number);
            const progressPercent = savedProgress ? 
                Math.round((savedProgress.verseNumber / surah.verses) * 100) : 0;
            
            recentCard.innerHTML = `
                <div class="recent-header">
                    <div class="surah-number">${surah.number}</div>
                    <div class="recent-badge">Recent</div>
                </div>
                <div class="recent-arabic">${surah.arabic}</div>
                <div class="recent-english">${surah.english}</div>
                <div class="recent-info">
                    <div class="recent-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="progress-text">
                            ${savedProgress ? `Verse ${savedProgress.verseNumber}` : 'Not started'} 
                            of ${surah.verses}
                        </span>
                    </div>
                    <div class="recent-time">${getTimeAgo(recent.timestamp)}</div>
                </div>
            `;
            
            recentGrid.appendChild(recentCard);
        });
    }
    
    // Function to get saved progress for a surah
    function getSavedProgress(surahNumber) {
        try {
            const saved = localStorage.getItem('quranReadingProgress');
            const progress = saved ? JSON.parse(saved) : {};
            return progress[surahNumber] || null;
        } catch (e) {
            return null;
        }
    }
    
    // Function to format time ago
    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
    
    // Update the existing renderSurahs function (keep it as is)
    
    // Update window.onload
    window.addEventListener('load', () => {
        renderRecentSurahs();  // Add this line
        renderSurahs();
    });