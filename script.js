let questions = [];
let questionsDE = []; // German questions
let questionsEN = []; // English questions
let feedbacks = [];
let feedbacksDE = []; // German feedbacks
let feedbacksEN = []; // English feedbacks
let currentQuestionIndex = 0;
let score = 0;
let answered = false;
let unicornCount = 0;
let selectedAnswers = [];
let lastAnswerWasCorrect = false;
let userNickname = '';
let questionStartTime = 0;
let questionData = [];
let firebaseSuccessCount = 0;
let firebaseFailureCount = 0;
let currentLanguage = 'de'; // 'de' for German, 'en' for English
let questionShuffleOrder = []; // Store shuffle order for each question to maintain consistency across languages
let selectedModule = null; // Selected module (1-9, or 'final')
window.selectedModule = null; // Make it globally accessible
let userGroup = null; // User group from URL parameter

// Translation object for all UI text
const translations = {
    de: {
        nicknameTitle: 'Wie heißt Du? 🎮',
        nicknamePlaceholder: 'Wie heißt Du?',
        startQuiz: 'Quiz starten! 🚀',
        preparingQuiz: 'Dein Quiz wird vorbereitet... 🎨',
        letsGo: 'Los geht\'s! 🚀',
        submitAnswer: 'Antwort absenden ✓',
        nextQuestion: 'Nächste Frage →',
        correct: '🎉 Richtig! 🎉',
        wrong: '🐸 Falsch! 🐸',
        finalBattle: 'Der letzte Kampf beginnt...',
        unicornsWin: 'Einhörner gewinnen! 🎉',
        frogsWin: 'Frösche gewinnen! 🐸',
        tie: 'Unentschieden!',
        viewResults: 'Ergebnisse anzeigen →',
        quizComplete: 'Quiz abgeschlossen! 🎊',
        downloadResults: 'Ergebnisse herunterladen 📥',
        aiSystemsUsed: 'KI-Systeme, die für das Quiz verwendet wurden',
        backToQuiz: 'Zurück zum Quiz',
        noFeedback: 'Kein Feedback für diese Frage verfügbar.',
        source: 'Quelle:',
        enterNickname: 'Wie heißt Du?',
        creditsTop: 'Bildungsinhalte entwickelt von/unter Aufsicht von Kamilla Tenorio',
        creditsDeveloped: 'Entwickelt mit ❤️ von Hyunchang Oh für AI Across Domains 2025/2026 WS',
        creditsFrontend: 'Cursor AI für die Frontend Implementation',
        creditsBackend: 'Gemini für die Backend Implementation',
        creditsBottom: 'Emoji-Grafiken für Länderflaggen vom Twitter Twemoji-Projekt, lizenziert unter CC-BY 4.0:',
        creditsLicense: 'https://creativecommons.org/licenses/by/4.0/',
        youScored: (score, total) => `Du hast ${score} von ${total} Punkten erreicht!`,
        firebaseNoData: '⚠️ Keine Daten wurden an Firebase gesendet. Überprüfe die Browser-Konsole auf Fehler.',
        firebaseAllSuccess: (count) => `✅ Alle ${count} Frage(n) erfolgreich an die Dozenten gemeldet!`,
        firebasePartial: (success, failed) => `⚠️ Teilweise erfolgreich: ${success} gespeichert, ${failed} fehlgeschlagen. Überprüfe die Konsole für Details.`,
        firebaseAllFailed: (count) => `❌ Alle ${count} Versuch(e) fehlgeschlagen. Überprüfe die Browser-Konsole (F12) auf Fehler.`,
        firebaseStatus: (success, failed) => `Firebase Status: ${success} gespeichert, ${failed} fehlgeschlagen`,
        checkConsole: 'Überprüfe die Browser-Konsole (F12) für detaillierte Protokolle',
        firebaseAllSuccessMessage: 'Aber du kannst die Ergebnisse trotzdem herunterladen, nur für den Fall.',
        firebaseNotAllSuccessMessage: 'Etwas ist schief gelaufen. Bitte lade die Ergebnisse mit dem Button unten herunter und sende sie per E-Mail an die Dozenten.'
    },
    en: {
        nicknameTitle: 'What\'s your name? 🎮',
        nicknamePlaceholder: 'What\'s your name?',
        startQuiz: 'Start Quiz! 🚀',
        preparingQuiz: 'Preparing your quiz... 🎨',
        letsGo: 'Let\'s go! 🚀',
        submitAnswer: 'Submit Answer ✓',
        nextQuestion: 'Next Question →',
        correct: '🎉 Correct! 🎉',
        wrong: '🐸 Wrong! 🐸',
        finalBattle: 'The Final Battle Begins...',
        unicornsWin: 'Unicorns Win! 🎉',
        frogsWin: 'Frogs Win! 🐸',
        tie: 'It\'s a Tie!',
        viewResults: 'View Results →',
        quizComplete: 'Quiz Complete! 🎊',
        downloadResults: 'Download Results 📥',
        aiSystemsUsed: 'AI Systems Used for the Quiz',
        backToQuiz: 'Back to Quiz',
        noFeedback: 'No feedback available for this question.',
        source: 'Source:',
        enterNickname: 'Please enter a nickname!',
        creditsTop: 'Educational Content Developed by/under supervision of Kamilla Tenorio',
        creditsDeveloped: 'Developed with ❤️ by Hyunchang Oh for AI Across Domains 2025/2026 WS',
        creditsFrontend: 'Cursor AI for the Frontend Implementation',
        creditsBackend: 'Gemini for the Backend Implementation',
        creditsBottom: 'Emoji graphics for Country Flags from Twitter\'s Twemoji project, licensed under CC-BY 4.0:',
        creditsLicense: 'https://creativecommons.org/licenses/by/4.0/',
        youScored: (score, total) => `You scored ${score} out of ${total}!`,
        firebaseNoData: '⚠️ No data was sent to Firebase. Check the browser console for errors.',
        firebaseAllSuccess: (count) => `✅ All ${count} question(s) successfully reported to lecturers!`,
        firebasePartial: (success, failed) => `⚠️ Partial success: ${success} saved, ${failed} failed. Check console for details.`,
        firebaseAllFailed: (count) => `❌ All ${count} attempt(s) failed. Check browser console (F12) for errors.`,
        firebaseStatus: (success, failed) => `Firebase Status: ${success} saved, ${failed} failed`,
        checkConsole: 'Check browser console (F12) for detailed logs',
        firebaseAllSuccessMessage: 'But you can still download the results just in case.',
        firebaseNotAllSuccessMessage: 'Something went wrong. Please download the results with the button below and send it to the lecturers via Email.'
    }
};

// Helper function to get translated text
function t(key, ...args) {
    const translation = translations[currentLanguage][key];
    if (typeof translation === 'function') {
        return translation(...args);
    }
    return translation || key;
}

// Escape text for safe insertion into HTML (both attribute and innerHTML contexts).
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function adjustOptionHeightsForOverflow() {
    const buttons = Array.from(document.querySelectorAll('.option-btn'));
    if (buttons.length === 0) return;
    const questionContainer = document.querySelector('.question-container');

    // Reset first, then re-measure after layout
    buttons.forEach(btn => btn.classList.remove('option-btn-overflow'));

    // Wait for the browser to apply the layout so scrollHeight/clientHeight are accurate
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const anyOverflow = buttons.some(btn => btn.scrollHeight > btn.clientHeight + 1);
            if (anyOverflow) {
                buttons.forEach(btn => btn.classList.add('option-btn-overflow'));
                // If we had to shrink option text due to overflow, make the main frame scrollable.
                if (questionContainer) {
                    questionContainer.classList.add('question-container-scrollable');
                }
            }
        });
    });
}

// Module selection function
function selectModule(moduleNumber) {
    selectedModule = moduleNumber;
    window.selectedModule = moduleNumber; // Make it globally accessible
    console.log(`✅ Module ${moduleNumber} selected`);
    
    // Hide module selection screen, show nickname screen
    document.getElementById('moduleSelectionScreen').style.display = 'none';
    document.getElementById('cardContainer').style.display = 'block';
    
    // Update title
    const titleElement = document.querySelector('.title');
    if (titleElement) {
        if (moduleNumber === 'final') {
            titleElement.textContent = `🎯 Final Test 🎯`;
        } else {
            titleElement.textContent = `🎯 Modul ${moduleNumber} Post-Test 🎯`;
        }
    }
    
    // Load questions and feedbacks for selected module
    loadQuestions().catch(error => {
        console.error('Error loading questions:', error);
    });
}

// Load feedback data from TSV files (both German and English)
async function loadFeedbacks() {
    if (selectedModule === null || selectedModule === undefined) {
        console.error('No module selected');
        return;
    }
    
    // Skip feedbacks for final module
    if (selectedModule === 'final') {
        feedbacksDE = [];
        feedbacksEN = [];
        return;
    }
    
    try {
        console.log(`📥 Loading feedback from feedbacks/feedback${selectedModule}.tsv and feedbacks/feedback_eng${selectedModule}.tsv...`);
        
        // Load German feedback (with cache-busting)
        const cacheBuster = `?v=${Date.now()}`;
        const responseDE = await fetch(`feedbacks/feedback${selectedModule}.tsv${cacheBuster}`);
        if (!responseDE.ok) {
            console.warn(`Failed to load feedbacks/feedback${selectedModule}.tsv: ${responseDE.status} ${responseDE.statusText}`);
            feedbacksDE = [];
        } else {
            const tsvTextDE = await responseDE.text();
            if (tsvTextDE) {
                const linesDE = tsvTextDE.trim().split('\n').filter(line => line.trim());
                feedbacksDE = linesDE.map(line => {
                    const parts = line.split('\t').map(part => part.trim());
                    if (parts.length >= 3) {
                        return {
                            title: parts[0],
                            explanation: parts[1],
                            source: parts[2] || ''
                        };
                    }
                    return null;
                }).filter(f => f !== null);
            }
        }
        
        // Load English feedback (with cache-busting)
        const responseEN = await fetch(`feedbacks/feedback_eng${selectedModule}.tsv${cacheBuster}`);
        if (!responseEN.ok) {
            console.warn(`Failed to load feedbacks/feedback_eng${selectedModule}.tsv: ${responseEN.status} ${responseEN.statusText}`);
            feedbacksEN = [];
        } else {
            const tsvTextEN = await responseEN.text();
            if (tsvTextEN) {
                const linesEN = tsvTextEN.trim().split('\n').filter(line => line.trim());
                feedbacksEN = linesEN.map(line => {
                    const parts = line.split('\t').map(part => part.trim());
                    if (parts.length >= 3) {
                        return {
                            title: parts[0],
                            explanation: parts[1],
                            source: parts[2] || ''
                        };
                    }
                    return null;
                }).filter(f => f !== null);
            }
        }
        
        // Set current feedbacks based on language
        feedbacks = currentLanguage === 'de' ? feedbacksDE : feedbacksEN;
        
        console.log(`✅ Loaded ${feedbacksDE.length} German and ${feedbacksEN.length} English feedback entries`);
    } catch (error) {
        console.error('Error loading feedback files:', error);
        console.warn('Continuing without feedback data...');
        feedbacks = []; // Set empty array so quiz can continue
        feedbacksDE = [];
        feedbacksEN = [];
    }
}

