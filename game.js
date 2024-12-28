class ArithmeticGame {
    constructor() {
        this.createGameButton();
        this.createGameModal();
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.guidedQuestions = new Set();
        
        // Add button event listeners
        document.querySelector('.check-answer').onclick = () => this.checkAnswer();
        document.querySelector('.guide-me').onclick = () => {
            this.guidedQuestions.add(this.currentQuestionIndex);
            // Add guidance logic here
        };
        document.querySelector('.next-question').onclick = () => {
            if (!this.userAnswers[this.currentQuestionIndex]) {
                this.checkAnswer();
            }
            
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
    createGameButton() {
        const button = document.createElement('button');
        button.textContent = 'Practice Game';
        button.className = 'button-common';
        button.onclick = () => this.showGameSetup();
        document.querySelector('.container').appendChild(button);
    }

    createGameModal() {
        const modal = document.createElement('div');
        modal.className = 'game-setup-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="game-setup-content">
                <h3>Game Settings</h3>
                <select id="numberRange">
                    <option value="9">Single Digit (0-9)</option>
                    <option value="99">Double Digits (0-99)</option>
                    <option value="999">Triple Digits (0-999)</option>
                </select>
                <div class="operators-selection">
                    <label><input type="checkbox" value="+" checked> Addition</label>
                    <label><input type="checkbox" value="-"> Subtraction</label>
                    <label><input type="checkbox" value="x"> Multiplication</label>
                    <label><input type="checkbox" value="/"> Division</label>
                </div>
                <select id="questionCount">
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="20">20 Questions</option>
                </select>
                <button id="startGame">Start Game</button>
            </div>
            <div class="game-question-section" style="display:none">
                <div class="question-display"></div>
                <button class="check-answer">Check Answer</button>
                <button class="guide-me">Guide Me</button>
                <button class="next-question">Next Question</button>
            </div>
            <div class="game-results" style="display:none">
                <h3>Results</h3>
                <div class="score-display"></div>
                <div class="questions-review"></div>
            </div>
        `;
        document.querySelector('.container').appendChild(modal);
    }
    generateQuestions() {
        const range = parseInt(document.getElementById('numberRange').value);
        const operators = Array.from(document.querySelectorAll('.operators-selection input:checked')).map(inp => inp.value);
        const count = parseInt(document.getElementById('questionCount').value);

        this.questions = [];
        for (let i = 0; i < count; i++) {
            let num1, num2, operator;
            let validQuestion = false;
            
            while (!validQuestion) {
                num1 = Math.floor(Math.random() * range);
                num2 = Math.floor(Math.random() * range);
                operator = operators[Math.floor(Math.random() * operators.length)];
                
                // Validate the question
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
    checkAnswer() {
        const currentValue = window.abacus.value;
        const question = this.questions[this.currentQuestionIndex];
        const expectedValue = this.calculateExpectedValue(question);

        this.userAnswers.push({
            question,
            userAnswer: currentValue,
            expectedAnswer: expectedValue,
            isGuided: this.guidedQuestions.has(this.currentQuestionIndex)
        });

        // Show immediate feedback
        const isCorrect = currentValue === expectedValue;
        document.querySelector('.question-display').innerHTML = 
            `Question ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}<br>
            <span style="color: ${isCorrect ? 'green' : 'red'}">
                Your answer: ${currentValue} (${isCorrect ? 'Correct!' : 'Incorrect - Expected: ' + expectedValue})
            </span>`;

        // Disable check button after answering
        document.querySelector('.check-answer').disabled = true;
    }
    showResults() {
        const correctCount = this.userAnswers.filter(a => a.userAnswer === a.expectedAnswer && !a.isGuided).length;
        const guidedCount = this.userAnswers.filter(a => a.isGuided).length;
        
        const resultsDiv = document.querySelector('.game-results');
        resultsDiv.innerHTML = `
            <h3>Results</h3>
            <p>Score: ${correctCount}/${this.questions.length}</p>
            <p>Questions solved with guidance: ${guidedCount}</p>
            <div class="questions-review">
                ${this.generateReviewHTML()}
            </div>
            <button class="button-common" id="resetGame">Start New Game</button>
        `;

        document.getElementById('resetGame').onclick = () => this.resetGame();
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

    showGameSetup() {
        const modal = document.querySelector('.game-setup-modal');
        modal.style.display = modal.style.display === 'none' || modal.style.display === '' ? 'block' : 'none';
        
        if (modal.style.display === 'block') {
            document.getElementById('startGame').onclick = () => {
                this.generateQuestions();
                this.startGame();
            };
        }
    }

    startGame() {
        const setupContent = document.querySelector('.game-setup-content');
        const questionSection = document.querySelector('.game-question-section');

        setupContent.style.display = 'none';
        questionSection.style.display = 'block';

        this.currentQuestionIndex = 0;
        this.showCurrentQuestion();
    }

    showCurrentQuestion() {
        window.abacus.resetAbacus();  // Add this line
        const question = this.questions[this.currentQuestionIndex];
        document.querySelector('.question-display').textContent =
            `Question ${this.currentQuestionIndex + 1}: ${question.num1} ${question.operator} ${question.num2}`;
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
    generateReviewHTML() {
        return this.userAnswers.map(answer => {
            const result = answer.userAnswer === answer.expectedAnswer ? 'Correct' : 'Incorrect';
            const guidanceText = answer.isGuided ? ' (Guided)' : '';
            return `<p>${answer.question.num1} ${answer.question.operator} ${answer.question.num2} = ${answer.userAnswer} (Expected: ${answer.expectedAnswer}) - ${result}${guidanceText}</p>`;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new ArithmeticGame();
});