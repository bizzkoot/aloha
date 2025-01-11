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
        const wasVisible = modal.style.display === 'block';
    
        // Remove existing content sections
        const setupContent = modal.querySelector('.game-setup-content');
        const questionSection = modal.querySelector('.game-question-section');
        const resultsSection = modal.querySelector('.game-results');
    
        if (setupContent) setupContent.remove();
        if (questionSection) questionSection.remove();
        if (resultsSection) resultsSection.remove();
    
        // Recreate the modal content with new language
        await this.createGameModal();
        this.setupEventListeners();
    
        // Restore visibility if it was previously visible
        if (wasVisible) {
            modal.style.display = 'block';
            this.positionModal(modal);
        }
    
        // Update current game state if exists
        if (this.questions.length > 0) {
            this.questions = [];
            this.currentQuestionIndex = 0;
    
            const newSetupContent = modal.querySelector('.game-setup-content');
            if (newSetupContent) {
                newSetupContent.style.display = 'flex';
            }
    
            const newQuestionSection = modal.querySelector('.game-question-section');
            const newResultsSection = modal.querySelector('.game-results');
    
            if (this.currentQuestionIndex >= this.questions.length) {
                if (newQuestionSection) newQuestionSection.style.display = 'none';
                if (newResultsSection) {
                    newResultsSection.style.display = 'block';
                    await this.showResults();
                }
            } else {
                if (newQuestionSection) {
                    newQuestionSection.style.display = 'block';
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
                if (questionSection) questionSection.style.display = 'block';
                
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
                const translatedTexts = {
                    nextStep: await this.translateText('Next Step'),
                    repeat: await this.translateText('Show Movement')
                };
                
                await window.translationService.ready;
                const questionDisplay = modal.querySelector('.question-display');
                
                if (!questionDisplay) {
                    console.error('Question display not found');
                    return;
                }
        
                // Remove any existing tutorial sections
                const existingTutorial = questionDisplay.querySelector('.tutorial-section');
                if (existingTutorial) {
                    existingTutorial.remove();
                }
        
                // Create fresh tutorial content container
                const tutorialSection = document.createElement('div');
                tutorialSection.className = 'tutorial-section';
                tutorialSection.innerHTML = `
                    <div class="tutorial-content"></div>
                    <div class="tutorial-controls">
                        <button class="tutorial-repeat button-common">${translatedTexts.repeat}</button>
                        <button class="tutorial-next button-common">${translatedTexts.nextStep}</button>
                    </div>
                `;
        
                questionDisplay.appendChild(tutorialSection);
                this.guidedQuestions.add(this.currentQuestionIndex);
                
                const currentQuestion = this.questions[this.currentQuestionIndex];
                let steps;
                let operationInstance;
        
                try {
                    switch (currentQuestion.operator) {
                        case '+':
                            if (!this.addition) {
                                this.addition = new Addition();
                            }
                            operationInstance = this.addition;
                            steps = await this.addition.generateSteps(currentQuestion.num1, currentQuestion.num2);
                            break;
                        case '-':
                            if (!this.subtraction) {
                                this.subtraction = new Subtraction();
                            }
                            operationInstance = this.subtraction;
                            steps = await this.subtraction.generateSteps(currentQuestion.num1, currentQuestion.num2);
                            break;
                    }
                } catch (error) {
                    console.error('Error generating steps:', error);
                    return;
                }
        
                if (!steps || steps.length === 0) {
                    steps = [
                        {
                            value: currentQuestion.num1,
                            message: await this.translateText(`Starting with ${currentQuestion.num1}`),
                            isComplement: false
                        },
                        {
                            value: this.calculateExpectedValue(currentQuestion),
                            message: await this.translateText(`Final result: ${this.calculateExpectedValue(currentQuestion)}`),
                            isComplement: false
                        }
                    ];
                }
        
                let currentStepIndex = 0;
        
                const displayStep = async () => {
                    if (!steps || currentStepIndex < 0 || currentStepIndex >= steps.length) {
                        return;
                    }
                    const tutorialContent = tutorialSection.querySelector('.tutorial-content');
                    tutorialContent.innerHTML = steps[currentStepIndex].message;
                    window.abacus.resetAbacus();
                    await this.displayNumberWithHighlights(
                        Array.from(document.querySelectorAll('.column')).reverse(),
                        steps[currentStepIndex].value
                    );
                };
        
                await displayStep();
        
                // Initialize tutorial controls with fresh event listeners
                const tutorialControls = tutorialSection.querySelector('.tutorial-controls');
                if (tutorialControls) {
                    const repeatBtn = tutorialControls.querySelector('.tutorial-repeat');
                    const nextBtn = tutorialControls.querySelector('.tutorial-next');

                    // Clear existing listeners and create fresh buttons
                    const newRepeatBtn = repeatBtn.cloneNode(true);
                    const newNextBtn = nextBtn.cloneNode(true);
                    repeatBtn.replaceWith(newRepeatBtn);
                    nextBtn.replaceWith(newNextBtn);

                    // Add new event listeners
                    newRepeatBtn.onclick = async () => {
                        // Get the current step, even if we're at the end
                        const currentStep = steps[Math.min(currentStepIndex, steps.length - 1)];
                        if (currentStep) {
                            if (currentStep.isComplement) {
                                await this.repeatComplementStep(currentStep.complementValue, currentStep.value);
                            } else {
                                await this.displayNumberWithHighlights(
                                    Array.from(document.querySelectorAll('.column')).reverse(),
                                    currentStep.value
                                );
                            }
                        }
                    };

                    newNextBtn.onclick = async () => {
                        currentStepIndex++;
                        if (currentStepIndex < steps.length) {
                            await displayStep();
                        } else {
                            newNextBtn.disabled = true;
                            // Keep the last step accessible for the Show Movement button
                            currentStepIndex = steps.length - 1;
                        }
                    };
                }        
                // Disable Guide Me button after starting tutorial
                guideMeBtn.disabled = true;
            };
        }        

        if (nextQuestionBtn) {
            nextQuestionBtn.onclick = () => {
                if (!this.userAnswers[this.currentQuestionIndex]) {
                    const currentValue = window.abacus.value;
                    const currentQuestion = this.questions[this.currentQuestionIndex];
                    if (currentQuestion) {
                        const expectedValue = this.calculateExpectedValue(currentQuestion);
                        this.userAnswers.push({
                            question: currentQuestion,
                            userAnswer: currentValue,
                            expectedAnswer: expectedValue,
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
                    if (resultsSection) {
                        resultsSection.style.display = 'block';
                        this.showResults();
                    }
                }
            };
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
    
        const container = document.querySelector('.container');
        if (!container) {
            console.error('Container element not found');
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
                <span class="tutorial-drag-handle">≡</span>
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
                    <label><input type="checkbox" value="+"> ${translatedTexts.addition}</label>
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
                <button class="check-answer button-common">${translatedTexts.checkAnswer}</button>
                <button class="guide-me button-common">${translatedTexts.guideMe}</button>
                <button class="next-question button-common">${translatedTexts.next}</button>
            </div>
            <div class="game-results">
                <h3>${translatedTexts.results}</h3>
                <div class="score-display"></div>
                <div class="questions-review"></div>
            </div>
        `;
    
        // Add modal to container
        container.appendChild(modal);
    
        // Initialize modal position and visibility
        modal.style.display = 'none';
        this.positionModal(modal);
    
        // Setup drag functionality
        this.setupDragFunctionality(modal);
        this.isModalCreated = true;
    
        // Add close button functionality
        const closeButton = modal.querySelector('.tutorial-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
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
            }

            this.questions.push({ num1, num2, operator });
        }
        console.log('Generated questions:', this.questions);
    }

    async checkAnswer() {
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
                await this.createGameModal();
                const newModal = document.querySelector('.game-section');
                if (newModal) {
                    newModal.style.display = 'block';
                    
                    const modalHeight = newModal.offsetHeight;
                    const modalWidth = newModal.offsetWidth;
                    const windowWidth = window.innerWidth;
                    
                    // Position horizontally centered, but from bottom
                    const centerX = (windowWidth - modalWidth) / 2;
                    const bottomOffset = 40; // Distance from bottom of screen
                    
                    newModal.style.left = `${centerX}px`;
                    newModal.style.bottom = `${bottomOffset}px`;
                    newModal.style.top = 'auto'; // Clear any top positioning
                }
            } else {
                if (modal.style.display === 'none') {
                    modal.style.display = 'block';
                    
                    const modalHeight = modal.offsetHeight;
                    const modalWidth = modal.offsetWidth;
                    const windowWidth = window.innerWidth;
                    
                    const centerX = (windowWidth - modalWidth) / 2;
                    const bottomOffset = 40;
                    
                    modal.style.left = `${centerX}px`;
                    modal.style.bottom = `${bottomOffset}px`;
                    modal.style.top = 'auto';
                } else {
                    modal.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error showing game setup:', error);
        }
    }

    positionModal(modal) {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Get modal dimensions
        const modalRect = modal.getBoundingClientRect();
        const modalWidth = modalRect.width;
        const modalHeight = modalRect.height;
        
        // Calculate centered position with padding
        const padding = 20;
        const left = Math.max(padding, Math.min(viewportWidth - modalWidth - padding, (viewportWidth - modalWidth) / 2));
        const top = Math.max(padding, Math.min(viewportHeight - modalHeight - padding, (viewportHeight - modalHeight) / 2));
        
        // Apply position
        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
        modal.style.transform = 'none';
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
        if (questionSection) questionSection.style.display = 'block';
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
        
        // Reset the abacus for the new question
        window.abacus.resetAbacus();
        
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

    calculateExpectedValue(question) {
        switch (question.operator) {
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

    async displayNumberWithHighlights(columns, number, beadMovements) {
        try {
            columns.forEach(column => {
                column.querySelectorAll('.bead').forEach(bead => {
                    bead.classList.remove('active', 'tutorial-highlight');
                });
            });

            if (beadMovements) {
                beadMovements.forEach(movement => {
                    const column = columns[movement.columnIndex];
                    if (!column) return;

                    const bead = column.querySelector(`.${movement.beadType}`);
                    if (bead) {
                        const isActive = movement.direction === 'add';
                        bead.classList.toggle('active', isActive);
                        bead.classList.toggle('tutorial-highlight', isActive);
                    }
                });
            }

            let remaining = number;
            for (let i = 0; i < columns.length && remaining > 0; i++) {
                const digit = remaining % 10;
                const column = columns[i];

                if (digit >= 5) {
                    const topBead = column.querySelector('.top-bead');
                    if (topBead) {
                        topBead.classList.add('active', 'tutorial-highlight');
                    }
                }

                const bottomCount = digit % 5;
                for (let j = 0; j < bottomCount; j++) {
                    const bottomBead = column.querySelector(`.bottom-bead-${4 - j}`);
                    if (bottomBead) {
                        bottomBead.classList.add('active', 'tutorial-highlight');
                    }
                }

                remaining = Math.floor(remaining / 10);
            }
            window.abacus.calculateValue();

            return new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error in displayNumberWithHighlights:', error);
        }
    }

    async repeatComplementStep(complement, finalValue) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const num1 = currentQuestion.num1;
        const num2 = currentQuestion.num2;
        const isSubtraction = currentQuestion.operator === '-';

        const steps = [];
        let currentValue = num1;

        for (let i = 0; i < columns.length; i++) {
            const placeValue = Math.pow(10, i);
            const currentDigit = Math.floor((currentValue / placeValue) % 10);
            const operandDigit = Math.floor((num2 / placeValue) % 10);
            const beadMovements = [];

            if (operandDigit > 0) {
                if (isSubtraction) {
                    if (currentDigit < operandDigit) {
                        const complement = 10 - operandDigit;
                        currentValue = currentValue - Math.pow(10, i + 1) + (complement * placeValue);
                        steps.push({
                            value: currentValue,
                            desc: `Borrow from next column and subtract ${operandDigit}`,
                            beadMovements: beadMovements
                        });
                    } else {
                        currentValue -= operandDigit * placeValue;
                        if (currentDigit >= 5) {
                            beadMovements.push({columnIndex: i, beadType: 'top-bead', direction: 'remove'});
                            for (let j = 0; j < operandDigit; j++) {
                                beadMovements.push({columnIndex: i, beadType: `bottom-bead-${4-j}`, direction: 'remove'});
                            }
                        } else {
                            for (let j = 0; j < operandDigit; j++) {
                                beadMovements.push({columnIndex: i, beadType: `bottom-bead-${4-j}`, direction: 'remove'});
                            }
                        }
                        steps.push({
                            value: currentValue,
                            desc: `Subtract ${operandDigit} directly`,
                            beadMovements: beadMovements
                        });
                    }
                } else {
                    if (currentDigit + operandDigit >= 10) {
                        const complement = 10 - operandDigit;
                        currentValue = currentValue + (placeValue * 10) - (complement * placeValue);
                        steps.push({
                            value: currentValue,
                            desc: `Add 10 and subtract complement ${complement}`,
                            beadMovements: beadMovements
                        });
                    } else {
                        currentValue += operandDigit * placeValue;
                        steps.push({
                            value: currentValue,
                            desc: `Add ${operandDigit} directly`,
                            beadMovements: beadMovements
                        });
                    }
                }
            }
        }

        const animateSteps = async () => {
            window.abacus.resetAbacus();
            await this.displayNumberWithHighlights(columns, num1);

            for (const step of steps) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.displayNumberWithHighlights(columns, step.value, step.beadMovements);
            }
        };

        await animateSteps();
    }

    setupDragFunctionality(modal) {
        // Get exact window and modal dimensions
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const modalHeight = modal.offsetHeight;
        const modalWidth = modal.offsetWidth;
    
        // Calculate center position with padding
        const padding = 20;
        const centerX = Math.max(
            padding,
            Math.min(
                windowWidth - modalWidth - padding,
                (windowWidth - modalWidth) / 2
            )
        );
        const centerY = Math.max(
            padding,
            Math.min(
                windowHeight - modalHeight - padding,
                (windowHeight - modalHeight) / 2
            )
        );
    
        // Set initial position
        modal.style.left = `${centerX}px`;
        modal.style.top = `${centerY}px`;
    
        // Drag functionality
        const header = modal.querySelector('.tutorial-header');
        let isDragging = false;
        let initialX;
        let initialY;
    
        const dragStart = (e) => {
            const rect = modal.getBoundingClientRect();
            initialX = e.type === "touchstart" ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
            initialY = e.type === "touchstart" ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
            if (e.target === header || e.target.closest('.tutorial-header')) {
                isDragging = true;
            }
        };
    
        const dragEnd = () => {
            isDragging = false;
        };
    
        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                const currentClientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
                const currentClientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
                modal.style.left = `${currentClientX - initialX}px`;
                modal.style.top = `${currentClientY - initialY}px`;
            }
        };
    
        // Event listeners
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        header.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);
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