// Load questions from TSV files (both German and English)
async function loadQuestions() {
    if (selectedModule === null || selectedModule === undefined) {
        console.error('No module selected');
        return;
    }
    
    // Handle 'final' module differently (CSV format with multiple correct answers)
    if (selectedModule === 'final') {
        try {
            console.log(`📥 Loading questions from questions/questions_final.tsv and questions/questions_eng_final.tsv...`);
            
            const cacheBuster = `?v=${Date.now()}`;
            
            // Load German questions
            const responseDE = await fetch(`questions/questions_final.tsv${cacheBuster}`);
            if (!responseDE.ok) {
                throw new Error(`Failed to load questions/questions_final.tsv: ${responseDE.status} ${responseDE.statusText}`);
            }
            const textDE = await responseDE.text();
            if (!textDE || textDE.trim().length === 0) {
                throw new Error(`questions/questions_final.tsv is empty`);
            }
            
            // Load English questions
            const responseEN = await fetch(`questions/questions_eng_final.tsv${cacheBuster}`);
            if (!responseEN.ok) {
                throw new Error(`Failed to load questions/questions_eng_final.tsv: ${responseEN.status} ${responseEN.statusText}`);
            }
            const textEN = await responseEN.text();
            if (!textEN || textEN.trim().length === 0) {
                throw new Error(`questions/questions_eng_final.tsv is empty`);
            }
            
            // Helper function to parse TSV questions
            const parseQuestions = (text) => {
                const lines = text.trim().split('\n').filter(line => line.trim());
                return lines.map(line => {
                    // Try semicolon first, then tab (for compatibility)
                    let parts = line.split(';').map(part => part.trim());
                    if (parts.length < 3) {
                        parts = line.split('\t').map(part => part.trim());
                    }
                    if (parts.length < 3) return null;
                    
                    const question = parts[0];
                    
                    // Check for PNG filename at the end
                    let imagePath = null;
                    let numCorrect = 1;
                    const nonEmptyParts = parts.filter(p => p);
                    const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
                    const secondLastPart = nonEmptyParts.length > 1 ? nonEmptyParts[nonEmptyParts.length - 2] : null;
                    
                    // Check if last part is a PNG filename
                    const isPngFile = lastPart && /\.png$/i.test(lastPart);
                    
                    if (isPngFile) {
                        imagePath = `pictures/questions_pictures/${lastPart}`;
                        // Check if the part before PNG is a number (multiple correct answers)
                        if (secondLastPart) {
                            const parsedNum = parseInt(secondLastPart);
                            if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 10) {
                                numCorrect = parsedNum;
                            }
                        }
                    } else {
                        // No PNG, check if last part is a number
                        const parsedNum = parseInt(lastPart);
                        if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 10) {
                            numCorrect = parsedNum;
                        }
                    }
                    
                    // Get all options (exclude empty parts, "Weiß ich nicht"/"I don't know", trailing numbers, and PNG filenames)
                    const options = [];
                    for (let i = 1; i < parts.length; i++) {
                        const part = parts[i];
                        if (!part) continue;
                        const partLower = part.toLowerCase();
                        if (partLower === 'weiß ich nicht' || partLower === 'weiss ich nicht' || 
                            partLower === "i don't know" || partLower === 'i don\'t know') continue;
                        
                        // Skip PNG filenames
                        if (/\.png$/i.test(part)) continue;
                        
                        // Check if it's a standalone number (likely the numCorrect indicator)
                        const num = parseInt(part);
                        const isLastPart = i === parts.length - 1;
                        const nextPart = i < parts.length - 1 ? parts[i + 1] : null;
                        const isNextPng = nextPart && /\.png$/i.test(nextPart);
                        
                        // Skip if it's a number and either:
                        // 1. It's the last part (and not followed by PNG), OR
                        // 2. It's followed by a PNG file (it's the numCorrect indicator before the image)
                        if (!isNaN(num) && part === String(num)) {
                            if (isLastPart && !isNextPng) {
                                // This is the numCorrect indicator at the very end, skip it
                                break;
                            } else if (isNextPng) {
                                // This is the numCorrect indicator before PNG, skip it
                                continue;
                            }
                        }
                        options.push(part);
                    }
                    
                    // First numCorrect options are correct answers
                    const correctAnswers = options.slice(0, numCorrect);
                    const incorrectAnswers = options.slice(numCorrect);
                    
                    // Combine: correct answers first, then incorrect
                    const allOptions = [...correctAnswers, ...incorrectAnswers];
                    
                    if (correctAnswers.length === 0) {
                        console.warn(`No correct answers found for question: ${question.substring(0, 50)}...`);
                        return null;
                    }
                    
                    return {
                        question: question,
                        correctAnswer: correctAnswers[0], // For compatibility, use first correct answer
                        correctAnswers: correctAnswers, // Store all correct answers
                        options: allOptions,
                        imagePath: imagePath // Store image path if present
                    };
                }).filter(q => q !== null);
            };
            
            // Parse both German and English questions
            questionsDE = parseQuestions(textDE);
            questionsEN = parseQuestions(textEN);
            
            // Create mapping between German and English answers for each question
            if (questionsDE.length !== questionsEN.length) {
                console.warn('⚠️ German and English question counts do not match!');
            }
            
            // Set current questions based on language
            questions = currentLanguage === 'de' ? questionsDE : questionsEN;
            
            // Shuffle options for current questions
            questions = questions.map(q => ({
                ...q,
                options: [...q.options].sort(() => Math.random() - 0.5)
            }));
            
            if (questions.length > 0) {
                console.log(`✅ Loaded ${questionsDE.length} German and ${questionsEN.length} English questions for final module`);
                // Don't load feedbacks for final module (as per user's note)
                // Don't call showStartScreen() here - it will be called after nickname is submitted
            } else {
                document.getElementById('quizContent').innerHTML = 
                    '<div class="error">Keine gültigen Fragen gefunden.</div>';
            }
        } catch (error) {
            console.error('❌ Error loading questions:', error);
            document.getElementById('quizContent').innerHTML = 
                `<div class="error">
                    <h3>Fehler beim Laden der Fragen</h3>
                    <p>${error.message}</p>
                    <p>Stelle sicher, dass questions/questions_final.tsv und questions/questions_eng_final.tsv existieren</p>
                </div>`;
        }
        return;
    }
    
    // Original logic for modules 7, 8, 9
    try {
        console.log(`📥 Loading questions from questions/questions${selectedModule}.tsv and questions/questions_eng${selectedModule}.tsv...`);
        
        // Load German questions (with cache-busting)
        const cacheBuster = `?v=${Date.now()}`;
        const responseDE = await fetch(`questions/questions${selectedModule}.tsv${cacheBuster}`);
        if (!responseDE.ok) {
            throw new Error(`Failed to load questions/questions${selectedModule}.tsv: ${responseDE.status} ${responseDE.statusText}`);
        }
        const tsvTextDE = await responseDE.text();
        if (!tsvTextDE || tsvTextDE.trim().length === 0) {
            throw new Error(`questions/questions${selectedModule}.tsv is empty`);
        }
        
        // Load English questions (with cache-busting)
        const responseEN = await fetch(`questions/questions_eng${selectedModule}.tsv${cacheBuster}`);
        if (!responseEN.ok) {
            throw new Error(`Failed to load questions/questions_eng${selectedModule}.tsv: ${responseEN.status} ${responseEN.statusText}`);
        }
        const tsvTextEN = await responseEN.text();
        if (!tsvTextEN || tsvTextEN.trim().length === 0) {
            throw new Error(`questions/questions_eng${selectedModule}.tsv is empty`);
        }
        
        // Parse German questions
        const linesDE = tsvTextDE.trim().split('\n').filter(line => line.trim());
        questionsDE = linesDE.map(line => {
            // Try semicolon first, then tab (for compatibility)
            let parts = line.split(';').map(part => part.trim());
            if (parts.length < 3) {
                parts = line.split('\t').map(part => part.trim());
            }
            
            // Check for PNG filename at the end
            let imagePath = null;
            const nonEmptyParts = parts.filter(p => p);
            const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
            const isPngFile = lastPart && /\.png$/i.test(lastPart);
            
            if (isPngFile) {
                imagePath = `pictures/questions_pictures/${lastPart}`;
                // Remove PNG from parts for processing
                parts = parts.filter(p => !/\.png$/i.test(p));
            }

            // Require at least question + 2 options (minimum 3 parts)
            if (parts.length >= 3) {
                const question = parts[0];
                let options = parts.slice(1).filter(p => p && p.trim());

                // Support multi-correct metadata for normal modules:
                // a trailing standalone number (1-9) means first N options are correct.
                let numCorrect = 1;
                const trailing = options[options.length - 1];
                const parsedNum = parseInt(trailing, 10);
                if (!isNaN(parsedNum) && trailing === String(parsedNum) && parsedNum > 0 && parsedNum < 10) {
                    numCorrect = parsedNum;
                    options = options.slice(0, -1);
                }

                if (options.length >= 2) {
                    const correctAnswers = options.slice(0, numCorrect);
                    if (correctAnswers.length === 0) return null;

                    return {
                        question: question,
                        correctAnswer: correctAnswers[0],
                        correctAnswers: correctAnswers,
                        options: options,
                        imagePath: imagePath
                    };
                }
            }
            return null;
        }).filter(q => q !== null);
        
        // Parse English questions
        const linesEN = tsvTextEN.trim().split('\n').filter(line => line.trim());
        questionsEN = linesEN.map(line => {
            // Try semicolon first, then tab (for compatibility)
            let parts = line.split(';').map(part => part.trim());
            if (parts.length < 3) {
                parts = line.split('\t').map(part => part.trim());
            }
            
            // Check for PNG filename at the end
            let imagePath = null;
            const nonEmptyParts = parts.filter(p => p);
            const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
            const isPngFile = lastPart && /\.png$/i.test(lastPart);
            
            if (isPngFile) {
                imagePath = `pictures/questions_pictures/${lastPart}`;
                // Remove PNG from parts for processing
                parts = parts.filter(p => !/\.png$/i.test(p));
            }

            // Require at least question + 2 options (minimum 3 parts)
            if (parts.length >= 3) {
                const question = parts[0];
                let options = parts.slice(1).filter(p => p && p.trim());

                // Support multi-correct metadata for normal modules:
                // a trailing standalone number (1-9) means first N options are correct.
                let numCorrect = 1;
                const trailing = options[options.length - 1];
                const parsedNum = parseInt(trailing, 10);
                if (!isNaN(parsedNum) && trailing === String(parsedNum) && parsedNum > 0 && parsedNum < 10) {
                    numCorrect = parsedNum;
                    options = options.slice(0, -1);
                }

                if (options.length >= 2) {
                    const correctAnswers = options.slice(0, numCorrect);
                    if (correctAnswers.length === 0) return null;

                    return {
                        question: question,
                        correctAnswer: correctAnswers[0],
                        correctAnswers: correctAnswers,
                        options: options,
                        imagePath: imagePath
                    };
                }
            }
            return null;
        }).filter(q => q !== null);
        
        // Create mapping between German and English answers for each question
        if (questionsDE.length !== questionsEN.length) {
            console.warn('⚠️ German and English question counts do not match!');
        }
        
        // Set current questions based on language
        questions = currentLanguage === 'de' ? questionsDE : questionsEN;
        
        // Shuffle options for current questions
        questions = questions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));
        
        if (questions.length > 0) {
            console.log(`✅ Loaded ${questionsDE.length} German and ${questionsEN.length} English questions`);
            await loadFeedbacks();
            // Don't call showStartScreen() here - it will be called after nickname is submitted
        } else {
            document.getElementById('quizContent').innerHTML = 
                '<div class="error">Keine gültigen Fragen gefunden. Bitte überprüfe das TSV-Format.<br>Format: Frage\trichtigeAntwort\tOption2\tOption3\tOption4</div>';
        }
    } catch (error) {
        console.error('❌ Error loading questions:', error);
        document.getElementById('quizContent').innerHTML = 
            `<div class="error">
                <h3>Fehler beim Laden der Fragen</h3>
                <p>${error.message}</p>
                <p>Stelle sicher, dass questions/questions${selectedModule}.tsv und questions/questions_eng${selectedModule}.tsv existieren</p>
            </div>`;
    }
}

