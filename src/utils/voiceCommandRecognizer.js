/**
 * Voice Command Recognizer
 * Provides voice recognition and command matching using Web Speech API
 */

// Command registry with Indonesian and English variants
export const VOICE_COMMANDS = {
    PLAY: {
        id: 'PLAY',
        indonesian: ['mulai', 'main', 'putar'],
        english: ['play', 'start', 'begin'],
        action: 'play',
        description: 'Play video'
    },
    PAUSE: {
        id: 'PAUSE',
        indonesian: ['berhenti', 'jeda', 'pause', 'stop'],
        english: ['pause', 'stop', 'halt'],
        action: 'pause',
        description: 'Pause video'
    },
    RECORD: {
        id: 'RECORD',
        indonesian: ['ambil', 'catat', 'rekam', 'mulai ukur'],
        english: ['record', 'mark', 'capture', 'start measurement'],
        action: 'startMeasurement',
        description: 'Start measurement'
    },
    DONE: {
        id: 'DONE',
        indonesian: ['selesai', 'simpan', 'akhiri'],
        english: ['done', 'save', 'finish', 'end'],
        action: 'endMeasurement',
        description: 'End measurement'
    },
    NEXT_FRAME: {
        id: 'NEXT_FRAME',
        indonesian: ['maju', 'lanjut', 'berikutnya'],
        english: ['next', 'forward', 'advance'],
        action: 'nextFrame',
        description: 'Next frame'
    },
    PREVIOUS_FRAME: {
        id: 'PREVIOUS_FRAME',
        indonesian: ['mundur', 'kembali', 'sebelumnya'],
        english: ['back', 'previous', 'rewind'],
        action: 'previousFrame',
        description: 'Previous frame'
    },
    SPEED_UP: {
        id: 'SPEED_UP',
        indonesian: ['cepat', 'percepat', 'lebih cepat'],
        english: ['faster', 'speed up', 'accelerate'],
        action: 'speedUp',
        description: 'Increase playback speed'
    },
    SLOW_DOWN: {
        id: 'SLOW_DOWN',
        indonesian: ['lambat', 'perlambat', 'lebih lambat'],
        english: ['slower', 'slow down', 'decelerate'],
        action: 'slowDown',
        description: 'Decrease playback speed'
    },
    ZOOM_IN: {
        id: 'ZOOM_IN',
        indonesian: ['zoom in', 'perbesar', 'dekat'],
        english: ['zoom in', 'enlarge', 'magnify'],
        action: 'zoomIn',
        description: 'Zoom in'
    },
    ZOOM_OUT: {
        id: 'ZOOM_OUT',
        indonesian: ['zoom out', 'perkecil', 'jauh'],
        english: ['zoom out', 'shrink', 'reduce'],
        action: 'zoomOut',
        description: 'Zoom out'
    }
};

/**
 * Voice Command Recognizer Class
 */
class VoiceCommandRecognizer {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.language = 'id-ID'; // Default to Indonesian
        this.onCommandCallback = null;
        this.onStatusCallback = null;
        this.onDictationCallback = null; // New: for dictation mode
        this.continuousMode = false;
        this.dictationMode = false; // New: dictation mode flag

