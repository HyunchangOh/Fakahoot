let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;
let unicornCount = 0;

// Parse CSV file - uses embedded data first (works immediately), then tries to update from external file
function loadQuestions() {
    // First, load from embedded CSV data (always works)
    const csvElement = document.getElementById('questionsData');
    let csvText = '';
    
    if (csvElement) {
        csvText = csvElement.textContent || csvElement.innerText;
    }
    
    // Parse the CSV data
    if (csvText) {
        try {
            const lines = csvText.trim().split('\n').filter(line => line.trim());
            
            questions = lines.map(line => {
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 5) {
                    return {
                        question: parts[0],
                        correctAnswer: parts[1],
                        options: [parts[1], parts[2], parts[3], parts[4]].sort(() => Math.random() - 0.5) // Shuffle options
                    };
                }
                return null;
            }).filter(q => q !== null);
            
            if (questions.length > 0) {
                showStartScreen();
                
                // Try to load from external file in the background (if running on a server)
                // This silently updates if successful, but doesn't show errors if it fails
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'questions.csv', true);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && (xhr.status === 0 || xhr.status === 200)) {
                            const externalCsv = xhr.responseText;
                            if (externalCsv && externalCsv.trim()) {
                                const externalLines = externalCsv.trim().split('\n').filter(line => line.trim());
                                const externalQuestions = externalLines.map(line => {
                                    const parts = line.split(',').map(part => part.trim());
                                    if (parts.length >= 5) {
                                        return {
                                            question: parts[0],
                                            correctAnswer: parts[1],
                                            options: [parts[1], parts[2], parts[3], parts[4]].sort(() => Math.random() - 0.5)
                                        };
                                    }
                                    return null;
                                }).filter(q => q !== null);
                                
                                if (externalQuestions.length > 0) {
                                    questions = externalQuestions;
                                    // Reset quiz if already started
                                    if (currentQuestionIndex > 0) {
                                        currentQuestionIndex = 0;
                                        score = 0;
                                    }
                                    showStartScreen();
                                }
                            }
                        }
                    };
                    xhr.send();
                } catch (e) {
                    // Silently fail - embedded data is already loaded
                }
            } else {
                document.getElementById('quizContent').innerHTML = 
                    '<div class="error">No valid questions found. Please check the CSV format.</div>';
            }
        } catch (error) {
            console.error('Error parsing questions:', error);
            document.getElementById('quizContent').innerHTML = 
                '<div class="error">Error parsing questions. Please check the CSV format.</div>';
        }
    } else {
        document.getElementById('quizContent').innerHTML = 
            '<div class="error">Error loading questions. Please make sure questions.csv data is embedded in the HTML.</div>';
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
        showResults();
        return;
    }
    
    answered = false;
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    // Update progress bar
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `${currentQuestionIndex + 1} / ${questions.length}`;
    
    // Unicorns are created when questions are answered correctly, not here
    
    // Create question HTML
    const questionHTML = `
        <div class="question-container">
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                ${question.options.map((option, index) => 
                    `<button class="option-btn" data-answer="${option}">${option}</button>`
                ).join('')}
            </div>
            <button class="next-btn" id="nextBtn" onclick="nextQuestion()">Next Question →</button>
        </div>
    `;
    
    document.getElementById('quizContent').innerHTML = questionHTML;
    
    // Add click listeners to options
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (answered) return;
            handleAnswer(this);
        });
    });
}

function createUnicorn() {
    unicornCount++;
    const unicorn = document.createElement('div');
    unicorn.className = 'unicorn';
    unicorn.id = `unicorn-${unicornCount}`;
    unicorn.textContent = '🦄';
    
    // Generate random start and end positions (viewport-based)
    const startX = Math.random() * 80 + 10; // 10% to 90%
    const startY = Math.random() * 80 + 10;
    const endX = Math.random() * 80 + 10;
    const endY = Math.random() * 80 + 10;
    const mid1X = Math.random() * 80 + 10;
    const mid1Y = Math.random() * 80 + 10;
    const mid2X = Math.random() * 80 + 10;
    const mid2Y = Math.random() * 80 + 10;
    const randomDuration = Math.random() * 4 + 6; // 6s to 10s (faster)
    
    unicorn.style.setProperty('--start-x', startX + 'vw');
    unicorn.style.setProperty('--start-y', startY + 'vh');
    unicorn.style.setProperty('--end-x', endX + 'vw');
    unicorn.style.setProperty('--end-y', endY + 'vh');
    unicorn.style.setProperty('--mid1-x', mid1X + 'vw');
    unicorn.style.setProperty('--mid1-y', mid1Y + 'vh');
    unicorn.style.setProperty('--mid2-x', mid2X + 'vw');
    unicorn.style.setProperty('--mid2-y', mid2Y + 'vh');
    unicorn.style.setProperty('--duration', randomDuration + 's');
    
    document.body.appendChild(unicorn);
    
    // Start animation
    setTimeout(() => {
        unicorn.style.animation = 'unicornMove var(--duration) ease-in-out infinite';
    }, 10);
}

function handleAnswer(button) {
    if (answered) return;
    answered = true;
    
    const selectedAnswer = button.dataset.answer;
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;
    const allButtons = document.querySelectorAll('.option-btn');
    
    // Disable all buttons
    allButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    // Mark correct answer
    allButtons.forEach(btn => {
        if (btn.dataset.answer === correctAnswer) {
            btn.classList.add('correct');
        }
    });
    
    if (selectedAnswer === correctAnswer) {
        score++;
        button.classList.add('correct');
        showCelebration();
        // Create a unicorn for each correct answer!
        createUnicorn();
    } else {
        button.classList.add('incorrect');
    }
    
    // Show next button
    setTimeout(() => {
        document.getElementById('nextBtn').classList.add('show');
    }, 500);
}

function showCelebration() {
    const celebration = document.getElementById('celebration');
    celebration.classList.add('show');
    
    setTimeout(() => {
        celebration.classList.remove('show');
    }, 2000);
}

function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

function showResults() {
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';
    
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('scoreDisplay').innerHTML = `
        ${emoji} You scored ${score} out of ${questions.length}! ${emoji}<br>
        <span style="font-size: 0.6em; color: #666;">That's ${percentage}%!</span>
    `;
    document.getElementById('results').style.display = 'block';
    
    // Update progress to 100%
    document.getElementById('progressFill').style.width = '100%';
}

// Handle CSV file input
function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            try {
                const lines = csvText.trim().split('\n').filter(line => line.trim());
                
                questions = lines.map(line => {
                    const parts = line.split(',').map(part => part.trim());
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
                console.error('Error parsing CSV file:', error);
                alert('Error parsing CSV file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }
}

// Restart quiz
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    
    // Add start button handler
    document.getElementById('startBtn').addEventListener('click', startQuiz);
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        answered = false;
        unicornCount = 0;
        
        // Remove all unicorns
        document.querySelectorAll('.unicorn').forEach(unicorn => {
            unicorn.remove();
        });
        
        document.querySelector('.quiz-container').classList.remove('quiz-started');
        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('results').style.display = 'none';
        showStartScreen();
    });
});

