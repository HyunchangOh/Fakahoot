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
    
    // Generate random background positions (constrained to stay within bounds)
    // Account for unicorn size - keep center at least 10% from edges to ensure fully visible
    const minPos = -50;
    const maxPos = 50;
    const startX = Math.random() * (maxPos - minPos) + minPos;
    const startY = Math.random() * (maxPos - minPos) + minPos;
    const endX = Math.random() * (maxPos - minPos) + minPos;
    const endY = Math.random() * (maxPos - minPos) + minPos;
    const mid1X = Math.random() * (maxPos - minPos) + minPos;
    const mid1Y = Math.random() * (maxPos - minPos) + minPos;
    const mid2X = Math.random() * (maxPos - minPos) + minPos;
    const mid2Y = Math.random() * (maxPos - minPos) + minPos;
    const randomDuration = Math.random() * 4 + 6; // 6s to 10s (faster)
    
    // After celebration, move to background with confetti effect
    setTimeout(() => {
        // Create extra confetti for the move
        createUnicornConfetti();
        
        // Set background animation properties
        unicorn.style.setProperty('--start-x', startX + 'vw');
        unicorn.style.setProperty('--start-y', startY + 'vh');
        unicorn.style.setProperty('--end-x', endX + 'vw');
        unicorn.style.setProperty('--end-y', endY + 'vh');
        unicorn.style.setProperty('--mid1-x', mid1X + 'vw');
        unicorn.style.setProperty('--mid1-y', mid1Y + 'vh');
        unicorn.style.setProperty('--mid2-x', mid2X + 'vw');
        unicorn.style.setProperty('--mid2-y', mid2Y + 'vh');
        unicorn.style.setProperty('--duration', randomDuration + 's');
        // Ensure target position is always on-screen (clamp to 10-90%)
        const clampedTargetX = Math.max(10, Math.min(90, startX));
        const clampedTargetY = Math.max(10, Math.min(90, startY));
        unicorn.style.setProperty('--target-x', clampedTargetX + 'vw');
        unicorn.style.setProperty('--target-y', clampedTargetY + 'vh');
        
        // Move to background
        unicorn.classList.remove('unicorn-spawning');
        unicorn.style.animation = 'unicornMoveToBackground 1.5s ease-out forwards';
        
        // After moving to background, start the continuous movement with boundary checking
        setTimeout(() => {
            // Clear any CSS animation that might interfere
            unicorn.style.animation = 'none';
            unicorn.style.zIndex = '0';
            unicorn.style.opacity = '0.25';
            unicorn.style.filter = 'blur(0.5px)';
            unicorn.style.fontSize = 'clamp(4em, 10vw, 6em)';
            unicorn.style.top = 'auto';
            unicorn.style.left = 'auto';
            
            // Set initial position based on target (clamped to ensure on-screen)
            const clampedStartX = Math.max(10, Math.min(90, startX));
            const clampedStartY = Math.max(10, Math.min(90, startY));
            unicorn.style.transform = `translate(calc(${clampedStartX}vw - 50%), calc(${clampedStartY}vh - 50%)) rotate(0deg)`;
            
            // Start JavaScript-based animation with boundary bouncing
            startUnicornAnimation(unicorn, startX, startY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, randomDuration);
        }, 1500);
    }, 2000); // After celebration ends
}

function startUnicornAnimation(unicorn, startX, startY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, duration) {
    // Use same bounds as generation (10-90%) to ensure consistency
    const minX = -60; // Minimum X position (vw) - account for unicorn size
    const maxX = 60; // Maximum X position (vw)
    const minY = -60; // Minimum Y position (vh)
    const maxY = 60; // Maximum Y position (vh)
    
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
        
        // ALWAYS clamp to ensure never goes off-screen
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
    const celebration = document.getElementById('celebration');
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'unicorn-confetti';
        confetti.style.position = 'fixed';
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.width = '12px';
        confetti.style.height = '12px';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1003';
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = (Math.PI * 2 * i) / 20;
        const distance = 200 + Math.random() * 100;
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
        // Create a unicorn that appears with celebration, then moves to background
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