// Update all UI text based on current language
function updateUIText() {
    // Update nickname screen
    const nicknameTitle = document.querySelector('.nickname-title');
    const nicknameInput = document.getElementById('nicknameInput');
    const nicknameSubmitBtn = document.getElementById('nicknameSubmitBtn');
    if (nicknameTitle) nicknameTitle.textContent = t('nicknameTitle');
    if (nicknameInput) nicknameInput.placeholder = t('nicknamePlaceholder');
    if (nicknameSubmitBtn) nicknameSubmitBtn.textContent = t('startQuiz');
    
    // Update start screen
    const loadingText = document.querySelector('.loading-text');
    const startBtn = document.getElementById('startBtn');
    if (loadingText) loadingText.textContent = t('preparingQuiz');
    if (startBtn) startBtn.textContent = t('letsGo');
    
    // Update credits
    const backLink = document.getElementById('backLink');
    const creditsLink = document.getElementById('creditsLink');
    const creditsLinkResults = document.getElementById('creditsLinkResults');
    if (backLink) backLink.textContent = t('backToQuiz');
    if (creditsLink) creditsLink.textContent = t('aiSystemsUsed');
    if (creditsLinkResults) creditsLinkResults.textContent = t('aiSystemsUsed');
    
    // Update credits screen (card back)
    const creditsScreen = document.getElementById('creditsScreen');
    if (creditsScreen) {
        const creditsTop = creditsScreen.querySelector('.credits-top');
        const creditsText = creditsScreen.querySelector('.credits-text');
        const creditsList = creditsScreen.querySelectorAll('.credits-list p');
        const creditsBottomText = creditsScreen.querySelector('.credits-bottom-text');
        const creditsLicenseLink = creditsScreen.querySelector('.credits-license-link');
        if (creditsTop) creditsTop.textContent = t('creditsTop');
        if (creditsText) creditsText.textContent = t('creditsDeveloped');
        if (creditsList && creditsList.length >= 2) {
            creditsList[0].textContent = t('creditsFrontend');
            creditsList[1].textContent = t('creditsBackend');
        }
        if (creditsBottomText) creditsBottomText.textContent = t('creditsBottom');
        if (creditsLicenseLink) {
            creditsLicenseLink.textContent = t('creditsLicense');
            creditsLicenseLink.href = t('creditsLicense');
        }
    }
    
    // Update battle animation (if visible)
    const sunriseText = document.querySelector('.sunrise-text');
    const nextToResultsBtn = document.getElementById('nextToResultsBtn');
    if (sunriseText && sunriseText.style.display !== 'none') {
        sunriseText.textContent = t('finalBattle');
    }
    if (nextToResultsBtn) nextToResultsBtn.textContent = t('viewResults');
    
    // Update celebration text (if exists)
    const celebrationText = document.querySelector('.celebration-text');
    if (celebrationText) {
        // Don't change if currently showing, only update the default
        if (!celebrationText.closest('.celebration').classList.contains('show')) {
            celebrationText.textContent = t('correct');
        }
    }
    
    // Update results screen
    const resultsTitle = document.querySelector('#results h2');
    const downloadBtn = document.getElementById('downloadBtn');
    if (resultsTitle) resultsTitle.textContent = t('quizComplete');
    if (downloadBtn) downloadBtn.textContent = t('downloadResults');
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Switch language between German and English
function switchLanguage(lang) {
    if (lang === currentLanguage) return;
    
    currentLanguage = lang;
    
    // Update active button
    document.getElementById('langBtnDE').classList.toggle('active', lang === 'de');
    document.getElementById('langBtnEN').classList.toggle('active', lang === 'en');
    
    // Get base questions for new language
    const baseQuestions = lang === 'de' ? questionsDE : questionsEN;
    
    // Apply existing shuffle orders to maintain consistency
    questions = baseQuestions.map((q, idx) => {
        if (questionShuffleOrder[idx]) {
            // Apply stored shuffle order
            const shuffleOrder = questionShuffleOrder[idx];
            const shuffledOptions = shuffleOrder.map(orderIdx => q.options[orderIdx]).filter(opt => opt !== undefined && opt !== null);
            return {
                ...q,
                options: shuffledOptions
            };
        } else {
            // If no shuffle order exists yet, create one and store it based on actual number of options
            const numOptions = q.options.length;
            const indices = Array.from({ length: numOptions }, (_, i) => i);
            const newShuffleOrder = indices.sort(() => Math.random() - 0.5);
            questionShuffleOrder[idx] = newShuffleOrder;
            const shuffledOptions = newShuffleOrder.map(orderIdx => q.options[orderIdx]).filter(opt => opt !== undefined && opt !== null);
            return {
                ...q,
                options: shuffledOptions
            };
        }
    });
    
    // Update feedbacks based on language
    feedbacks = lang === 'de' ? feedbacksDE : feedbacksEN;
    
    // Update all UI text
    updateUIText();
    
    // Check if we're on the results page
    const resultsPage = document.getElementById('results');
    if (resultsPage && resultsPage.style.display !== 'none') {
        // We're on the results page, refresh the results content
        showResults();
        return;
    }
    
    // Check if we're on the feedback page
    const feedbackContainer = document.querySelector('.feedback-container');
    if (feedbackContainer) {
        // We're on the feedback page, just update the feedback content
        showFeedback();
        return;
    }
    
    // If quiz has started and we're not on feedback or results page, refresh current question
    if (document.querySelector('.quiz-container').classList.contains('quiz-started')) {
        displayQuestion();
    }
}

function showStartScreen() {
    const startScreen = document.getElementById('startScreen');
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingBarFill = document.getElementById('loadingBarFill');
    const startBtn = document.getElementById('startBtn');
    
    // Reset
    loadingBarFill.style.width = '0%';
    startBtn.style.display = 'none';
    loadingContainer.style.display = 'block';
    
    // Animate loading bar over 2 seconds
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        loadingBarFill.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            // Hide loading, show start button
            setTimeout(() => {
                loadingContainer.style.display = 'none';
                startBtn.style.display = 'block';
            }, 300);
        }
    }, 40); // 40ms * 50 = 2000ms (2 seconds)
}

function startQuiz() {
    document.getElementById('startScreen').style.display = 'none';
    document.querySelector('.quiz-container').classList.add('quiz-started');
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showBattleAnimation();
        return;
    }
    
    // Get the base questions for current language
    const baseQuestions = currentLanguage === 'de' ? questionsDE : questionsEN;
    const baseQuestion = baseQuestions[currentQuestionIndex];
    
    // If we don't have a shuffle order for this question yet, create one
    if (!questionShuffleOrder[currentQuestionIndex]) {
        // Create a random shuffle order (array of indices) based on actual number of options
        const numOptions = baseQuestion.options.length;
        const indices = Array.from({ length: numOptions }, (_, i) => i);
        questionShuffleOrder[currentQuestionIndex] = indices.sort(() => Math.random() - 0.5);
    }
    
    // Apply the stored shuffle order to maintain consistency across languages
    const shuffleOrder = questionShuffleOrder[currentQuestionIndex];
    const shuffledOptions = shuffleOrder.map(idx => baseQuestion.options[idx]).filter(opt => opt !== undefined && opt !== null);
    
    // Update questions array with shuffled options
    questions = baseQuestions.map((q, idx) => {
        if (idx === currentQuestionIndex) {
            return {
                ...q,
                options: shuffledOptions
            };
        }
        return q;
    });
    
    // Show module title when displaying questions (NOT the feedback title)
    const titleElement = document.querySelector('.title');
    if (titleElement && selectedModule !== null && selectedModule !== undefined) {
        if (selectedModule === 'final') {
            titleElement.textContent = currentLanguage === 'de' ? 'Final Test' : 'Final Test';
        } else {
            // user requested: "just show Module N" for the question section
            titleElement.textContent = currentLanguage === 'de' ? `Modul ${selectedModule}` : `Module ${selectedModule}`;
        }
        titleElement.style.display = 'block';
    }
    
    // Start tracking time for this question
    questionStartTime = Date.now();
    
    answered = false;
    selectedAnswers = [];
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    // Update progress bar
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `${currentQuestionIndex + 1} / ${questions.length}`;
    
    // Unicorns are created when questions are answered correctly, not here
    
    // Create question HTML with multi-select
    const imageHTML = question.imagePath 
        ? `<div class="question-image-container">
            <img src="${question.imagePath}" alt="Question image" class="question-image" onerror="this.style.display='none'">
           </div>`
        : '';

    const shouldScrollMainArea =
        Boolean(question.imagePath) ||
        (Array.isArray(question.options) && question.options.length >= 5);
    
    const questionHTML = `
        <div class="question-container${shouldScrollMainArea ? ' question-container-scrollable' : ''}">
            ${imageHTML}
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                ${question.options.filter(opt => opt && opt.trim()).map((option, index) => 
                    `<button class="option-btn" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`
                ).join('')}
            </div>
            <button class="submit-btn" id="submitBtn" onclick="submitAnswer()">${t('submitAnswer')}</button>
        </div>
    `;
    
    document.getElementById('quizContent').innerHTML = questionHTML;
    
    // Add click listeners to options (toggle selection)
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (answered) return;
            toggleAnswer(this);
        });
    });

    // If option text is being clipped, make the option buttons taller for this question.
    adjustOptionHeightsForOverflow();
}

function toggleAnswer(button) {
    const answer = button.dataset.answer;
    const index = selectedAnswers.indexOf(answer);
    
    if (index > -1) {
        // Deselect
        selectedAnswers.splice(index, 1);
        button.classList.remove('selected');
    } else {
        // Select
        selectedAnswers.push(answer);
        button.classList.add('selected');
    }
}