        this.initRecognition();
    }

    /**
     * Initialize Web Speech API
     */
    initRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Web Speech API not supported in this browser');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Single command mode by default
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = this.language;

        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('listening', 'Mendengarkan...');
        };

        this.recognition.onresult = (event) => {
            const results = event.results[event.results.length - 1];
            const transcript = results[0].transcript.toLowerCase().trim();
            const confidence = results[0].confidence;

            console.log(`Voice input: "${transcript}" (confidence: ${confidence})`);

            // Dictation mode: return raw transcript without command matching
            if (this.dictationMode) {
                this.updateStatus('success', 'Dictated');
                if (this.onDictationCallback) {
                    this.onDictationCallback(transcript, confidence);
                }
                return;
            }

            // Command mode: Match command
            const command = this.matchCommand(transcript);

            if (command && confidence > 0.6) {
                this.updateStatus('success', `Perintah: ${command.id}`);
                if (this.onCommandCallback) {
                    this.onCommandCallback(command, transcript, confidence);
                }
            } else {
                this.updateStatus('error', 'Perintah tidak dikenali');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;

            let errorMessage = 'Error';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'Tidak ada suara terdeteksi';
                    break;
                case 'audio-capture':
                    errorMessage = 'Mikrofon tidak tersedia';
                    break;
                case 'not-allowed':
                    errorMessage = 'Izin mikrofon ditolak';
                    break;
                default:
                    errorMessage = `Error: ${event.error}`;
            }

            this.updateStatus('error', errorMessage);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateStatus('idle', 'Siap');

            // Restart if continuous mode
            if (this.continuousMode && this.recognition) {
                setTimeout(() => this.start(), 100);
            }
        };

        return true;
    }

    /**
     * Match transcript to command
     * @param {string} transcript - Voice input text
     * @returns {Object|null} Matched command or null
     */
    matchCommand(transcript) {
        const words = transcript.toLowerCase().split(' ');
        console.log(`Matching transcript: "${transcript}"`);
        console.log(`Language: ${this.language}`);

        // Try exact match first
        for (const [key, command] of Object.entries(VOICE_COMMANDS)) {
            const keywords = this.language === 'id-ID' ? command.indonesian : command.english;

            for (const keyword of keywords) {
                if (transcript.includes(keyword)) {
                    console.log(`✓ Exact match found: "${keyword}" -> ${command.id}`);
                    return command;
                }
            }
        }

        // Try fuzzy match (single word)
        for (const word of words) {
            for (const [key, command] of Object.entries(VOICE_COMMANDS)) {
                const keywords = this.language === 'id-ID' ? command.indonesian : command.english;

                for (const keyword of keywords) {
                    const sim = this.similarity(word, keyword);
                    if (sim > 0.7) {
                        console.log(`✓ Fuzzy match found: "${word}" ≈ "${keyword}" (${(sim * 100).toFixed(0)}%) -> ${command.id}`);
                        return command;
                    }
                }
            }
        }

        console.log(`✗ No match found for: "${transcript}"`);
        return null;
    }

    /**
     * Calculate string similarity (Levenshtein-based)
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Similarity score (0-1)
     */
    similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    /**
     * Start listening
     */
    start() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return false;
        }

        if (this.isListening) {
            console.warn('Already listening');
            return false;
        }

        try {
            this.recognition.lang = this.language;
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.continuousMode = false;
            this.recognition.stop();
        }
    }

    /**
     * Set language
     * @param {string} lang - Language code ('id-ID' or 'en-US')
     */
    setLanguage(lang) {
        this.language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * Set continuous mode
     * @param {boolean} enabled - Enable continuous listening
     */
    setContinuousMode(enabled) {
        this.continuousMode = enabled;
    }

    /**
     * Set command callback
     * @param {Function} callback - Callback function (command, transcript, confidence)
     */
    onCommand(callback) {
        this.onCommandCallback = callback;
    }

    /**
     * Set status callback
     * @param {Function} callback - Callback function (status, message)
     */
    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    /**
     * Update status
     */
    updateStatus(status, message) {
        if (this.onStatusCallback) {
            this.onStatusCallback(status, message);
        }
    }

    /**
     * Set dictation mode
     * @param {boolean} enabled - Enable dictation mode (bypasses command matching)
     */
    setDictationMode(enabled) {
        this.dictationMode = enabled;
        if (enabled) {
            this.updateStatus('idle', 'Dictation mode');
        } else {
            this.updateStatus('idle', 'Command mode');
        }
    }

    /**
     * Set dictation callback
     * @param {Function} callback - Callback function (transcript, confidence)
     */
    onDictation(callback) {
        this.onDictationCallback = callback;
    }

    /**
     * Check if browser supports speech recognition
     * @returns {boolean} True if supported
     */
    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Get all available commands
     * @param {string} language - Language code
     * @returns {Array} List of commands with keywords
     */
    static getCommands(language = 'id-ID') {
        return Object.values(VOICE_COMMANDS).map(cmd => ({
            id: cmd.id,
            keywords: language === 'id-ID' ? cmd.indonesian : cmd.english,
            description: cmd.description
        }));
    }
}

export default VoiceCommandRecognizer;
