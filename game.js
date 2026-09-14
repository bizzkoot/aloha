window.ArithmeticGame = class ArithmeticGame {
    constructor() {
        if (window.gameInstance) {
            return window.gameInstance;
        }
        window.gameInstance = this;
        console.log('Initializing ArithmeticGame');
        this.translations = JSON.parse(localStorage.getItem('gameTranslations')) || {};
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.guidedQuestions = new Set();
        this.isModalCreated = false;
        this.pendingLanguageUpdate = null;
        this.isInitializing = true;  // Add this
        this.hasInitialized = false; // Add this
        this.autoCheckInterval = null;
        this._abacusHooked = false;
        this.autoNextInterval = null;
        this._autoNextCancel = null;
        this.ready = this.init();
    }

    async checkDependencies() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const dependencies = {
                translationService: !!window.translationService,
                abacus: !!window.abacus,
                Addition: typeof Addition !== 'undefined',
                Subtraction: typeof Subtraction !== 'undefined'
            };
            
            console.log("Dependencies check:", dependencies);
            
            if (Object.values(dependencies).every(dep => dep)) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        console.error('Dependencies not loaded:', {
            translationService: !!window.translationService,
            abacus: !!window.abacus,
            Addition: typeof Addition !== 'undefined',
            Subtraction: typeof Subtraction !== 'undefined'
        });
        return false;
    }

    async init() {
        try {
            console.log('Initializing game...');
            const dependenciesLoaded = await this.checkDependencies();
            if (!dependenciesLoaded) {
                throw new Error("Required services not available after timeout");
            }
            console.log('Dependencies loaded, creating modal...');
            await this.createGameModal();
            this.setupEventListeners();
            this.hookAbacusAutoCheck();
            this.hasInitialized = true;
            this.isInitializing = false;
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error in game initialization:', error);
            this.isInitializing = false;
            throw error;
        }
    }
    async updateLanguage(targetLanguage) {
        if (this.isInitializing) {
            console.log('Queuing language update during initialization');
            this.pendingLanguageUpdate = targetLanguage;
            return;
        }
    
        console.log('Updating game language to:', targetLanguage);
        await window.translationService.ready;
    
        if (!this.isModalCreated) {
            console.log('Modal not created yet, queuing language update');
            this.pendingLanguageUpdate = targetLanguage;
            return;
        }
    
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }
    
        // Store current display state
        const wasVisible = modal.style.display === 'flex';
    
        // Remove existing content sections
        const setupContent = modal.querySelector('.game-setup-content');
        const questionSection = modal.querySelector('.game-question-section');
        const resultsSection = modal.querySelector('.game-results');
    
        if (setupContent) setupContent.remove();
        if (questionSection) questionSection.remove();
        if (resultsSection) resultsSection.remove();
    
        // Recreate the modal content with new language
        const newModal = await this.createGameModal();
        this.setupEventListeners();
    
        // Restore visibility if it was previously visible
        if (wasVisible && newModal) {
            newModal.style.display = 'flex';
        }
        window.updateSidePanelVisibility?.();
    
        // Update current game state if exists
        if (this.questions.length > 0) {
            this.questions = [];
            this.currentQuestionIndex = 0;
    
            const newSetupContent = newModal?.querySelector('.game-setup-content');
            if (newSetupContent) {
                newSetupContent.style.display = 'flex';
            }
    
            const newQuestionSection = newModal?.querySelector('.game-question-section');
            const newResultsSection = newModal?.querySelector('.game-results');
    
            if (this.currentQuestionIndex >= this.questions.length) {
                if (newQuestionSection) newQuestionSection.style.display = 'none';
                if (newResultsSection) {
                    newResultsSection.style.display = 'block';
                    await this.showResults();
                }
            } else {
                if (newQuestionSection) {
                    newQuestionSection.style.display = 'flex';
                }
                if (newResultsSection) newResultsSection.style.display = 'none';
                await this.showCurrentQuestion();
            }
        }
    }
    cleanupTutorial() {
        const existingTutorials = document.querySelectorAll('.tutorial-modal');
        existingTutorials.forEach(tutorial => tutorial.remove());
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }

        const startGameBtn = modal.querySelector('#startGame');
        if (startGameBtn) {
            startGameBtn.onclick = () => {
                console.log('Start Game clicked');
                const operators = Array.from(modal.querySelectorAll('.operators-selection input:checked'));
                
                // Validate operator selection
                if (operators.length === 0) {
                    alert('Please select at least one operator');
                    return;
                }
                
                // Generate questions and start game
                this.generateQuestions();
                
                // Hide setup content and show question section
                const setupContent = modal.querySelector('.game-setup-content');
                const questionSection = modal.querySelector('.game-question-section');
                
                if (setupContent) setupContent.style.display = 'none';
                if (questionSection) questionSection.style.display = 'flex';
                
                // Initialize game state
                this.currentQuestionIndex = 0;
                this.showCurrentQuestion();
                
                console.log('Game started with questions:', this.questions);
            };
        }

        const checkAnswerBtn = modal.querySelector('.check-answer');
        const guideMeBtn = modal.querySelector('.guide-me');
        const nextQuestionBtn = modal.querySelector('.next-question');

        if (checkAnswerBtn) {
            checkAnswerBtn.onclick = () => this.checkAnswer();
        }

        if (guideMeBtn) {
            guideMeBtn.onclick = async () => {
                this.cancelAutoCheck();
                this.cancelAutoNext();
                await window.translationService.ready;
                const lang = window.translationService.currentLanguage || 'en';
                const translatedTexts = {
                    nextStep: await window.translationService.translate('Next Step', lang),
                    repeat: await window.translationService.translate('Show Movement', lang)
                };
                
                const currentModal = document.querySelector('.game-section') || modal;
                const questionSection = currentModal?.querySelector('.game-question-section');
                if (!questionSection) {
                    console.error('Question section not found');
                    return;
                }
        
                // Remove any existing step sections
                const existingSteps = currentModal.querySelectorAll('.game-steps');
                existingSteps.forEach(el => el.remove());
        
                // Create fresh guidance content container
                const tutorialSection = document.createElement('div');
                tutorialSection.className = 'game-steps';
                tutorialSection.innerHTML = `
                    <div class="tutorial-content"></div>
                    <div class="tutorial-controls">
                        <button class="tutorial-repeat button-common">${translatedTexts.repeat}</button>
                        <button class="tutorial-next button-common">${translatedTexts.nextStep}</button>
                    </div>
                `;
                
                questionSection.appendChild(tutorialSection);
                this.guidedQuestions.add(this.currentQuestionIndex);
                
                const currentQuestion = this.questions[this.currentQuestionIndex];
                const steps = await this.generateGameSteps(currentQuestion);
                if (!steps || steps.length === 0) return;
                
                let currentStepIndex = 0;
                const tutorialContent = tutorialSection.querySelector('.tutorial-content');
                const repeatBtn = tutorialSection.querySelector('.tutorial-repeat');
                const nextBtn = tutorialSection.querySelector('.tutorial-next');
                
                const showStep = async (index) => {
                    if (index < 0 || index >= steps.length) return;
                    currentStepIndex = index;
                    const step = steps[currentStepIndex];
                    
                    tutorialContent.innerHTML = step.message;
                    nextBtn.disabled = currentStepIndex >= steps.length - 1;
                    
                    if (step.isComplement) {
                        repeatBtn.onclick = () => {
                            if (currentQuestion.operator === '+') {
                                this.addition.repeatComplementStep(step.complementValue, step.value, currentQuestion.num1, currentQuestion.num2);
                            } else if (currentQuestion.operator === '-') {
                                this.subtraction.repeatComplementStep(step.complementValue, step.value, currentQuestion.num1, currentQuestion.num2);
                            }
                        };
                        // Automatically animate the step-by-step complement bead movement
                        if (currentQuestion.operator === '+') {
                            this.addition.repeatComplementStep(step.complementValue, step.value, currentQuestion.num1, currentQuestion.num2);
                        } else if (currentQuestion.operator === '-') {
                            this.subtraction.repeatComplementStep(step.complementValue, step.value, currentQuestion.num1, currentQuestion.num2);
                        }
                    } else {
                        repeatBtn.onclick = () => this.repeatCurrentStep(step);
                        window.abacus?.resetAbacus();
                        this.displayStep(step);
                    }
                };
                
                nextBtn.onclick = () => {
                    if (currentStepIndex < steps.length - 1) {
                        showStep(currentStepIndex + 1);
                    }
                };
                
                await showStep(0);
                guideMeBtn.disabled = true;
            };
        }

        if (nextQuestionBtn) {
            nextQuestionBtn.onclick = () => this.goNext();
        }
    }
    async createGameModal() {
        console.log('Starting modal creation');
        const translatedTexts = {
            settings: await this.translateText('Game Settings'),
            start: await this.translateText('Start Game'),
            checkAnswer: await this.translateText('Check Answer'),
            guideMe: await this.translateText('Guide Me'),
            next: await this.translateText('Next Question'),
            results: await this.translateText('Results'),
            singleDigit: await this.translateText('Single Digit (0-9)'),
            doubleDigits: await this.translateText('Double Digits (0-99)'),
            tripleDigits: await this.translateText('Triple Digits (0-999)'),
            addition: await this.translateText('Addition'),
            subtraction: await this.translateText('Subtraction'),
            multiplication: await this.translateText('Multiplication'),
            division: await this.translateText('Division'),
            questions5: await this.translateText('5 Questions'),
            questions10: await this.translateText('10 Questions'),
            questions20: await this.translateText('20 Questions')
        };
        console.log('Modal translations loaded:', translatedTexts);
    
        // Ensure DOM is ready
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    
        const mountPoint = document.getElementById('gamePractice');
        if (!mountPoint) {
            console.error('Game practice panel not found');
            return;
        }
    
        // Remove existing modal if present
        const existingModal = document.querySelector('.game-section');
        if (existingModal) {
            existingModal.remove();
        }
    
        const modal = document.createElement('div');
        modal.className = 'game-section';
        modal.innerHTML = `
            <div class="tutorial-header">
                <h2 class="tutorial-title">${translatedTexts.settings}</h2>
                <button class="tutorial-close">X</button>
            </div>
            <div class="game-setup-content">
                <select id="numberRange">
                    <option value="9">${translatedTexts.singleDigit}</option>
                    <option value="99">${translatedTexts.doubleDigits}</option>
                    <option value="999">${translatedTexts.tripleDigits}</option>
                </select>
                <div class="operators-selection">
                    <label><input type="checkbox" value="+" checked> ${translatedTexts.addition}</label>
                    <label><input type="checkbox" value="-"> ${translatedTexts.subtraction}</label>
                    <label><input type="checkbox" value="x"> ${translatedTexts.multiplication}</label>
                    <label><input type="checkbox" value="/"> ${translatedTexts.division}</label>
                </div>
                <select id="questionCount">
                    <option value="5">${translatedTexts.questions5}</option>
                    <option value="10">${translatedTexts.questions10}</option>
                    <option value="20">${translatedTexts.questions20}</option>
                </select>
                <button id="startGame" class="button-common">${translatedTexts.start}</button>
            </div>
            <div class="game-question-section">
                <div class="question-display"></div>
                <div class="game-question-actions">
                    <button class="check-answer button-common">${translatedTexts.checkAnswer}</button>
                    <button class="guide-me button-common">${translatedTexts.guideMe}</button>
                    <button class="next-question button-common">${translatedTexts.next}</button>
                </div>
            </div>
            <div class="game-results">
                <h3>${translatedTexts.results}</h3>
                <div class="score-display"></div>
                <div class="questions-review"></div>
            </div>
        `;
    
        // Add modal to the game practice panel
        mountPoint.appendChild(modal);
        window.updateSidePanelVisibility?.();

        // Hidden until the player opens the game
        modal.style.display = 'none';
        this.isModalCreated = true;
    
        // Add close button functionality
        const closeButton = modal.querySelector('.tutorial-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.cancelAutoCheck();
                this.cancelAutoNext();
                modal.style.display = 'none';
                window.updateSidePanelVisibility?.();
            });
        }
    
        // Process any pending language updates
        if (this.pendingLanguageUpdate) {
            const currentLanguage = this.pendingLanguageUpdate;
            this.pendingLanguageUpdate = null;
            await this.updateLanguage(currentLanguage);
        }
    
        return modal;
    }

    async translateText(text) {
        await window.translationService.ready;
        const currentLang = window.translationService.currentLanguage;
        const cacheKey = `${currentLang}_${text}`;

        if (this.translations[cacheKey]) return this.translations[cacheKey];

        const translated = await window.translationService.translate(text, currentLang);
        this.translations[cacheKey] = translated;
        localStorage.setItem('gameTranslations', JSON.stringify(this.translations));
        return translated;
    }

    generateQuestions() {
        console.log('Generating questions - start');
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found in generateQuestions');
            return;
        }
        
        const range = parseInt(modal.querySelector('#numberRange').value);
        const operators = Array.from(modal.querySelectorAll('.operators-selection input:checked')).map(inp => inp.value);
        const count = parseInt(modal.querySelector('#questionCount').value);
        
        console.log('Question generation settings:', { range, operators, count });
        
        this.questions = [];
        for (let i = 0; i < count; i++) {
            let num1, num2, operator;
            let validQuestion = false;

            while (!validQuestion) {
                num1 = Math.floor(Math.random() * range);
                num2 = Math.floor(Math.random() * range);
                operator = operators[Math.floor(Math.random() * operators.length)];

                if (operator === '-') {
                    validQuestion = num1 >= num2;
                } else if (operator === '/') {
                    validQuestion = num2 !== 0 && num1 % num2 === 0;
                } else {
                    validQuestion = true;
                }

                // No zero-answer questions (0 - 0, 0 + 0, 5 - 5, ...):
                // the board starts at 0, so they need no bead movement.
                if (validQuestion) {
                    const expected = operator === '+' ? num1 + num2
                        : operator === '-' ? num1 - num2
                        : operator === 'x' ? num1 * num2
                        : Math.floor(num1 / num2);
                    validQuestion = expected !== 0;
                }
            }

            this.questions.push({ num1, num2, operator });
        }
        console.log('Generated questions:', this.questions);
    }

    async checkAnswer() {
        this.cancelAutoCheck();
        this.cancelAutoNext();
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }
        const currentValue = window.abacus.value;
        const question = this.questions[this.currentQuestionIndex];
        const expectedValue = this.calculateExpectedValue(question);

        const isAnswered = this.userAnswers[this.currentQuestionIndex];
        if (!isAnswered) {
            this.userAnswers.push({
                question,
                userAnswer: currentValue,
                expectedAnswer: expectedValue,
                isGuided: this.guidedQuestions.has(this.currentQuestionIndex)
            });
        }

        const isCorrect = currentValue === expectedValue;

        const questionText = await this.translateText('Question');
        const yourAnswerText = await this.translateText('Your answer');
        const incorrectText = await this.translateText('Incorrect');
        const expectedText = await this.translateText('Expected');
        const correctText = await this.translateText('Correct!');

        const questionDisplay = modal.querySelector('.question-display');
        if (questionDisplay) {
            questionDisplay.innerHTML =
                `${questionText} ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}<br>
                <span style="color: ${isCorrect ? 'green' : 'red'}">
                    ${yourAnswerText}: ${currentValue} (${isCorrect ? correctText : `${incorrectText} - ${expectedText}: ${expectedValue}`})
                </span>`;
        }


        const checkAnswerBtn = modal.querySelector('.check-answer');
        if (checkAnswerBtn) checkAnswerBtn.disabled = true;
        if (isCorrect) this.startAutoNext();
    }

    goNext() {
        this.cancelAutoNext();
        this.cancelAutoCheck();
        const modal = document.querySelector('.game-section');
        if (!modal) return;
        if (!this.userAnswers[this.currentQuestionIndex]) {
            const currentValue = window.abacus.value;
            const currentQuestion = this.questions[this.currentQuestionIndex];
            if (currentQuestion) {
                this.userAnswers.push({
                    question: currentQuestion,
                    userAnswer: currentValue,
                    expectedAnswer: this.calculateExpectedValue(currentQuestion),
                    isGuided: this.guidedQuestions.has(this.currentQuestionIndex)
                });
            }
        }
        this.cleanupTutorial();
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            const checkAnswerBtn = modal.querySelector('.check-answer');
            if (checkAnswerBtn) checkAnswerBtn.disabled = false;
            this.showCurrentQuestion();
        } else {
            const questionSection = modal.querySelector('.game-question-section');
            const resultsSection = modal.querySelector('.game-results');
            if (questionSection) questionSection.style.display = 'none';
            if (resultsSection) { resultsSection.style.display = 'block'; this.showResults(); }
        }
    }

    // Auto-press Next on GOOD: 5s countdown, touch anywhere / mouse move cancels.
    startAutoNext() {
        this.cancelAutoNext();
        let s = 5;
        const toast = document.createElement('div');
        toast.className = 'auto-next-toast';
        document.body.appendChild(toast);
        const cancel = () => this.cancelAutoNext();
        this._autoNextCancel = cancel;
        window.addEventListener('touchstart', cancel, { passive: true });
        window.addEventListener('mousemove', cancel);
        const tick = () => {
            if (!toast.isConnected) { this.cancelAutoNext(); return; }
            toast.textContent = s > 0
                ? `Good! Next question in ${s}\u2026 touch anywhere or move mouse to cancel`
                : 'Next\u2026';
            if (s-- <= 0) { this.cancelAutoNext(); this.goNext(); return; }
        };
        tick();
        this.autoNextInterval = setInterval(tick, 1000);
    }

    cancelAutoNext() {
        if (this.autoNextInterval) { clearInterval(this.autoNextInterval); this.autoNextInterval = null; }
        if (this._autoNextCancel) {
            window.removeEventListener('touchstart', this._autoNextCancel);
            window.removeEventListener('mousemove', this._autoNextCancel);
            this._autoNextCancel = null;
        }
        document.querySelector('.auto-next-toast')?.remove();
    }
    async showResults() {
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }
        const correctCount = this.userAnswers.filter(a => a.userAnswer === a.expectedAnswer && !a.isGuided).length;
        const guidedCount = this.userAnswers.filter(a => a.isGuided).length;

        const resultsDiv = modal.querySelector('.game-results');
        if (!resultsDiv) {
            console.error('Results section not found.');
            return;
        }
        const guidedText = await this.translateText('Questions solved with guidance:');

        resultsDiv.innerHTML = `
            <h3>${await this.translateText('Results')}</h3>
            <p>${await this.translateText('Score')}: ${correctCount}/${this.questions.length}</p>
            <p>${guidedText} ${guidedCount}</p>
            <div class="questions-review">
                ${await this.generateReviewHTML()}
            </div>
            <button class="button-common" id="resetGame">${await this.translateText('Start New Game')}</button>
        `;

        const resetGameButton = resultsDiv.querySelector('#resetGame');
        if (resetGameButton) {
            resetGameButton.addEventListener('click', () => {
                this.resetGame();
                const setupContent = modal.querySelector('.game-setup-content');
                if (setupContent) setupContent.style.display = 'flex';
            });
        }
    }

    resetGame() {
        this.cancelAutoCheck();
        this.cancelAutoNext();
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.guidedQuestions = new Set();
        window.abacus.resetAbacus();

        const setupContent = modal.querySelector('.game-setup-content');
        const questionSection = modal.querySelector('.game-question-section');
        const resultsSection = modal.querySelector('.game-results');

        if (setupContent) setupContent.style.display = 'flex';
        if (questionSection) questionSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
    }

    async showGameSetup() {
        try {
            await window.translationService.ready;
            const modal = document.querySelector('.game-section');
    
            if (!modal) {
                window.tutorial?.hideTutorial();
                const arithModal = document.querySelector('.arithmetic-section');
                if (arithModal) arithModal.style.display = 'none';
                const newModal = await this.createGameModal();
                if (newModal) {
                    newModal.style.display = 'flex';
                }
            } else if (modal.style.display === 'none') {
                window.tutorial?.hideTutorial();
                const arithModal = document.querySelector('.arithmetic-section');
                if (arithModal) arithModal.style.display = 'none';
                modal.style.display = 'flex';
            } else {
                modal.style.display = 'none';
            }
            window.updateSidePanelVisibility?.();
        } catch (error) {
            console.error('Error showing game setup:', error);
        }
    }

    async startGame() {
        console.log('Starting game');
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found.');
            return;
        }
        const selectedOperators = Array.from(modal.querySelectorAll('.operators-selection input:checked')).map(inp => inp.value);

        if (selectedOperators.includes('+')) {
            this.addition = new Addition();
        }
        if (selectedOperators.includes('-')) {
            this.subtraction = new Subtraction();
        }

        const setupContent = modal.querySelector('.game-setup-content');
        const questionSection = modal.querySelector('.game-question-section');
        if (setupContent) setupContent.style.display = 'none';
        if (questionSection) questionSection.style.display = 'flex';
        this.currentQuestionIndex = 0;
        this.showCurrentQuestion();
    }

    async showCurrentQuestion() {
        console.log('Showing question:', this.currentQuestionIndex + 1);
        const modal = document.querySelector('.game-section');
        if (!modal) {
            console.error('Game modal not found in showCurrentQuestion');
            return;
        }
        
        // Reset the abacus and clean up any guidance steps for the new question
        this.cancelAutoCheck();
        this.cancelAutoNext();
        window.abacus.resetAbacus();
        const existingSteps = modal.querySelector('.game-steps, .tutorial-section');
        if (existingSteps) existingSteps.remove();
        
        const question = this.questions[this.currentQuestionIndex];
        if (!question) {
            console.error('No question found for index:', this.currentQuestionIndex);
            return;
        }
        
        const display = modal.querySelector('.question-display');
        if (!display) {
            console.error('Question display element not found');
            return;
        }
        
        const questionText = await this.translateText('Question');
        display.textContent = `${questionText} ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}`;
        
        // Re-enable the Guide Me button for each new question
        const guideMeBtn = modal.querySelector('.guide-me');
        if (guideMeBtn) {
            guideMeBtn.disabled = false;
        }
        
        console.log('Question displayed:', display.textContent);
    }

    // Auto-press Check Answer: when board already shows the right answer,
    // count down 5s then auto-check. Any bead move away cancels.
    hookAbacusAutoCheck() {
        if (this._abacusHooked || !window.abacus) return;
        const orig = window.abacus.calculateValue.bind(window.abacus);
        window.abacus.calculateValue = (...a) => { orig(...a); this.onAbacusValueChange(); };
        this._abacusHooked = true;
    }

    onAbacusValueChange() {
        const modal = document.querySelector('.game-section');
        const qSection = modal?.querySelector('.game-question-section');
        if (!modal || !qSection || qSection.style.display === 'none') { this.cancelAutoCheck(); return; }
        if (modal.querySelector('.game-steps')) { this.cancelAutoCheck(); return; } // guiding: board is demo, not an answer
        if (this.userAnswers[this.currentQuestionIndex]) { this.cancelAutoCheck(); return; }
        const q = this.questions[this.currentQuestionIndex];
        if (!q) return;
        if (window.abacus.value === this.calculateExpectedValue(q)) this.startAutoCheck();
        else this.cancelAutoCheck();
    }

    autoCheckEl() {
        const qSection = document.querySelector('.game-section .game-question-section');
        if (!qSection) return null;
        let el = qSection.querySelector('.auto-check-countdown');
        if (!el) {
            el = document.createElement('div');
            el.className = 'auto-check-countdown';
            qSection.appendChild(el);
        }
        return el;
    }

    startAutoCheck() {
        if (this.autoCheckInterval) return;
        let s = 5;
        const el = this.autoCheckEl();
        const tick = () => {
            if (!el.isConnected) { this.cancelAutoCheck(); return; }
            el.textContent = s > 0 ? `Correct! Auto-check in ${s}\u2026 (move a bead to cancel)` : 'Checking\u2026';
            if (s-- <= 0) { this.cancelAutoCheck(); this.checkAnswer(); }
        };
        tick();
        this.autoCheckInterval = setInterval(tick, 1000);
    }

    cancelAutoCheck() {
        if (this.autoCheckInterval) { clearInterval(this.autoCheckInterval); this.autoCheckInterval = null; }
        document.querySelector('.auto-check-countdown')?.remove();
    }

    calculateExpectedValue(question) {        switch (question.operator) {
            case '+': return question.num1 + question.num2;
            case '-': return question.num1 - question.num2;
            case 'x': return question.num1 * question.num2;
            case '/': return Math.floor(question.num1 / question.num2);
            default: return NaN;
        }
    }

    async generateReviewHTML() {
        const correct = await this.translateText('Correct!');
        const incorrect = await this.translateText('Incorrect');
        const expected = await this.translateText('Expected');
        const guided = await this.translateText('Guided');

        return Promise.all(this.userAnswers.map(async answer => {
            const result = answer.userAnswer === answer.expectedAnswer ? correct : incorrect;
            const guidanceText = answer.isGuided ? ` (${guided})` : '';
            return `<p>${answer.question.num1} ${answer.question.operator} ${answer.question.num2} = ${answer.userAnswer} (${expected}: ${answer.expectedAnswer}) - ${result}${guidanceText}</p>`;
        })).then(results => results.join(''));
    }

    displayStep(step) {
        if (!step) return;
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        columns.forEach(column => BeadMovements.setValue(column, 0));

        let remainingValue = step.value;
        for (let i = 0; i < columns.length && remainingValue > 0; i++) {
            const digit = remainingValue % 10;
            const column = columns[i];
            
            if (digit >= 5) {
                column.querySelector('.top-bead')?.classList.add('tutorial-highlight');
            }
            for (let j = 0; j < digit % 5; j++) {
                column.querySelector(`.bottom-bead-${4-j}`)?.classList.add('tutorial-highlight');
            }
            
            BeadMovements.setValue(column, digit);
            remainingValue = Math.floor(remainingValue / 10);
        }
        window.abacus?.calculateValue();
    }

    async repeatCurrentStep(step) {
        if (!step) return;
        window.abacus?.resetAbacus();
        this.displayStep(step);
        
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        columns.forEach(column => {
            const activeBeads = column.querySelectorAll('.active');
            activeBeads.forEach(bead => {
                bead.classList.add('tutorial-highlight');
                setTimeout(() => bead.classList.remove('tutorial-highlight'), 500);
            });
        });
    }

    async generateGameSteps(question) {
        if (!question) return [];
        const { num1, num2, operator } = question;
        const lang = window.translationService?.currentLanguage || 'en';
        let steps = [];

        try {
            switch (operator) {
                case '+':
                    if (!this.addition) this.addition = new Addition();
                    steps = await this.addition.generateSteps(num1, num2);
                    break;
                case '-':
                    if (!this.subtraction) this.subtraction = new Subtraction();
                    steps = await this.subtraction.generateSteps(num1, num2);
                    break;
                case 'x': {
                    const stepText = await window.translationService.translate('Step', lang);
                    const setFirst = await window.translationService.translate('Set first number', lang);
                    const multiplyByText = await window.translationService.translate('Multiply by', lang);
                    steps = [
                        { value: num1, message: `${stepText} 1: ${setFirst}: ${num1}` },
                        { value: num1 * num2, message: `${stepText} 2: ${multiplyByText} ${num2} = ${num1 * num2}` }
                    ];
                    break;
                }
                case '/': {
                    const stepText = await window.translationService.translate('Step', lang);
                    const setFirst = await window.translationService.translate('Set first number', lang);
                    const divideByText = await window.translationService.translate('Divide by', lang);
                    const quotient = Math.floor(num1 / num2);
                    steps = [
                        { value: num1, message: `${stepText} 1: ${setFirst}: ${num1}` },
                        { value: quotient, message: `${stepText} 2: ${divideByText} ${num2} = ${quotient}` }
                    ];
                    break;
                }
            }
        } catch (error) {
            console.error('Error generating game steps:', error);
        }

        if (!steps || steps.length === 0) {
            const stepText = await window.translationService.translate('Step', lang);
            const setFirst = await window.translationService.translate('Set first number', lang);
            const resultText = await window.translationService.translate('Result:', lang);
            const expected = this.calculateExpectedValue(question);
            steps = [
                { value: question.num1, message: `${stepText} 1: ${setFirst}: ${question.num1}` },
                { value: expected, message: `${resultText} ${expected}` }
            ];
        }

        return steps;
    }

}


document.addEventListener('DOMContentLoaded', async () => {
    console.log('Waiting for services...');
    try {
        await Promise.all([
            new Promise(resolve => {
                if (window.translationService?.ready) {
                    resolve();
                } else {
                    const checkInterval = setInterval(() => {
                        if (window.translationService?.ready) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 50);
                }
            }),
            new Promise(resolve => {
                if (window.abacus) {
                    resolve();
                } else {
                    const checkInterval = setInterval(() => {
                        if (window.abacus) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 50);
                }
            })
        ]);

        window.game = new ArithmeticGame();
        await window.game.ready;
        console.log('Game fully initialized');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