// Helper function to convert English answer to German answer
function getGermanAnswer(englishAnswer, questionIndex) {
    if (currentLanguage === 'de') {
        return englishAnswer; // Already in German
    }
    
    // Find the corresponding German answer
    if (questionIndex >= questionsDE.length || questionIndex >= questionsEN.length) {
        return englishAnswer; // Fallback if index out of range
    }
    
    const questionDE = questionsDE[questionIndex];
    const questionEN = questionsEN[questionIndex];
    
    // Find the index of the English answer in the original (unshuffled) English question options
    // We need to match by the answer text, not by position since options are shuffled
    const enIndex = questionEN.options.indexOf(englishAnswer);
    if (enIndex === -1) {
        // If not found in original order, try to find by matching the correct answer
        // This handles the case where the answer might be the correct answer
        if (englishAnswer === questionEN.correctAnswer) {
            return questionDE.correctAnswer;
        }
        // Try to find by matching any option
        for (let i = 0; i < questionEN.options.length; i++) {
            if (questionEN.options[i] === englishAnswer) {
                return questionDE.options[i];
            }
        }
        return englishAnswer; // Fallback if not found
    }
    
    // Return the German answer at the same index (original order)
    return questionDE.options[enIndex];
}

function submitAnswer() {
    if (answered || selectedAnswers.length === 0) return;
    answered = true;
    
    // Calculate time spent on this question
    const timeSpent = Date.now() - questionStartTime;
    
    const question = questions[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;
    const allButtons = document.querySelectorAll('.option-btn');
    
    // Disable all buttons
    allButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    // Mark correct answer (always show it as correct)
    allButtons.forEach(btn => {
        if (btn.dataset.answer === correctAnswer) {
            btn.classList.add('correct');
        }
    });
    
    // Check if the answer is correct
    // Handle multiple correct answers if available
    const correctAnswers = question.correctAnswers || [correctAnswer];
    
    // Check if user selected all correct answers and no incorrect ones
    const selectedSet = new Set(selectedAnswers.map(a => a.trim()));
    const correctSet = new Set(correctAnswers.map(a => a.trim()));
    
    const hasAllCorrect = correctAnswers.every(ca => selectedSet.has(ca.trim()));
    const hasNoIncorrect = selectedAnswers.every(sa => correctSet.has(sa.trim()));
    const isCorrect = hasAllCorrect && hasNoIncorrect && selectedAnswers.length === correctAnswers.length;
    
    // Mark all correct answers
    allButtons.forEach(btn => {
        const btnAnswer = btn.dataset.answer.trim();
        if (correctAnswers.some(ca => ca.trim() === btnAnswer)) {
            btn.classList.add('correct');
        }
    });
    
    // Mark selected answers
    allButtons.forEach(btn => {
        if (selectedAnswers.includes(btn.dataset.answer)) {
            const btnAnswer = btn.dataset.answer.trim();
            if (correctAnswers.some(ca => ca.trim() === btnAnswer)) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
        }
    });
    
    // Convert to German for Firebase (always store German version)
    const questionDE = questionsDE[currentQuestionIndex];
    const selectedAnswersDE = selectedAnswers.map(ans => getGermanAnswer(ans, currentQuestionIndex));
    const correctAnswerDE = getGermanAnswer(correctAnswer, currentQuestionIndex);
    const questionTextDE = questionDE.question;
    
    // Store question data for Firebase (always in German)
    const questionInfo = {
        questionIndex: currentQuestionIndex,
        questionText: questionTextDE,
        selectedAnswers: selectedAnswersDE,
        correctAnswer: correctAnswerDE,
        isCorrect: isCorrect,
        timeSpent: timeSpent // in milliseconds
    };
    questionData.push(questionInfo);
    
    // Send data to Firebase (don't await to avoid blocking UI, but log result)
    sendQuestionDataToFirebase(questionInfo).then(success => {
        if (success) {
            console.log(`✅ Successfully saved question ${currentQuestionIndex + 1} to Firebase`);
        } else {
            console.warn(`⚠️ Failed to save question ${currentQuestionIndex + 1} to Firebase`);
        }
    }).catch(error => {
        console.error(`❌ Error saving question ${currentQuestionIndex + 1} to Firebase:`, error);
    });
    
    if (isCorrect) {
        score++;
        lastAnswerWasCorrect = true;
        showCelebration('correct');
        createUnicorn();
    } else {
        lastAnswerWasCorrect = false;
        showCelebration('wrong');
        createFrog();
    }
    
    // Show feedback after a short delay
    setTimeout(() => {
        showFeedback();
    }, 1500);
}

async function sendQuestionDataToFirebase(questionInfo) {
    // Comprehensive initialization check
    if (!window.firebaseDB || !window.firebaseAddDoc || !window.firebaseCollection) {
        console.error('❌ Firebase not initialized yet. Make sure Firebase SDK is loaded.');
        console.error('  - window.firebaseDB:', window.firebaseDB);
        console.error('  - window.firebaseAddDoc:', typeof window.firebaseAddDoc);
        console.error('  - window.firebaseCollection:', typeof window.firebaseCollection);
        console.error('💡 Run checkFirebaseStatus() in console to diagnose');
        firebaseFailureCount++;
        return false;
    }
    
    // Validate data before sending
    if (!userNickname || userNickname.trim() === '') {
        console.warn('⚠️ No nickname set, data may be incomplete');
    }
    
    try {
        const dataToSave = {
            nickname: userNickname || 'anonymous',
            questionIndex: questionInfo.questionIndex,
            questionText: questionInfo.questionText,
            selectedAnswers: questionInfo.selectedAnswers,
            correctAnswer: questionInfo.correctAnswer,
            isCorrect: questionInfo.isCorrect,
            timeSpent: questionInfo.timeSpent,
            timestamp: new Date()
        };
        
        // Add user_group if provided via URL parameter
        if (userGroup) {
            dataToSave.user_group = userGroup;
        }
        
        // Validate data structure
        if (typeof dataToSave.questionIndex !== 'number' || 
            typeof dataToSave.isCorrect !== 'boolean' ||
            !Array.isArray(dataToSave.selectedAnswers)) {
            throw new Error('Invalid data structure: ' + JSON.stringify(dataToSave));
        }
        
        // Use appropriate collection name based on module
        // For backward compatibility: modul 7 uses 'quizAnswers', others use 'modulX' or 'final'
        let collectionName;
        if (selectedModule === 'final') {
            collectionName = 'final';
        } else if (selectedModule === 7) {
            collectionName = 'quizAnswers'; // Backward compatibility
        } else {
            collectionName = `modul${selectedModule}`;
        }
        console.log('📤 Attempting to save to Firebase:');
        console.log('  - Collection:', collectionName);
        console.log('  - Data:', dataToSave);
        console.log('  - Timestamp:', new Date().toISOString());
        
        const startTime = Date.now();
        
        // Create collection reference
        const collectionRef = window.firebaseCollection(window.firebaseDB, collectionName);
        console.log('  - Collection reference created:', collectionRef);
        
        // Attempt to write document
        const docRef = await window.firebaseAddDoc(collectionRef, dataToSave);
        
        const duration = Date.now() - startTime;
        console.log('✅ Document successfully written!');
        console.log('  - Document ID:', docRef.id);
        console.log('  - Full path: ' + collectionName + '/' + docRef.id);
        console.log('  - Response time:', duration + 'ms');
        console.log('  - Document reference:', docRef);
        
        // Verify document reference
        if (!docRef || !docRef.id) {
            throw new Error('Document reference is invalid: ' + docRef);
        }
        
        firebaseSuccessCount++;
        return true;
        
    } catch (error) {
        console.error('❌ Error sending data to Firebase:');
        console.error('  - Error name:', error.name);
        console.error('  - Error code:', error.code);
        console.error('  - Error message:', error.message);
        console.error('  - Error stack:', error.stack);
        console.error('  - Full error object:', error);
        
        // Comprehensive error code handling
        const errorHandlers = {
            'permission-denied': () => {
                console.error('🔒 PERMISSION DENIED');
                console.error('  - Security rules are blocking the write');
                console.error('  - Check: https://console.firebase.google.com/project/enkis-fakahoot/firestore/rules');
                console.error('  - Run: firebase deploy --only firestore:rules');
                console.error('  - Current rules should allow: allow read, write: if true;');
            },
            'unavailable': () => {
                console.error('🌐 FIRESTORE UNAVAILABLE');
                console.error('  - Check your internet connection');
                console.error('  - Firestore service might be down');
                console.error('  - Check: https://status.firebase.google.com/');
            },
            'failed-precondition': () => {
                console.error('⚠️ FAILED PRECONDITION');
                console.error('  - Database might not be initialized');
                console.error('  - Check database mode in Firebase Console');
                console.error('  - Should be in Native mode, not Datastore mode');
            },
            'invalid-argument': () => {
                console.error('❌ INVALID ARGUMENT');
                console.error('  - Data format is incorrect');
                console.error('  - Check data structure and types');
            },
            'deadline-exceeded': () => {
                console.error('⏱️ DEADLINE EXCEEDED');
                console.error('  - Request timed out');
                console.error('  - Check network connection');
            },
            'not-found': () => {
                console.error('🔍 NOT FOUND');
                console.error('  - Collection or path not found');
            },
            'resource-exhausted': () => {
                console.error('📊 RESOURCE EXHAUSTED');
                console.error('  - Quota exceeded or too many requests');
                console.error('  - Check Firebase usage limits');
            },
            'unauthenticated': () => {
                console.error('🔐 UNAUTHENTICATED');
                console.error('  - Authentication required (unexpected for public writes)');
            }
        };
        
        if (error.code && errorHandlers[error.code]) {
            errorHandlers[error.code]();
        } else if (error.code) {
            console.error('⚠️ Unknown error code:', error.code);
        } else {
            console.error('⚠️ Error has no code property - might be a network or initialization error');
        }
        
        // Network debugging tips
        console.error('💡 Debugging tips:');
        console.error('  1. Open DevTools Network tab and filter by "firestore" or "googleapis"');
        console.error('  2. Look for failed requests (red status codes)');
        console.error('  3. Check request/response details');
        console.error('  4. Run testFirebase() in console to test connectivity');
        console.error('  5. Verify Firestore Console: https://console.firebase.google.com/project/enkis-fakahoot/firestore');
        
        firebaseFailureCount++;
        return false;
    }
}

function createUnicorn() {
    unicornCount++;
    const unicorn = document.createElement('div');
    unicorn.className = 'unicorn unicorn-spawning';
    unicorn.id = `unicorn-${unicornCount}`;
    unicorn.textContent = '🦄';
    
    // Start at center of screen (below celebration text)
    unicorn.style.position = 'fixed';
    unicorn.style.top = '50%';
    unicorn.style.left = '50%';
    unicorn.style.transform = 'translate(-50%, -50%)';
    unicorn.style.zIndex = '1'; // Below celebration text (1003) and celebration container (1000)
    unicorn.style.opacity = '0';
    unicorn.style.fontSize = 'clamp(5em, 12vw, 8em)';
    unicorn.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))';
    unicorn.style.animation = 'unicornSpawn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    
    document.body.appendChild(unicorn);
    
    // Calculate right bottom corner position (50pt from border)
    // Convert 50pt to vw/vh units (approximate: 1pt ≈ 1.33px, and we'll use calc for precision)
    // For simplicity, we'll use fixed pixel positioning: right: 50px, bottom: 50px
    // But we need to convert this to vw/vh for the animation system
    // Get viewport dimensions to calculate percentage
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Position 50px from right edge: (viewportWidth - 50) / viewportWidth * 100 = percentage from left
    // Position 50px from bottom edge: (viewportHeight - 50) / viewportHeight * 100 = percentage from top
    const rightBottomX = ((viewportWidth - 50) / viewportWidth) * 100; // Percentage from left
    const rightBottomY = ((viewportHeight - 50) / viewportHeight) * 100; // Percentage from top
    
    // Convert to the -50 to +50 range used by the animation system
    // The system uses -50 to +50 where 0 is center, so we need to convert
    const targetX = (rightBottomX + 30); // Convert 0-100 range to -50 to +50 range
    const targetY = (rightBottomY + 30);
    
    // Generate random movement points for after it reaches the corner
    const minPos = -50;
    const maxPos = 50;
    const endX = Math.random() * (maxPos - minPos) + minPos;
    const endY = Math.random() * (maxPos - minPos) + minPos;
    const mid1X = Math.random() * (maxPos - minPos) + minPos;
    const mid1Y = Math.random() * (maxPos - minPos) + minPos;
    const mid2X = Math.random() * (maxPos - minPos) + minPos;
    const mid2Y = Math.random() * (maxPos - minPos) + minPos;
    const randomDuration = Math.random() * 4 + 6; // 6s to 10s (faster)
    
    // After celebration, move to right bottom corner with confetti effect
    setTimeout(() => {
        // Create extra confetti for the move
        createUnicornConfetti();
        
        // Set background animation properties - always fly to right bottom corner
        unicorn.style.setProperty('--start-x', targetX + 'vw');
        unicorn.style.setProperty('--start-y', targetY + 'vh');
        unicorn.style.setProperty('--end-x', endX + 'vw');
        unicorn.style.setProperty('--end-y', endY + 'vh');
        unicorn.style.setProperty('--mid1-x', mid1X + 'vw');
        unicorn.style.setProperty('--mid1-y', mid1Y + 'vh');
        unicorn.style.setProperty('--mid2-x', mid2X + 'vw');
        unicorn.style.setProperty('--mid2-y', mid2Y + 'vh');
        unicorn.style.setProperty('--duration', randomDuration + 's');
        // Target is always right bottom corner
        const clampedTargetX = Math.max(-50, Math.min(50, targetX)) + 50; // Convert to 0-100 range
        const clampedTargetY = Math.max(-50, Math.min(50, targetY)) + 50; // Convert to 0-100 range
        unicorn.style.setProperty('--target-x', clampedTargetX + 'vw');
        unicorn.style.setProperty('--target-y', clampedTargetY + 'vh');
        
        // Move to background (right bottom corner)
        unicorn.classList.remove('unicorn-spawning');
        unicorn.style.animation = 'unicornMoveToBackground 1.5s ease-out forwards';
        
        // After moving to background, wait 1 second, then start the continuous movement
        setTimeout(() => {
            // Clear any CSS animation that might interfere
            unicorn.style.animation = 'none';
            unicorn.style.zIndex = '0';
            unicorn.style.opacity = '0.25';
            unicorn.style.filter = 'blur(0.5px)';
            unicorn.style.fontSize = 'clamp(4em, 10vw, 6em)';
            unicorn.style.top = 'auto';
            unicorn.style.left = 'auto';
            
            // Set initial position at right bottom corner (50pt from border)
            // Use transform system consistently - position at right bottom corner
            const clampedStartX = Math.max(-50, Math.min(50, targetX));
            const clampedStartY = Math.max(-50, Math.min(50, targetY));
            unicorn.style.transform = `translate(calc(${clampedStartX}vw - 50%), calc(${clampedStartY}vh - 50%)) rotate(0deg)`;
            
            // Wait 1 second after being added to the spot, then start moving animation
            setTimeout(() => {
                // Start JavaScript-based animation with boundary bouncing
                // Use targetX, targetY as starting point (right bottom corner)
                startUnicornAnimation(unicorn, targetX, targetY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, randomDuration);
            }, 1000); // Wait 1 second after being added
        }, 1500); // After animation completes
    }, 2000); // After celebration ends
}

