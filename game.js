console.log('Loading game.js');
console.log('Dependencies check:', {
    translationService: !!window.translationService,
    abacus: !!window.abacus,
    Addition: typeof Addition !== 'undefined',
    Subtraction: typeof Subtraction !== 'undefined'
});

class ArithmeticGame {
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
        this.ready = this.init();
    }

    // Add the new method here
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
            
            if (dependencies.translationService && dependencies.abacus) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        return false;
    }

    // Modify the init method to use checkDependencies
    async init() {
        try {
            const dependenciesLoaded = await this.checkDependencies();
            if (!dependenciesLoaded) {
                throw new Error("Required services not available after timeout");
            }
            
            await Promise.all([
                window.translationService.ready,
                new Promise(resolve => {
                    if (window.tutorial && window.tutorial.translateText) {
                        resolve();
                    } else {
                        const tutorialInterval = setInterval(() => {
                            if (window.tutorial && window.tutorial.translateText) {
                                clearInterval(tutorialInterval);
                                resolve();
                            }
                        }, 100);
                    }
                })
            ]);

            console.log('Translation service and tutorial ready, creating modal...');
            await this.createGameModal();
            this.setupEventListeners();
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error in game initialization:', error);
        }
    }
    
    
    // game.js
    async updateLanguage(targetLanguage) {
        console.log('Updating game language to:', targetLanguage);

        await window.translationService.ready;

        // Remove and recreate the game modal
        const existingModal = document.querySelector('.game-setup-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Recreate the game modal with new language
        await this.createGameModal();
        this.setupEventListeners();

        // Update current game state if exists
        if (this.questions.length > 0) {
            this.questions = []; // Reset questions array
            this.currentQuestionIndex = 0; // Reset current question index
            const questionSection = document.querySelector('.game-question-section');
            const resultsSection = document.querySelector('.game-results');

            if (this.currentQuestionIndex >= this.questions.length) {
                questionSection.style.display = 'none';
                resultsSection.style.display = 'block';
                await this.showResults();
            } else {
                questionSection.style.display = 'block';
                resultsSection.style.display = 'none';
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
        const startGameBtn = document.getElementById('startGame');
        if (startGameBtn) {
            startGameBtn.onclick = () => {
                console.log('Start Game clicked');
                this.generateQuestions();
                console.log('Questions generated:', this.questions);
                this.startGame();
                const modal = document.querySelector('.game-setup-modal');
                modal.style.display = 'block';
            };
        }

        const checkAnswerBtn = document.querySelector('.check-answer');
        const guideMeBtn = document.querySelector('.guide-me');
        const nextQuestionBtn = document.querySelector('.next-question');

        if (checkAnswerBtn) {
            checkAnswerBtn.onclick = () => this.checkAnswer();
        }

        if (guideMeBtn) {
            guideMeBtn.onclick = async () => {
                const translatedTexts = {
                    nextStep: await this.translateText('Next Step'),
                    close: await this.translateText('Close')
                };

                await window.translationService.ready;
                this.cleanupTutorial();

                const gameSection = document.querySelector('.game-question-section');
                const tutorialModal = document.createElement('div');
                tutorialModal.id = 'tutorialModal';
                tutorialModal.className = 'modal tutorial-modal';

                const tutorialContent = document.createElement('div');
                tutorialContent.id = 'tutorialContent';

                const controls = document.createElement('div');
                controls.className = 'tutorial-controls';
                controls.innerHTML = `
                    <button class="tutorial-next">${translatedTexts.nextStep}</button>
                    <button class="tutorial-close">${translatedTexts.close}</button>
                `;

                tutorialModal.appendChild(tutorialContent);
                tutorialModal.appendChild(controls);
                gameSection.appendChild(tutorialModal);

                this.guidedQuestions.add(this.currentQuestionIndex);
                const currentQuestion = this.questions[this.currentQuestionIndex];

                let steps;
                switch (currentQuestion.operator) {
                    case '+':
                        steps = await this.addition.generateSteps(currentQuestion.num1, currentQuestion.num2);
                        break;
                    case '-':
                        steps = await this.subtraction.generateSteps(currentQuestion.num1, currentQuestion.num2);
                        break;
                }

                let currentStepIndex = 0;
                tutorialContent.innerHTML = steps[currentStepIndex].message;
                
                const nextBtn = tutorialModal.querySelector('.tutorial-next');
                nextBtn.onclick = () => {
                    currentStepIndex++;
                    if (currentStepIndex < steps.length) {
                        tutorialContent.innerHTML = steps[currentStepIndex].message;
                    } else {
                        nextBtn.disabled = true;
                    }
                };

                const closeBtn = tutorialModal.querySelector('.tutorial-close');
                closeBtn.onclick = () => {
                    tutorialModal.remove();
                    window.abacus.resetAbacus();
                };
            };
        }

        if (nextQuestionBtn) {
            nextQuestionBtn.onclick = () => {
                // First check if we need to record the current answer
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
                    document.querySelector('.check-answer').disabled = false;
                    this.showCurrentQuestion();
                } else {
                    const questionSection = document.querySelector('.game-question-section');
                    const resultsSection = document.querySelector('.game-results');
                    questionSection.style.display = 'none';
                    resultsSection.style.display = 'block';
                    this.showResults();
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

        const modal = document.createElement('div');
        modal.className = 'game-setup-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="game-setup-content">
                <h3>${translatedTexts.settings}</h3>
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
                <button id="startGame">${translatedTexts.start}</button>
            </div>
            <div class="game-question-section" style="display:none">
                <div class="question-display"></div>
                <button class="check-answer">${translatedTexts.checkAnswer}</button>
                <button class="guide-me">${translatedTexts.guideMe}</button>
                <button class="next-question">${translatedTexts.next}</button>
            </div>
            <div class="game-results" style="display:none">
                <h3>${translatedTexts.results}</h3>
                <div class="score-display"></div>
                <div class="questions-review"></div>
            </div>
        `;
        container.appendChild(modal);
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
        console.log('Generating questions');
        const range = parseInt(document.getElementById('numberRange').value);
        const operators = Array.from(document.querySelectorAll('.operators-selection input:checked')).map(inp => inp.value);
        const count = parseInt(document.getElementById('questionCount').value);
        console.log('Settings:', { range, operators, count });

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
    }

    async checkAnswer() {
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
        
        // Translate the strings
        const questionText = await this.translateText('Question');
        const yourAnswerText = await this.translateText('Your answer');
        const incorrectText = await this.translateText('Incorrect');
        const expectedText = await this.translateText('Expected');
        const correctText = await this.translateText('Correct!');
    
        document.querySelector('.question-display').innerHTML =
            `${questionText} ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}<br>
            <span style="color: ${isCorrect ? 'green' : 'red'}">
                ${yourAnswerText}: ${currentValue} (${isCorrect ? correctText : `${incorrectText} - ${expectedText}: ${expectedValue}`})
            </span>`;
    
        document.querySelector('.check-answer').disabled = true;
    }

    async showResults() {
        const correctCount = this.userAnswers.filter(a => a.userAnswer === a.expectedAnswer && !a.isGuided).length;
        const guidedCount = this.userAnswers.filter(a => a.isGuided).length;
        
        const resultsDiv = document.querySelector('.game-results');
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
    
        // Add event listener for the reset button
        document.getElementById('resetGame').addEventListener('click', () => {
            this.resetGame();
            document.querySelector('.game-setup-modal').style.display = 'block';
        });
    }

    resetGame() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.guidedQuestions = new Set();
        window.abacus.resetAbacus();

        const setupContent = document.querySelector('.game-setup-content');
        const questionSection = document.querySelector('.game-question-section');
        const resultsSection = document.querySelector('.game-results');

        setupContent.style.display = 'block';
        questionSection.style.display = 'none';
        resultsSection.style.display = 'none';
    }

    async showGameSetup() {
        try {
            await window.translationService.ready;
            const modal = document.querySelector('.game-setup-modal');
            if (!modal) {
                await this.createGameModal();
                const newModal = document.querySelector('.game-setup-modal');
                if (newModal) {
                    newModal.style.display = 'block';
                }
            } else {
                modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error showing game setup:', error);
        }
    }

    startGame() {
        console.log('Starting game');
        const selectedOperators = Array.from(document.querySelectorAll('.operators-selection input:checked')).map(inp => inp.value);
        if (selectedOperators.includes('+')) {
            this.addition = new Addition();
        }
        if (selectedOperators.includes('-')) {
            this.subtraction = new Subtraction();
        }

        const setupContent = document.querySelector('.game-setup-content');
        const questionSection = document.querySelector('.game-question-section');

        setupContent.style.display = 'none';
        questionSection.style.display = 'block';
        this.currentQuestionIndex = 0;
        this.showCurrentQuestion();
    }

    async showCurrentQuestion() {
        console.log('Showing question:', this.currentQuestionIndex + 1);
        window.abacus.resetAbacus();
        const question = this.questions[this.currentQuestionIndex];
    
        const display = document.querySelector('.question-display');
    
        const questionText = await this.translateText('Question');
        display.textContent = `${questionText} ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}`;
    }

    calculateExpectedValue(question) {
        switch (question.operator) {
            case '+': return question.num1 + question.num2;
            case '-': return question.num1 - question.num2;
            case 'x': return question.num1 * question.num2;
            case '/': return question.num1 / question.num2;
            default: return NaN;
        }
    }

    async generateReviewHTML() {
        const correct = await this.translateText('Correct!');  // Changed to 'Correct!'
        const incorrect = await this.translateText('Incorrect');
        const expected = await this.translateText('Expected');
        const guided = await this.translateText('Guided');
    
        return Promise.all(this.userAnswers.map(async answer => {
            const result = answer.userAnswer === answer.expectedAnswer ? correct : incorrect;
            const guidanceText = answer.isGuided ? ` (${guided})` : '';
            return `<p>${answer.question.num1} ${answer.question.operator} ${answer.question.num2} = ${answer.userAnswer} (${expected}: ${answer.expectedAnswer}) - ${result}${guidanceText}</p>`;
        })).then(results => results.join(''));
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Waiting for services...');
    try {
        // Enhanced service check with parallel loading
        await Promise.all([
            // Translation service check
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
            // Abacus check
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
