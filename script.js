let questions = [];
let feedbacks = [];
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

// Load feedback data from CSV file
async function loadFeedbacks() {
    try {
        const response = await fetch('feedback.csv');
        if (!response.ok) {
            throw new Error(`Failed to load feedback.csv: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (csvText) {
            const lines = csvText.trim().split('\n').filter(line => line.trim());
            
            feedbacks = lines.map(line => {
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 3) {
                    return {
                        title: parts[0],
                        explanation: parts[1],
                        source: parts[2] || ''
                    };
                }
                return null;
            }).filter(f => f !== null);
            
            console.log(`✅ Loaded ${feedbacks.length} feedback entries`);
        }
    } catch (error) {
        console.error('Error loading feedback.csv:', error);
        console.warn('Continuing without feedback data...');
        feedbacks = []; // Set empty array so quiz can continue
    }
}

// Load questions from CSV file
async function loadQuestions() {
    try {
        console.log('📥 Loading questions from questions.csv...');
        const response = await fetch('questions.csv');
        
        if (!response.ok) {
            throw new Error(`Failed to load questions.csv: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('questions.csv is empty');
        }
        
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
            console.log(`✅ Loaded ${questions.length} questions`);
            await loadFeedbacks();
            showStartScreen();
        } else {
            document.getElementById('quizContent').innerHTML = 
                '<div class="error">No valid questions found in questions.csv. Please check the CSV format.<br>Format: question, correctAnswer, option2, option3, option4</div>';
        }
    } catch (error) {
        console.error('❌ Error loading questions:', error);
        document.getElementById('quizContent').innerHTML = 
            `<div class="error">
                <h3>Error loading questions.csv</h3>
                <p>${error.message}</p>
                <p>Make sure questions.csv exists in the same directory as index.html</p>
            </div>`;
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
    
    // Show "Fakahoot Quiz" title when displaying questions
    const titleElement = document.querySelector('.title');
    if (titleElement) {
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
    const questionHTML = `
        <div class="question-container">
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                ${question.options.map((option, index) => 
                    `<button class="option-btn" data-answer="${option}">${option}</button>`
                ).join('')}
            </div>
            <button class="submit-btn" id="submitBtn" onclick="submitAnswer()">Submit Answer ✓</button>
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
    
    // Mark correct answer
    allButtons.forEach(btn => {
        if (btn.dataset.answer === correctAnswer) {
            btn.classList.add('correct');
        }
    });
    
    // Check if any selected answer is correct
    const isCorrect = selectedAnswers.includes(correctAnswer);
    
    // Mark selected answers
    allButtons.forEach(btn => {
        if (selectedAnswers.includes(btn.dataset.answer)) {
            if (btn.dataset.answer === correctAnswer) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
        }
    });
    
    // Store question data for Firebase
    const questionInfo = {
        questionIndex: currentQuestionIndex,
        questionText: question.question,
        selectedAnswers: [...selectedAnswers],
        correctAnswer: correctAnswer,
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
        createPoop();
    }
    
    // Show feedback after a short delay
    setTimeout(() => {
        showFeedback();
    }, 1500);
}

async function sendQuestionDataToFirebase(questionInfo) {
    if (!window.firebaseDB || !window.firebaseAddDoc || !window.firebaseCollection) {
        console.error('❌ Firebase not initialized yet. Make sure Firebase SDK is loaded.');
        firebaseFailureCount++;
        return false;
    }
    
    try {
        const dataToSave = {
            nickname: userNickname,
            questionIndex: questionInfo.questionIndex,
            questionText: questionInfo.questionText,
            selectedAnswers: questionInfo.selectedAnswers,
            correctAnswer: questionInfo.correctAnswer,
            isCorrect: questionInfo.isCorrect,
            timeSpent: questionInfo.timeSpent,
            timestamp: new Date()
        };
        
        console.log('📤 Attempting to save to Firebase:', dataToSave);
        
        const docRef = await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDB, 'quizAnswers'), 
            dataToSave
        );
        
        console.log('✅ Document written with ID:', docRef.id);
        firebaseSuccessCount++;
        return true;
    } catch (error) {
        console.error('❌ Error sending data to Firebase:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // Log specific permission errors
        if (error.code === 'permission-denied') {
            console.error('🔒 Permission denied! Make sure Firestore security rules allow writes to quizAnswers collection.');
            console.error('💡 Run: firebase deploy --only firestore:rules');
        } else if (error.code === 'unavailable') {
            console.error('🌐 Firestore is unavailable. Check your internet connection.');
        } else if (error.code === 'failed-precondition') {
            console.error('⚠️ Firestore database might not be initialized. Check Firebase Console.');
        }
        
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

function createPoop() {
    const poop = document.createElement('div');
    poop.className = 'unicorn unicorn-spawning';
    poop.id = `poop-${Date.now()}`;
    poop.textContent = '💩';
    
    // Start at center of screen (below celebration text)
    poop.style.position = 'fixed';
    poop.style.top = '50%';
    poop.style.left = '50%';
    poop.style.transform = 'translate(-50%, -50%)';
    poop.style.zIndex = '1';
    poop.style.opacity = '0';
    poop.style.fontSize = 'clamp(5em, 12vw, 8em)';
    poop.style.filter = 'drop-shadow(0 0 20px rgba(139, 69, 19, 0.8))';
    poop.style.animation = 'unicornSpawn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    
    document.body.appendChild(poop);
    
    // Generate random background positions
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
    const randomDuration = Math.random() * 4 + 6;
    
    // After celebration, move to background with poop confetti effect
    setTimeout(() => {
        // Create poop confetti for the move
        createPoopConfetti();
        
        // Set background animation properties
        poop.style.setProperty('--start-x', startX + 'vw');
        poop.style.setProperty('--start-y', startY + 'vh');
        poop.style.setProperty('--end-x', endX + 'vw');
        poop.style.setProperty('--end-y', endY + 'vh');
        poop.style.setProperty('--mid1-x', mid1X + 'vw');
        poop.style.setProperty('--mid1-y', mid1Y + 'vh');
        poop.style.setProperty('--mid2-x', mid2X + 'vw');
        poop.style.setProperty('--mid2-y', mid2Y + 'vh');
        poop.style.setProperty('--duration', randomDuration + 's');
        const clampedTargetX = Math.max(10, Math.min(90, startX));
        const clampedTargetY = Math.max(10, Math.min(90, startY));
        poop.style.setProperty('--target-x', clampedTargetX + 'vw');
        poop.style.setProperty('--target-y', clampedTargetY + 'vh');
        
        // Move to background
        poop.classList.remove('unicorn-spawning');
        poop.style.animation = 'unicornMoveToBackground 1.5s ease-out forwards';
        
        // After moving to background, start the continuous movement
        setTimeout(() => {
            poop.style.animation = 'none';
            poop.style.zIndex = '0';
            poop.style.opacity = '0.25';
            poop.style.filter = 'blur(0.5px)';
            poop.style.fontSize = 'clamp(4em, 10vw, 6em)';
            poop.style.top = 'auto';
            poop.style.left = 'auto';
            
            const clampedStartX = Math.max(10, Math.min(90, startX));
            const clampedStartY = Math.max(10, Math.min(90, startY));
            poop.style.transform = `translate(calc(${clampedStartX}vw - 50%), calc(${clampedStartY}vh - 50%)) rotate(0deg)`;
            
            startUnicornAnimation(poop, startX, startY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, randomDuration);
        }, 1500);
    }, 2000);
}

function createPoopConfetti() {
    for (let i = 0; i < 40; i++) {
        const poopConfetti = document.createElement('div');
        poopConfetti.style.position = 'fixed';
        poopConfetti.style.left = '50%';
        poopConfetti.style.top = '50%';
        poopConfetti.style.fontSize = '1.5em';
        poopConfetti.style.pointerEvents = 'none';
        poopConfetti.style.zIndex = '1003';
        poopConfetti.textContent = '💩';
        
        const angle = (Math.PI * 2 * i) / 40;
        const distance = 250 + Math.random() * 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const delay = Math.random() * 0.3;
        
        poopConfetti.style.setProperty('--x', x + 'px');
        poopConfetti.style.setProperty('--y', y + 'px');
        poopConfetti.style.animation = `unicornConfettiBurst 1.5s ease-out ${delay}s forwards`;
        
        document.body.appendChild(poopConfetti);
        
        // Remove after animation
        setTimeout(() => poopConfetti.remove(), 2000);
    }
}

function showFeedback() {
    // Hide only the "Fakahoot Quiz" title, keep progress bar visible
    const titleElement = document.querySelector('.title');
    if (titleElement) {
        titleElement.style.display = 'none';
    }
    
    const feedback = feedbacks[currentQuestionIndex] || {
        title: 'Feedback',
        explanation: 'No feedback available for this question.',
        source: ''
    };
    
    const questionNumber = currentQuestionIndex + 1;
    const imagePath = `pictures/q${questionNumber}.png`;
    
    const feedbackHTML = `
        <div class="feedback-container">
            <h2 class="feedback-title">🍋 ${feedback.title} 🍋</h2>
            <div class="feedback-content-wrapper">
                <div class="feedback-image-container">
                    <img src="${imagePath}" alt="Feedback image" class="feedback-image" id="feedbackImg${currentQuestionIndex}" onerror="handleImageError(this)">
                    <div class="feedback-unicorn-fallback" id="unicornFallback${currentQuestionIndex}" style="display: none;">🦄</div>
                </div>
                <div class="feedback-text-container">
                    <div class="feedback-explanation">${feedback.explanation}</div>
                    <div class="feedback-source">${feedback.source ? `Source: ${feedback.source}` : ''}</div>
                </div>
            </div>
            <button class="next-btn" id="nextBtn" onclick="nextQuestion()">Next Question →</button>
        </div>
    `;
    
    document.getElementById('quizContent').innerHTML = feedbackHTML;
    
    // Check if image loads, if not show unicorn
    const img = document.getElementById(`feedbackImg${currentQuestionIndex}`);
    if (img) {
        img.onerror = function() {
            this.style.display = 'none';
            const fallback = document.getElementById(`unicornFallback${currentQuestionIndex}`);
            if (fallback) {
                fallback.style.display = 'flex';
            }
        };
    }
    
    // Start raining unicorns or poops based on answer
    startFeedbackRain();
}

function startFeedbackRain() {
    const emoji = lastAnswerWasCorrect ? '🦄' : '💩';
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
        celebrationText.textContent = '💩 Wrong! 💩';
        celebrationText.style.color = '#8b4513';
    } else {
        celebrationText.textContent = '🎉 Correct! 🎉';
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
        
        // Create poop army on the right
        const poopArmy = document.getElementById('poopArmy');
        poopArmy.innerHTML = '';
        for (let i = 0; i < wrongCount; i++) {
            const poop = document.createElement('div');
            poop.className = 'battle-poop';
            poop.textContent = '💩';
            poop.style.animationDelay = `${i * 0.1}s`;
            poopArmy.appendChild(poop);
        }
        
        // Battle phase - charge toward center
        setTimeout(() => {
            document.querySelectorAll('.battle-unicorn, .battle-poop').forEach(el => {
                el.classList.add('battle-charge');
            });
            
            // After charging, move all to center (not teleport)
            setTimeout(() => {
                document.querySelectorAll('.battle-unicorn, .battle-poop').forEach((el, index) => {
                    const direction = el.classList.contains('battle-unicorn') ? 1 : -1;
                    
                    // Get the battle field to calculate center position
                    const battleField = document.querySelector('.battle-field');
                    const fieldRect = battleField.getBoundingClientRect();
                    const fieldCenterX = fieldRect.left + fieldRect.width / 2;
                    
                    // Get current position of the element
                    const elRect = el.getBoundingClientRect();
                    const elCenterX = elRect.left + elRect.width / 2;
                    
                    // Calculate distance from current position to center (in pixels)
                    const distanceToCenter = elCenterX - fieldCenterX;
                    
                    // Convert to vw for the animation
                    const distanceVw = (distanceToCenter / window.innerWidth) * 100;
                    
                    // Set CSS variable with the actual current position
                    el.style.setProperty('--start-x', `${distanceVw}vw`);
                    el.style.setProperty('--direction', direction);
                    
                    // Remove charge class
                    el.classList.remove('battle-charge');
                    
                    // Set transform to current position (preserve where charge ended)
                    el.style.transform = `translateX(${distanceVw}vw) translateY(0) scale(1.1)`;
                    
                    // Force a reflow
                    void el.offsetHeight;
                    
                    // Now add the move-to-center animation - it will animate from current position to center
                    el.classList.add('battle-move-to-center');
                    el.style.animationDelay = `${index * 0.05}s`;
                });
                
                // After moving to center, create chaos (fighting)
                setTimeout(() => {
                    document.querySelectorAll('.battle-unicorn, .battle-poop').forEach((el, index) => {
                        // Get current position before changing positioning
                        const rect = el.getBoundingClientRect();
                        const battleAnimation = document.getElementById('battleAnimation');
                        const animRect = battleAnimation.getBoundingClientRect();
                        
                        // Calculate center position relative to battle animation container
                        const centerX = animRect.left + animRect.width / 2;
                        const centerY = animRect.top + animRect.height / 2;
                        const currentX = rect.left + rect.width / 2;
                        const currentY = rect.top + rect.height / 2;
                        
                        el.classList.remove('battle-move-to-center');
                        // Position absolutely at center of battle animation
                        el.style.position = 'fixed';
                        el.style.left = centerX + 'px';
                        el.style.top = centerY + 'px';
                        el.style.transform = 'translate(-50%, -50%)';
                        el.classList.add('battle-chaos');
                        // Random delay for each unit
                        el.style.animationDelay = `${index * 0.05}s`;
                    });
                    
                    // After chaos, some units die
                    setTimeout(() => {
                        const allUnits = Array.from(document.querySelectorAll('.battle-unicorn, .battle-poop'));
                        // Randomly select some to die (about 30-50% of them)
                        const deathCount = Math.floor(allUnits.length * (0.3 + Math.random() * 0.2));
                        const shuffled = allUnits.sort(() => Math.random() - 0.5);
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
                        
                        // Show winner slowly fading in after deaths, and fade out remaining units
                        setTimeout(() => {
                            const winner = correctCount > wrongCount ? 'unicorn' : wrongCount > correctCount ? 'poop' : 'tie';
                            const winnerEmoji = document.getElementById('winnerEmoji');
                            const winnerText = document.getElementById('winnerText');
                            
                            if (winner === 'unicorn') {
                                winnerEmoji.textContent = '🦄';
                                winnerText.textContent = 'Unicorns Win! 🎉';
                            } else if (winner === 'poop') {
                                winnerEmoji.textContent = '💩';
                                winnerText.textContent = 'Poops Win! 💩';
                            } else {
                                winnerEmoji.textContent = '🤝';
                                winnerText.textContent = 'It\'s a Tie!';
                            }
                            
                            // Fade out remaining units (those that didn't die)
                            document.querySelectorAll('.battle-unicorn.battle-chaos, .battle-poop.battle-chaos').forEach(el => {
                                el.classList.add('battle-fade-out');
                            });
                            
                            document.getElementById('victoryWinner').style.display = 'block';
                            
                            // Show next button
                            setTimeout(() => {
                                document.getElementById('nextToResultsBtn').style.display = 'block';
                            }, 2000);
                        }, 1500);
                    }, 2000);
                }, 1500);
            }, 2000);
        }, 2000);
    }, 3000);
}

function showResults() {
    // Hide battle animation
    document.getElementById('battleAnimation').style.display = 'none';
    
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';
    
    // Determine Firebase status message
    const totalAttempts = firebaseSuccessCount + firebaseFailureCount;
    const allSuccessful = firebaseFailureCount === 0 && firebaseSuccessCount > 0;
    const noAttempts = totalAttempts === 0;
    
    let firebaseMessage = '';
    if (noAttempts) {
        firebaseMessage = "⚠️ No data was sent to Firebase. Check the browser console for errors.";
    } else if (allSuccessful) {
        firebaseMessage = `✅ All ${firebaseSuccessCount} question(s) successfully saved to Firebase!`;
    } else if (firebaseSuccessCount > 0) {
        firebaseMessage = `⚠️ Partial success: ${firebaseSuccessCount} saved, ${firebaseFailureCount} failed. Check console for details.`;
    } else {
        firebaseMessage = `❌ All ${firebaseFailureCount} attempt(s) failed. Check browser console (F12) for errors.`;
    }
    
    console.log('📊 Firebase Summary:', {
        successful: firebaseSuccessCount,
        failed: firebaseFailureCount,
        total: totalAttempts,
        allSuccessful: allSuccessful
    });
    
    document.getElementById('scoreDisplay').innerHTML = `
        <div class="score-emoji">${emoji}</div>
        <div class="score-text">You scored ${score} out of ${questions.length}!</div>
        <div class="score-percentage">${percentage}%</div>
        <div class="firebase-message">${firebaseMessage}</div>
        <div class="firebase-details" style="margin-top: 10px; font-size: 0.9em; color: #666;">
            <div>Firebase Status: ${firebaseSuccessCount} saved, ${firebaseFailureCount} failed</div>
            <div style="margin-top: 5px;">Check browser console (F12) for detailed logs</div>
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

// Handle nickname submission
function handleNicknameSubmit() {
    const nicknameInput = document.getElementById('nicknameInput');
    const nickname = nicknameInput.value.trim();
    
    if (nickname === '') {
        alert('Please enter a nickname!');
        return;
    }
    
    userNickname = nickname;
    questionData = []; // Reset question data
    
    // Hide nickname screen, show start screen
    document.getElementById('nicknameScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    showStartScreen();
}

// Restart quiz
document.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    
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
        
        // Show nickname screen again
        document.getElementById('nicknameScreen').style.display = 'block';
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