function startUnicornAnimation(unicorn, startX, startY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, duration) {
    // Use full screen bounds to allow movement across entire screen (like frogs)
    const minX = -50; // Minimum X position (vw) - allows full left side
    const maxX = 50; // Maximum X position (vw) - allows full right side
    const minY = -50; // Minimum Y position (vh)
    const maxY = 50; // Maximum Y position (vh)
    
    // Clamp all positions to stay within bounds
    const clampX = (x) => Math.max(minX, Math.min(maxX, x));
    const clampY = (y) => Math.max(minY, Math.min(maxY, y));
    
    // Ensure all points are within bounds
    const points = [
        { x: clampX(startX), y: clampY(startY) },
        { x: clampX(mid1X), y: clampY(mid1Y) },
        { x: clampX(endX), y: clampY(endY) },
        { x: clampX(mid2X), y: clampY(mid2Y) }
    ];
    
    let currentPointIndex = 0;
    let progress = 0;
    const segmentDuration = duration / 4; // Each segment takes 1/4 of total duration
    let lastTime = null;
    let animationId = null;
    
    function animate(currentTime) {
        if (!document.body.contains(unicorn)) {
            if (animationId) cancelAnimationFrame(animationId);
            return; // Stop if unicorn removed
        }
        
        if (lastTime === null) {
            lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;
        
        const currentPoint = points[currentPointIndex];
        const nextPointIndex = (currentPointIndex + 1) % points.length;
        const nextPoint = points[nextPointIndex];
        
        // Use easing function for smooth movement
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Interpolate between current and next point
        let x = currentPoint.x + (nextPoint.x - currentPoint.x) * easedProgress;
        let y = currentPoint.y + (nextPoint.y - currentPoint.y) * easedProgress;
        const rotation = easedProgress * 90 + currentPointIndex * 90;
        
        // Clamp to bounds (full screen movement)
        x = Math.max(minX, Math.min(maxX, x));
        y = Math.max(minY, Math.min(maxY, y));
        
        unicorn.style.transform = `translate(calc(${x}vw - 50%), calc(${y}vh - 50%)) rotate(${rotation}deg)`;
        
        progress += deltaTime / segmentDuration;
        
        if (progress >= 1) {
            progress = 0;
            currentPointIndex = nextPointIndex;
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);
}

function createUnicornConfetti() {
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.fontSize = '1.5em';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1003';
        confetti.textContent = '🦄';
        
        const angle = (Math.PI * 2 * i) / 40;
        const distance = 250 + Math.random() * 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const delay = Math.random() * 0.3;
        
        confetti.style.setProperty('--x', x + 'px');
        confetti.style.setProperty('--y', y + 'px');
        confetti.style.animation = `unicornConfettiBurst 1.5s ease-out ${delay}s forwards`;
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => confetti.remove(), 2000);
    }
}

function createBattleConfetti(emoji, centerX, centerY) {
    // Create confetti burst at the battle center
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        confetti.style.fontSize = '1.2em';
        confetti.style.pointerEvents = 'none';
                        confetti.style.zIndex = '100'; // Lower than victory winner
        confetti.style.transform = 'translate(-50%, -50%)';
        confetti.textContent = emoji;
        
        const angle = (Math.PI * 2 * i) / 20;
        const distance = 100 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const delay = Math.random() * 0.2;
        const duration = 1 + Math.random() * 0.5;
        
        confetti.style.setProperty('--x', x + 'px');
        confetti.style.setProperty('--y', y + 'px');
        confetti.style.animation = `unicornConfettiBurst ${duration}s ease-out ${delay}s forwards`;
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.remove();
            }
        }, (duration + delay) * 1000);
    }
}

function createFrog() {
    const frog = document.createElement('div');
    frog.className = 'unicorn unicorn-spawning';
    frog.id = `frog-${Date.now()}`;
    frog.textContent = '🐸';
    
    // Start at center of screen (below celebration text)
    frog.style.position = 'fixed';
    frog.style.top = '50%';
    frog.style.left = '50%';
    frog.style.transform = 'translate(-50%, -50%)';
    frog.style.zIndex = '1';
    frog.style.opacity = '0';
    frog.style.fontSize = 'clamp(5em, 12vw, 8em)';
    frog.style.filter = 'drop-shadow(0 0 20px rgba(139, 69, 19, 0.8))';
    frog.style.animation = 'unicornSpawn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    
    document.body.appendChild(frog);
    
    // Calculate right bottom corner position (50pt from border)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Position 50px from right edge: (viewportWidth - 50) / viewportWidth * 100 = percentage from left
    // Position 50px from bottom edge: (viewportHeight - 50) / viewportHeight * 100 = percentage from top
    const rightBottomX = ((viewportWidth - 50) / viewportWidth) * 100; // Percentage from left
    const rightBottomY = ((viewportHeight - 50) / viewportHeight) * 100; // Percentage from top
    
    // Convert to the -50 to +50 range used by the animation system
    const targetX = (rightBottomX - 50) * 2; // Convert 0-100 range to -50 to +50 range
    const targetY = (rightBottomY - 50) * 2;
    
    // Generate random movement points for after it reaches the corner
    const minPos = -50;
    const maxPos = 50;
    const endX = Math.random() * (maxPos - minPos) + minPos;
    const endY = Math.random() * (maxPos - minPos) + minPos;
    const mid1X = Math.random() * (maxPos - minPos) + minPos;
    const mid1Y = Math.random() * (maxPos - minPos) + minPos;
    const mid2X = Math.random() * (maxPos - minPos) + minPos;
    const mid2Y = Math.random() * (maxPos - minPos) + minPos;
    const randomDuration = Math.random() * 4 + 6;
    
    // After celebration, move to right bottom corner with frog confetti effect
    setTimeout(() => {
        // Create frog confetti for the move
        createFrogConfetti();
        
        // Set background animation properties - always fly to right bottom corner
        frog.style.setProperty('--start-x', targetX + 'vw');
        frog.style.setProperty('--start-y', targetY + 'vh');
        frog.style.setProperty('--end-x', endX + 'vw');
        frog.style.setProperty('--end-y', endY + 'vh');
        frog.style.setProperty('--mid1-x', mid1X + 'vw');
        frog.style.setProperty('--mid1-y', mid1Y + 'vh');
        frog.style.setProperty('--mid2-x', mid2X + 'vw');
        frog.style.setProperty('--mid2-y', mid2Y + 'vh');
        frog.style.setProperty('--duration', randomDuration + 's');
        // Target is always right bottom corner
        const clampedTargetX = Math.max(-50, Math.min(50, targetX)) + 50; // Convert to 0-100 range
        const clampedTargetY = Math.max(-50, Math.min(50, targetY)) + 50; // Convert to 0-100 range
        frog.style.setProperty('--target-x', clampedTargetX + 'vw');
        frog.style.setProperty('--target-y', clampedTargetY + 'vh');
        
        // Move to background (right bottom corner)
        frog.classList.remove('unicorn-spawning');
        frog.style.animation = 'unicornMoveToBackground 1.5s ease-out forwards';
        
        // After moving to background, wait 1 second, then start the continuous movement
        setTimeout(() => {
            frog.style.animation = 'none';
            frog.style.zIndex = '0';
            frog.style.opacity = '0.25';
            frog.style.filter = 'blur(0.5px)';
            frog.style.fontSize = 'clamp(4em, 10vw, 6em)';
            
            // Set initial position at right bottom corner (50pt from border)
            // Use transform system consistently - position at right bottom corner
            const clampedStartX = Math.max(-50, Math.min(50, targetX));
            const clampedStartY = Math.max(-50, Math.min(50, targetY));
            frog.style.transform = `translate(calc(${clampedStartX}vw - 50%), calc(${clampedStartY}vh - 50%)) rotate(0deg)`;
            
            // Wait 1 second after being added to the spot, then start moving animation
            setTimeout(() => {
                // Start JavaScript-based animation
                // Use targetX, targetY as starting point (right bottom corner)
                startUnicornAnimation(frog, targetX, targetY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, randomDuration);
            }, 1000); // Wait 1 second after being added
        }, 1500);
    }, 2000);
}

function createFrogConfetti() {
    for (let i = 0; i < 40; i++) {
        const frogConfetti = document.createElement('div');
        frogConfetti.style.position = 'fixed';
        frogConfetti.style.left = '50%';
        frogConfetti.style.top = '50%';
        frogConfetti.style.fontSize = '1.5em';
        frogConfetti.style.pointerEvents = 'none';
        frogConfetti.style.zIndex = '1003';
        frogConfetti.textContent = '🐸';
        
        const angle = (Math.PI * 2 * i) / 40;
        const distance = 250 + Math.random() * 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const delay = Math.random() * 0.3;
        
        frogConfetti.style.setProperty('--x', x + 'px');
        frogConfetti.style.setProperty('--y', y + 'px');
        frogConfetti.style.animation = `unicornConfettiBurst 1.5s ease-out ${delay}s forwards`;
        
        document.body.appendChild(frogConfetti);
        
        // Remove after animation
        setTimeout(() => frogConfetti.remove(), 2000);
    }
}

function showFeedback() {
    // Update the title to show feedback title above progress bar
    const titleElement = document.querySelector('.title');
    const feedback = feedbacks[currentQuestionIndex] || {
        title: 'Feedback',
        explanation: t('noFeedback'),
        source: ''
    };
    if (titleElement) {
        titleElement.textContent = feedback.title;
        titleElement.style.display = 'block';
    }
    
    const questionNumber = currentQuestionIndex + 1;
    // Try multiple image extensions (both lowercase and uppercase variants)
    const imageExtensions = ['png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG', 'svg', 'SVG', 'webp', 'WEBP', 'gif', 'GIF'];
    const baseImagePath = selectedModule === 'final' ? `pictures/final/q${questionNumber}` : `pictures/modul${selectedModule}/q${questionNumber}`;
    
    const feedbackHTML = `
        <div class="feedback-container">
            <div class="feedback-content-wrapper">
                <div class="feedback-image-container">
                    <div class="feedback-unicorn-fallback" id="unicornFallback${currentQuestionIndex}">🦄</div>
                    <img src="" alt="Feedback image" class="feedback-image" id="feedbackImg${currentQuestionIndex}" style="display: none;">
                </div>
                <div class="feedback-text-container">
                    <div class="feedback-explanation">${feedback.explanation}</div>
                    <div class="feedback-source">${feedback.source ? `${t('source')} ${feedback.source}` : ''}</div>
                </div>
            </div>
            <button class="next-btn" id="nextBtn" onclick="nextQuestion()">${t('nextQuestion')}</button>
        </div>
    `;
    
    document.getElementById('quizContent').innerHTML = feedbackHTML;
    
    // Try to load image with different extensions
    const img = document.getElementById(`feedbackImg${currentQuestionIndex}`);
    if (img) {
        let currentExtensionIndex = 0;
        let imageLoaded = false;
        
        function tryNextExtension() {
            if (imageLoaded) return; // Already found a working image
            
            if (currentExtensionIndex >= imageExtensions.length) {
                // All extensions failed, keep unicorn visible
                imageLoaded = false;
                return;
            }
            
            const extension = imageExtensions[currentExtensionIndex];
            // Add cache-busting parameter to force browser to check for new version
            const cacheBuster = `?v=${Date.now()}`;
            const testSrc = `${baseImagePath}.${extension}${cacheBuster}`;
            
            // Create a test image to check if it exists
            const testImg = new Image();
            testImg.onload = function() {
                if (!imageLoaded) {
                    imageLoaded = true;
                    // Use the same cache-busted URL for the actual image
                    img.src = testSrc;
                }
            };
            testImg.onerror = function() {
                currentExtensionIndex++;
                tryNextExtension();
            };
            testImg.src = testSrc;
        }
        
        // Also set up error handler for the actual img element as backup
        img.onerror = function() {
            if (!imageLoaded) {
                currentExtensionIndex++;
                tryNextExtension();
            }
        };
        
        img.onload = function() {
            // Image loaded successfully - hide unicorn and show image
            imageLoaded = true;
            const fallback = document.getElementById(`unicornFallback${currentQuestionIndex}`);
            if (fallback) {
                fallback.style.display = 'none';
            }
            this.style.display = 'block';
        };
        
        // Start trying extensions
        tryNextExtension();
    }
    
    // Start raining unicorns or frogs based on answer
    startFeedbackRain();
}

function startFeedbackRain() {
    const emoji = lastAnswerWasCorrect ? '🦄' : '🐸';
    const rainContainer = document.createElement('div');
    rainContainer.className = 'feedback-rain';
    rainContainer.style.position = 'fixed';
    rainContainer.style.top = '0';
    rainContainer.style.left = '0';
    rainContainer.style.width = '100%';
    rainContainer.style.height = '100%';
    rainContainer.style.pointerEvents = 'none';
    rainContainer.style.zIndex = '0';
    rainContainer.style.overflow = 'hidden';
    document.body.appendChild(rainContainer);
    
    function createRainDrop() {
        const drop = document.createElement('div');
        drop.textContent = emoji;
        drop.style.position = 'absolute';
        drop.style.fontSize = '1.5em';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.top = '-50px';
        drop.style.opacity = '0.3';
        drop.style.animation = `rainFall ${3 + Math.random() * 2}s linear forwards`;
        rainContainer.appendChild(drop);
        
        setTimeout(() => drop.remove(), 5000);
    }
    
    // Create rain drops continuously (twice as much - every 150ms instead of 300ms)
    const rainInterval = setInterval(() => {
        if (!document.body.contains(rainContainer)) {
            clearInterval(rainInterval);
            return;
        }
        createRainDrop();
    }, 150);
    
    // Store interval ID to clear it later
    rainContainer.dataset.intervalId = rainInterval;
}

function showCelebration(type = 'correct') {
    const celebration = document.getElementById('celebration');
    const celebrationText = celebration.querySelector('.celebration-text');
    
    if (type === 'wrong') {
        celebrationText.textContent = t('wrong');
        celebrationText.style.color = '#8b4513';
    } else {
        celebrationText.textContent = t('correct');
        celebrationText.style.color = '#4ecdc4';
    }
    
    celebration.classList.add('show');
    
    setTimeout(() => {
        celebration.classList.remove('show');
    }, 2000);
}

function nextQuestion() {
    // Stop creating new rain drops, but let existing ones finish falling
    const rainContainer = document.querySelector('.feedback-rain');
    if (rainContainer) {
        if (rainContainer.dataset.intervalId) {
            clearInterval(parseInt(rainContainer.dataset.intervalId));
        }
        // Don't remove the container immediately - let existing drops finish
        // The container will be removed when all drops are gone (they remove themselves after 5s)
        setTimeout(() => {
            if (rainContainer && document.body.contains(rainContainer)) {
                rainContainer.remove();
            }
        }, 6000); // Wait a bit longer than the longest drop animation (5s)
    }
    
    currentQuestionIndex++;
    displayQuestion();
}

function showBattleAnimation() {
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('battleAnimation').style.display = 'flex';
    
    // Update battle text
    const sunriseText = document.querySelector('.sunrise-text');
    if (sunriseText) {
        sunriseText.textContent = t('finalBattle');
    }
    
    const correctCount = score;
    const wrongCount = questions.length - score;
    
    // Sunrise animation
    setTimeout(() => {
        // Create unicorn army on the left
        const unicornArmy = document.getElementById('unicornArmy');
        unicornArmy.innerHTML = '';
        for (let i = 0; i < correctCount; i++) {
            const unicorn = document.createElement('div');
            unicorn.className = 'battle-unicorn';
            unicorn.textContent = '🦄';
            unicorn.style.animationDelay = `${i * 0.1}s`;
            unicornArmy.appendChild(unicorn);
        }
        
        // Create frog army on the right
        const frogArmy = document.getElementById('frogArmy');
        frogArmy.innerHTML = '';
        for (let i = 0; i < wrongCount; i++) {
            const frog = document.createElement('div');
            frog.className = 'battle-frog';
            frog.textContent = '🐸';
            frog.style.animationDelay = `${i * 0.1}s`;
            frogArmy.appendChild(frog);
        }
        
        // After spawn animation completes, keep static icons where they are
        // Wait for spawnIn animation (0.5s) plus delays for all icons to finish spawning
        // Calculate max delay: 0.5s (animation) + (max count * 0.1s delay) + buffer
        const maxCount = Math.max(correctCount, wrongCount);
        const spawnCompleteDelay = 500 + (maxCount * 100) + 200; // Animation + delays + buffer
        
        setTimeout(() => {
            // Freeze static icons in their current position - no movement, just stay where they spawned
            // Process unicorns and frogs separately to ensure both are handled correctly
            const unicornIcons = document.querySelectorAll('.battle-unicorn:not(.battle-chaos)');
            const frogIcons = document.querySelectorAll('.battle-frog:not(.battle-chaos)');
            
            // Process unicorns - move them to body to avoid parent container issues
            unicornIcons.forEach((el, index) => {
                setTimeout(() => {
                    // Check if element still exists
                    if (!el.parentElement) return;
                    
                    const rect = el.getBoundingClientRect();
                    const currentX = rect.left + rect.width / 2;
                    const currentY = rect.top + rect.height / 2;
                    
                    // Move to body to ensure it's not affected by parent container
                    document.body.appendChild(el);
                    
                    // Keep them exactly where they are - no movement, just stay there forever
                    el.style.position = 'fixed';
                    el.style.left = currentX + 'px';
                    el.style.top = currentY + 'px';
                    el.style.transform = 'translate(-50%, -50%)';
                    el.style.animation = 'none';
                    el.style.zIndex = '10';
                    el.style.willChange = 'auto';
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'none';
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.classList.add('battle-static');
                    el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                }, index * 10);
            });
            
            // Process frogs - move them to body to avoid parent container issues (same as unicorns)
            frogIcons.forEach((el, index) => {
                setTimeout(() => {
                    // Check if element still exists
                    if (!el.parentElement) return;
                    
                    const rect = el.getBoundingClientRect();
                    const currentX = rect.left + rect.width / 2;
                    const currentY = rect.top + rect.height / 2;
                    
                    // Move to body to ensure it's not affected by parent container
                    document.body.appendChild(el);
                    
                    el.style.position = 'fixed';
                    el.style.left = currentX + 'px';
                    el.style.top = currentY + 'px';
                    el.style.transform = 'translate(-50%, -50%)';
                    el.style.animation = 'none';
                    el.style.zIndex = '10';
                    el.style.willChange = 'auto';
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'none';
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.classList.add('battle-static');
                    el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                }, index * 10);
            });
            
            // Also set up a periodic check to ensure static icons stay visible
            // Check unicorns and frogs separately to ensure both are protected
            const protectStaticIcons = setInterval(() => {
                // Protect unicorns specifically
                document.querySelectorAll('.battle-unicorn:not(.battle-chaos)').forEach(el => {
                    el.style.opacity = '1';
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                    el.classList.add('battle-static');
                });
                
                // Protect frogs specifically
                document.querySelectorAll('.battle-frog:not(.battle-chaos)').forEach(el => {
                    el.style.opacity = '1';
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                    el.classList.add('battle-static');
                });
                
                // Also protect by battle-static class (double protection)
                document.querySelectorAll('.battle-static').forEach(el => {
                    el.style.opacity = '1';
                    el.style.display = 'block';
                    el.style.visibility = 'visible';
                    el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                });
            }, 50); // Check every 50ms (more frequent)
            
            // Stop the protection after battle animation completes
            setTimeout(() => {
                clearInterval(protectStaticIcons);
            }, 15000);
        }, spawnCompleteDelay);
        
        // Now create new rotating icons for the chaos animation (separate from static ones)
        setTimeout(() => {
                const battleAnimation = document.getElementById('battleAnimation');
                const animRect = battleAnimation.getBoundingClientRect();
                const centerX = animRect.left + animRect.width / 2;
                const centerY = animRect.top + animRect.height / 2;
                
                // Start confetti effect for rotating icons (alternating unicorn/frog every 0.4s)
                let confettiToggle = true; // true = unicorn, false = frog
                const confettiInterval = setInterval(() => {
                    const emoji = confettiToggle ? '🦄' : '🐸';
                    createBattleConfetti(emoji, centerX, centerY);
                    confettiToggle = !confettiToggle;
                }, 400);
                
                // Stop confetti after battle animation completes (store interval ID to clear later)
                setTimeout(() => {
                    clearInterval(confettiInterval);
                }, 5000); // Stop after 5 seconds
                
                // Create NEW rotating icons for the chaos animation
                // Create rotating unicorns (slightly to the left of center)
                for (let i = 0; i < correctCount; i++) {
                    const rotatingUnicorn = document.createElement('div');
                        rotatingUnicorn.className = 'battle-unicorn battle-chaos';
                        rotatingUnicorn.textContent = '🦄';
                        
                        // Position slightly to the left of center with random offset
                        // Use larger offsets to spread them out more
                        const leftOffset = -50 + Math.random() * 30; // -50 to -20px (left side)
                        const randomX = (Math.random() - 0.5) * 60; // Random -30 to +30px
                        const randomY = (Math.random() - 0.5) * 60; // Random -30 to +30px
                        
                        // Set position using inline styles - but don't override transform (let animation handle it)
                        const unicornLeft = centerX + leftOffset + randomX;
                        const unicornTop = centerY + randomY;
                        rotatingUnicorn.style.position = 'fixed';
                        rotatingUnicorn.style.left = unicornLeft + 'px';
                        rotatingUnicorn.style.top = unicornTop + 'px';
                        rotatingUnicorn.style.animationDelay = `${i * 0.05}s`;
                        rotatingUnicorn.style.zIndex = '50';
                        rotatingUnicorn.style.willChange = 'transform';
                        rotatingUnicorn.style.opacity = '1';
                        // Don't set transform here - let the CSS animation handle it
                        
                    // Set chaos direction (negative for left side)
                    rotatingUnicorn.style.setProperty('--chaos-x', '-1');
                    rotatingUnicorn.style.setProperty('--chaos-y', (Math.random() - 0.5) * 2);
                    
                    battleAnimation.appendChild(rotatingUnicorn);
                    
                    // Force reflow to ensure animation starts
                    void rotatingUnicorn.offsetHeight;
                }
                
                // Create NEW rotating frogs (slightly to the right of center)
                for (let i = 0; i < wrongCount; i++) {
                    const rotatingFrog = document.createElement('div');
                    rotatingFrog.className = 'battle-frog battle-chaos';
                    rotatingFrog.textContent = '🐸';
                    
                    // Position slightly to the right of center with random offset
                    // Use larger offsets to spread them out more
                    const rightOffset = 20 + Math.random() * 30; // 20 to 50px (right side)
                    const randomX = (Math.random() - 0.5) * 60; // Random -30 to +30px
                    const randomY = (Math.random() - 0.5) * 60; // Random -30 to +30px
                    
                    // Set position using inline styles - but don't override transform (let animation handle it)
                    const frogLeft = centerX + rightOffset + randomX;
                    const frogTop = centerY + randomY;
                    rotatingFrog.style.position = 'fixed';
                    rotatingFrog.style.left = frogLeft + 'px';
                    rotatingFrog.style.top = frogTop + 'px';
                    rotatingFrog.style.animationDelay = `${i * 0.05}s`;
                    rotatingFrog.style.zIndex = '50';
                    rotatingFrog.style.willChange = 'transform';
                    rotatingFrog.style.opacity = '1';
                    // Don't set transform here - let the CSS animation handle it
                    
                    // Set chaos direction (positive for right side)
                    rotatingFrog.style.setProperty('--chaos-x', '1');
                    rotatingFrog.style.setProperty('--chaos-y', (Math.random() - 0.5) * 2);
                    
                    battleAnimation.appendChild(rotatingFrog);
                    
                    // Force reflow to ensure animation starts
                    void rotatingFrog.offsetHeight;
                }
                
                // After chaos, some rotating units die (only the rotating ones, not the static ones)
                setTimeout(() => {
                    // Only select rotating units (those with battle-chaos class)
                    const allRotatingUnits = Array.from(document.querySelectorAll('.battle-unicorn.battle-chaos, .battle-frog.battle-chaos'));
                    // Randomly select some to die (about 30-50% of them)
                    const deathCount = Math.floor(allRotatingUnits.length * (0.3 + Math.random() * 0.2));
                    const shuffled = [...allRotatingUnits].sort(() => Math.random() - 0.5);
                    const deadUnits = shuffled.slice(0, deathCount);
                    
                    deadUnits.forEach((el, index) => {
                        // Random downward direction (between -60 and 60 degrees from vertical)
                        const angle = (Math.random() - 0.5) * 120; // -60 to 60 degrees
                        const angleRad = angle * Math.PI / 180;
                        el.style.setProperty('--death-x', Math.sin(angleRad));
                        el.style.setProperty('--death-y', Math.abs(Math.cos(angleRad))); // Always downward
                        
                        setTimeout(() => {
                            el.classList.remove('battle-chaos');
                            el.classList.add('battle-dead');
                        }, index * 50);
                    });
                    
                    // Show winner slowly fading in after deaths, and fade out remaining rotating units
                    setTimeout(() => {
                        const winner = correctCount > wrongCount ? 'unicorn' : wrongCount > correctCount ? 'frog' : 'tie';
                        const winnerEmoji = document.getElementById('winnerEmoji');
                        const winnerText = document.getElementById('winnerText');
                        
                        if (winner === 'unicorn') {
                            winnerEmoji.textContent = '🦄';
                            winnerText.textContent = t('unicornsWin');
                        } else if (winner === 'frog') {
                            winnerEmoji.textContent = '🐸';
                            winnerText.textContent = t('frogsWin');
                        } else {
                            winnerEmoji.textContent = '🤝';
                            winnerText.textContent = t('tie');
                        }
                        
                        // First, protect ALL static icons - make absolutely sure they stay visible
                        // Process unicorns and frogs separately to ensure both are protected
                        
                        // Protect unicorns specifically
                        document.querySelectorAll('.battle-unicorn:not(.battle-chaos)').forEach((el) => {
                            el.style.opacity = '1';
                            el.style.animation = 'none';
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                            el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                            el.classList.add('battle-static');
                            void el.offsetHeight; // Force re-render
                        });
                        
                        // Protect frogs specifically
                        document.querySelectorAll('.battle-frog:not(.battle-chaos)').forEach((el) => {
                            el.style.opacity = '1';
                            el.style.animation = 'none';
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                            el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                            el.classList.add('battle-static');
                            void el.offsetHeight; // Force re-render
                        });
                        
                        // Also protect by class name (triple protection)
                        document.querySelectorAll('.battle-static').forEach((el) => {
                            el.style.opacity = '1';
                            el.style.animation = 'none';
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                            el.classList.remove('battle-fade-out', 'battle-dead', 'battle-chaos');
                        });
                        
                        // Now fade out ONLY rotating units (those with battle-chaos class)
                        document.querySelectorAll('.battle-unicorn.battle-chaos, .battle-frog.battle-chaos').forEach(el => {
                            // Double check it's not a static icon
                            if (!el.classList.contains('battle-static')) {
                                el.classList.add('battle-fade-out');
                            }
                        });
                        
                        // Show winner with high z-index to be above confetti
                        // Move it to body to escape battle-animation stacking context
                        const victoryWinner = document.getElementById('victoryWinner');
                        const battleAnimation = document.getElementById('battleAnimation');
                        const animRect = battleAnimation.getBoundingClientRect();
                        const centerX = animRect.left + animRect.width / 2;
                        const centerY = animRect.top + animRect.height / 2;
                        
                        // Clone and append to body to escape stacking context
                        victoryWinner.style.display = 'block';
                        victoryWinner.style.position = 'fixed';
                        victoryWinner.style.zIndex = '10000'; // Very high z-index
                        victoryWinner.style.top = centerY + 'px';
                        victoryWinner.style.left = centerX + 'px';
                        victoryWinner.style.transform = 'translate(-50%, -50%)';
                        victoryWinner.style.pointerEvents = 'auto';
                        
                        // Show next button
                        setTimeout(() => {
                            document.getElementById('nextToResultsBtn').style.display = 'block';
                        }, 2000);
                    }, 1500);
                }, 2000);
            }, 500); // Small delay after creating rotating icons
    }, 3000);
}

function skipBattle() {
    // Immediately skip to results
    showResults();
}

function showResults() {
    // Hide battle animation
    document.getElementById('battleAnimation').style.display = 'none';
    
    // Remove all static battle army icons (unicorns and frogs from the final battle)
    document.querySelectorAll('.battle-static, .battle-unicorn:not(.battle-chaos), .battle-frog:not(.battle-chaos)').forEach(el => {
        el.remove();
    });
    
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';
    
    // Determine Firebase status message
    const totalAttempts = firebaseSuccessCount + firebaseFailureCount;
    const allSuccessful = firebaseFailureCount === 0 && firebaseSuccessCount > 0;
    const noAttempts = totalAttempts === 0;
    
    let firebaseMessage = '';
    if (noAttempts) {
        firebaseMessage = t('firebaseNoData');
    } else if (allSuccessful) {
        firebaseMessage = t('firebaseAllSuccess', firebaseSuccessCount);
    } else if (firebaseSuccessCount > 0) {
        firebaseMessage = t('firebasePartial', firebaseSuccessCount, firebaseFailureCount);
    } else {
        firebaseMessage = t('firebaseAllFailed', firebaseFailureCount);
    }
    
    console.log('📊 Firebase Summary:', {
        successful: firebaseSuccessCount,
        failed: firebaseFailureCount,
        total: totalAttempts,
        allSuccessful: allSuccessful
    });
    
    // Update title to show "Quiz abgeschlossen" above progress bar
    const titleElement = document.querySelector('.title');
    if (titleElement) {
        titleElement.textContent = t('quizComplete');
        titleElement.style.display = 'block';
    }
    
    document.getElementById('scoreDisplay').innerHTML = `
        <div class="score-emoji">${emoji}</div>
        <div class="score-text">${t('youScored', score, questions.length)}</div>
        <div class="score-percentage">${percentage}%</div>
        <div class="firebase-message">${firebaseMessage}</div>
        <div class="firebase-details" style="margin-top: 10px; font-size: 0.65em; color: #666;">
            ${allSuccessful ? 
                `<div>${t('firebaseAllSuccessMessage')}</div>` : 
                `<div>${t('firebaseNotAllSuccessMessage')}</div>`
            }
        </div>
    `;
    document.getElementById('results').style.display = 'block';
    
    // Update progress to 100%
    document.getElementById('progressFill').style.width = '100%';
}

function downloadResults() {
    // Prepare data for download
    const resultsData = {
        nickname: userNickname,
        totalScore: score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        firebaseStatus: {
            successful: firebaseSuccessCount,
            failed: firebaseFailureCount,
            allSuccessful: firebaseFailureCount === 0 && firebaseSuccessCount > 0
        },
        questions: questionData.map(q => ({
            questionIndex: q.questionIndex,
            questionText: q.questionText,
            selectedAnswers: q.selectedAnswers,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect,
            timeSpent: q.timeSpent,
            timeSpentSeconds: (q.timeSpent / 1000).toFixed(2)
        })),
        timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(resultsData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fakahoot-results-${userNickname}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Handle TSV file input
function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const tsvText = e.target.result;
            try {
                const lines = tsvText.trim().split('\n').filter(line => line.trim());
                
                questions = lines.map(line => {
                    const parts = line.split('\t').map(part => part.trim());
                    if (parts.length >= 5) {
                        return {
                            question: parts[0],
                            correctAnswer: parts[1],
                            options: [parts[1], parts[2], parts[3], parts[4]].sort(() => Math.random() - 0.5)
                        };
                    }
                    return null;
                }).filter(q => q !== null);
                
                if (questions.length > 0) {
                    currentQuestionIndex = 0;
                    score = 0;
                    answered = false;
                    document.getElementById('quizContent').style.display = 'block';
                    document.getElementById('results').style.display = 'none';
                    showStartScreen();
                }
            } catch (error) {
                console.error('Error parsing TSV file:', error);
                alert('Fehler beim Parsen der TSV-Datei. Bitte überprüfe das Format.');
            }
        };
        reader.readAsText(file);
    }
}

// Handle nickname submission
function handleNicknameSubmit() {
    const nicknameInput = document.getElementById('nicknameInput');
    const nickname = nicknameInput.value.trim();
    
    if (nickname === '') {
        alert(t('enterNickname'));
        return;
    }
    
    userNickname = nickname;
    questionData = []; // Reset question data
    
    // Hide card container (which contains nickname screen), show start screen
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
        cardContainer.style.display = 'none';
    }
    document.getElementById('startScreen').style.display = 'block';
    showStartScreen();
}

// Get URL parameter value
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Restart quiz
document.addEventListener('DOMContentLoaded', async () => {
    // Check for modul parameter in URL (supports 1-9 and 'final')
    const modulParam = getURLParameter('modul');
    const finalParam = getURLParameter('final');
    
    // Get user_group from URL parameter
    const userGroupParam = getURLParameter('user_group');
    if (userGroupParam) {
        userGroup = userGroupParam;
        console.log(`🔗 URL parameter detected: user_group=${userGroup}`);
    }
    
    // Get lang from URL parameter (defaults to 'de' if not specified)
    const langParam = getURLParameter('lang');
    if (langParam === 'en' || langParam === 'de') {
        currentLanguage = langParam;
        console.log(`🔗 URL parameter detected: lang=${langParam}`);
    }
    
    if (finalParam !== null) {
        console.log(`🔗 URL parameter detected: final`);
        // Automatically select the final module
        selectModule('final');
    } else if (modulParam) {
        // Support modules 0-10
        const moduleNumber = parseInt(modulParam);
        if (!isNaN(moduleNumber) && moduleNumber >= 0 && moduleNumber <= 10) {
            console.log(`🔗 URL parameter detected: modul=${moduleNumber}`);
            // Automatically select the module
            selectModule(moduleNumber);
        } else {
            console.warn(`⚠️ Invalid modul parameter: ${modulParam}. Must be 0-10.`);
            // Show module selection screen if invalid parameter
            document.getElementById('moduleSelectionScreen').style.display = 'block';
        }
    } else {
        // Show module selection screen if no valid parameter
        document.getElementById('moduleSelectionScreen').style.display = 'block';
    }
    
    // Initialize language toggle buttons based on currentLanguage (which may have been set by URL parameter)
    document.getElementById('langBtnDE').classList.toggle('active', currentLanguage === 'de');
    document.getElementById('langBtnEN').classList.toggle('active', currentLanguage === 'en');
    
    // Initialize UI text (including credits)
    updateUIText();
    
    // Add nickname submit handler
    document.getElementById('nicknameSubmitBtn').addEventListener('click', handleNicknameSubmit);
    document.getElementById('nicknameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNicknameSubmit();
        }
    });
    
    // Add start button handler
    document.getElementById('startBtn').addEventListener('click', startQuiz);
    
    // Reset function (can be called manually if needed)
    function resetQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        answered = false;
        unicornCount = 0;
        questionData = [];
        firebaseSuccessCount = 0;
        firebaseFailureCount = 0;
        
        // Remove all unicorns
        document.querySelectorAll('.unicorn').forEach(unicorn => {
            unicorn.remove();
        });
        
        // Show nickname screen again (reset card flip)
        const cardContainer = document.querySelector('.card-container');
        const cardInner = document.getElementById('cardInner');
        const nicknameScreen = document.getElementById('nicknameScreen');
        const creditsScreen = document.getElementById('creditsScreen');
        
        if (cardContainer) {
            cardContainer.style.display = 'block';
        }
        if (cardInner) {
            cardInner.classList.remove('flipped');
        }
        if (nicknameScreen) {
            nicknameScreen.style.display = 'flex';
        }
        if (creditsScreen) {
            creditsScreen.style.display = 'none';
        }
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('results').style.display = 'none';
        document.querySelector('.quiz-container').classList.remove('quiz-started');
        document.getElementById('nicknameInput').value = '';
    }
    
    // Make resetQuiz and downloadResults available globally
    window.resetQuiz = resetQuiz;
    window.downloadResults = downloadResults;
});

// Card flip functions
function flipToCredits() {
    const cardInner = document.getElementById('cardInner');
    const nicknameScreen = document.getElementById('nicknameScreen');
    const creditsScreen = document.getElementById('creditsScreen');
    const creditsLink = document.getElementById('creditsLink');
    
    cardInner.classList.add('flipped');
    nicknameScreen.style.display = 'none';
    creditsScreen.style.display = 'flex';
    
    // Hide the credits link when showing credits side
    if (creditsLink) {
        creditsLink.style.display = 'none';
    }
}

function flipToQuiz() {
    const cardInner = document.getElementById('cardInner');
    const nicknameScreen = document.getElementById('nicknameScreen');
    const creditsScreen = document.getElementById('creditsScreen');
    const creditsLink = document.getElementById('creditsLink');
    
    cardInner.classList.remove('flipped');
    creditsScreen.style.display = 'none';
    nicknameScreen.style.display = 'flex';
    
    // Show the credits link when showing nickname side
    if (creditsLink) {
        creditsLink.style.display = 'block';
    }
}

function showCreditsFromResults() {
    // Hide results and show credits in a modal-like overlay
    const results = document.getElementById('results');
    const quizContent = document.getElementById('quizContent');
    
    // Create credits overlay
    let creditsOverlay = document.getElementById('creditsOverlay');
    if (!creditsOverlay) {
        creditsOverlay = document.createElement('div');
        creditsOverlay.id = 'creditsOverlay';
        creditsOverlay.className = 'credits-overlay';
        document.querySelector('.quiz-container').appendChild(creditsOverlay);
    }
    
    // Update credits overlay content with current language
    creditsOverlay.innerHTML = `
        <div class="credits-overlay-content">
            <div class="credits-content">
                <p class="credits-top">${t('creditsTop')}</p>
                <p class="credits-text">${t('creditsDeveloped')}</p>
                <div class="credits-list">
                    <p>${t('creditsFrontend')}</p>
                    <p>${t('creditsBackend')}</p>
                </div>
                <div class="credits-bottom">
                    <p class="credits-bottom-text">${t('creditsBottom')}</p>
                    <a href="${t('creditsLicense')}" target="_blank" class="credits-license-link">${t('creditsLicense')}</a>
                </div>
            </div>
            <a href="#" class="back-link" onclick="event.preventDefault(); hideCreditsFromResults();">${t('backToQuiz')}</a>
        </div>
    `;
    
    creditsOverlay.style.display = 'flex';
}

function hideCreditsFromResults() {
    const creditsOverlay = document.getElementById('creditsOverlay');
    if (creditsOverlay) {
        creditsOverlay.style.display = 'none';
    }
}

// Fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Update fullscreen button icon based on fullscreen state
function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    
    if (isFullscreen) {
        // Show exit fullscreen icon
        fullscreenBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V5C8 6.10457 8.89543 7 10 7H14C15.1046 7 16 6.10457 16 5V3M8 21V19C8 17.8954 8.89543 17 10 17H14C15.1046 17 16 17.8954 16 19V21M3 8H5C6.10457 8 7 8.89543 7 10V14C7 15.1046 6.10457 16 5 16H3M21 8H19C17.8954 8 17 8.89543 17 10V14C17 15.1046 17.8954 16 19 16H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        // Show enter fullscreen icon
        fullscreenBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        fullscreenBtn.title = 'Toggle Fullscreen';
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

// Make functions globally available
window.selectModule = selectModule;
window.flipToCredits = flipToCredits;
window.flipToQuiz = flipToQuiz;
window.showCreditsFromResults = showCreditsFromResults;
window.hideCreditsFromResults = hideCreditsFromResults;
window.switchLanguage = switchLanguage;
window.toggleFullscreen = toggleFullscreen;
window.skipBattle = skipBattle;

